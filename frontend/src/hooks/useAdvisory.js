import { useState, useCallback, useRef, useEffect } from 'react'

const CACHE_KEY = 'km_last_advisory'
const NETWORK_KEY = 'km_network_mode'

/**
 * useOfflineMode — simulated offline/low-bandwidth mode
 * Modes: 'good' | 'poor' | 'offline'
 */
export function useOfflineMode() {
  const [mode, setMode] = useState(() => localStorage.getItem(NETWORK_KEY) || 'good')
  const [lastCached, setLastCached] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') }
    catch { return null }
  })

  const setNetworkMode = useCallback((m) => {
    setMode(m)
    localStorage.setItem(NETWORK_KEY, m)
  }, [])

  const cacheAdvisory = useCallback((data) => {
    const entry = { data, timestamp: new Date().toISOString() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
    setLastCached(entry)
  }, [])

  const isOffline  = mode === 'offline'
  const isPoor     = mode === 'poor'
  const canFetch   = mode === 'good' || mode === 'poor'

  return { mode, setNetworkMode, lastCached, cacheAdvisory, isOffline, isPoor, canFetch }
}

/**
 * useStreamingAdvisory — consumes /api/advisory/stream SSE
 * Falls back to /api/advisory on error or if mode=poor (simulated slow)
 */
export function useStreamingAdvisory({ onAgentDone, onHealthScore, onComplete, onError, offlineMode }) {
  const [streamingText, setStreamingText] = useState('')
  const [agentResults, setAgentResults] = useState({})
  const [intents, setIntents] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  const reset = useCallback(() => {
    setStreamingText('')
    setAgentResults({})
    setIntents([])
  }, [])

  const submit = useCallback(async (query, crop) => {
    if (loading) return
    setLoading(true)
    reset()

    // Offline mode: return cached if available
    if (offlineMode.isOffline) {
      setLoading(false)
      if (offlineMode.lastCached?.data) {
        onComplete?.(offlineMode.lastCached.data)
      } else {
        onError?.('You are in offline mode and no cached advisory is available.')
      }
      return
    }

    // Poor mode: skip streaming, use regular endpoint
    if (offlineMode.isPoor) {
      try {
        const res = await fetch('/api/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query, crop }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        offlineMode.cacheAdvisory(data)
        onComplete?.(data)
      } catch (e) {
        onError?.(e.message || 'Request failed')
      } finally {
        setLoading(false)
      }
      return
    }

    // Good mode: SSE stream
    try {
      const res = await fetch('/api/advisory/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, crop }),
      })

      if (!res.ok || !res.body) throw new Error('Stream unavailable')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      abortRef.current = reader

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() // keep incomplete event

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue
          const lines = rawEvent.split('\n')
          let evtType = ''
          let evtData = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) evtType = line.slice(7).trim()
            if (line.startsWith('data: '))  evtData = line.slice(6).trim()
          }
          if (!evtData) continue

          try {
            const parsed = JSON.parse(evtData)
            if (evtType === 'intent') {
              setIntents(parsed.intents || [])
            } else if (evtType === 'agent_done') {
              setAgentResults(prev => ({ ...prev, [parsed.agent]: parsed.result || { error: parsed.error } }))
              onAgentDone?.(parsed.agent, parsed.result)
            } else if (evtType === 'health_score') {
              onHealthScore?.(parsed)
            } else if (evtType === 'token') {
              setStreamingText(t => t + (parsed.token || ''))
            } else if (evtType === 'complete') {
              offlineMode.cacheAdvisory(parsed)
              onComplete?.(parsed)
              setLoading(false)
              return
            } else if (evtType === 'error') {
              throw new Error(parsed.error || 'Stream error')
            }
          } catch (parseErr) {
            // non-JSON token chunk — skip
          }
        }
      }
    } catch (e) {
      // fallback to regular advisory endpoint
      try {
        const res = await fetch('/api/advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ query, crop }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        offlineMode.cacheAdvisory(data)
        onComplete?.(data)
      } catch (fallbackErr) {
        onError?.(fallbackErr.message || 'Request failed')
      }
    } finally {
      setLoading(false)
    }
  }, [loading, offlineMode, onAgentDone, onHealthScore, onComplete, onError, reset])

  const abort = useCallback(() => {
    abortRef.current?.cancel?.()
    setLoading(false)
  }, [])

  return { submit, loading, streamingText, agentResults, intents, reset, abort }
}

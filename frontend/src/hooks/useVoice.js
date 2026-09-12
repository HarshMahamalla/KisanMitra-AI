import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useVoice — Web Speech API hook for voice input + output
 * Gracefully degrades: returns { supported: false } if API unavailable
 */
export function useVoice(lang = 'en') {
  const [supported, setSupported] = useState(false)
  const [listening, setListening]   = useState(false)
  const [speaking, setSpeaking]     = useState(false)
  const [transcript, setTranscript] = useState('')
  const recogRef = useRef(null)
  const synthRef = useRef(null)

  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechSyn = window.speechSynthesis
    if (SpeechRec && SpeechSyn) {
      setSupported(true)
      synthRef.current = SpeechSyn
    }
  }, [])

  const startListening = useCallback(() => {
    if (!supported) return
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SpeechRec()
    recogRef.current = recog

    recog.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.continuous = false

    recog.onstart  = () => setListening(true)
    recog.onend    = () => setListening(false)
    recog.onerror  = () => setListening(false)
    recog.onresult = (e) => {
      const t = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setTranscript(t)
    }

    recog.start()
  }, [supported, lang])

  const stopListening = useCallback(() => {
    recogRef.current?.stop()
    setListening(false)
  }, [])

  const speak = useCallback((text, onEnd) => {
    if (!supported || !text) return
    const synth = synthRef.current
    synth.cancel() // cancel any current speech
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.92
    utterance.pitch = 1.05

    // Try to find a matching voice
    const voices = synth.getVoices()
    const preferred = voices.find(v =>
      v.lang.startsWith(lang === 'hi' ? 'hi' : 'en') && v.localService
    ) || voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en'))
    if (preferred) utterance.voice = preferred

    utterance.onstart = () => setSpeaking(true)
    utterance.onend   = () => { setSpeaking(false); onEnd?.() }
    utterance.onerror = () => setSpeaking(false)
    synth.speak(utterance)
  }, [supported, lang])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setSpeaking(false)
  }, [])

  const clearTranscript = useCallback(() => setTranscript(''), [])

  return {
    supported,
    listening,
    speaking,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
  }
}

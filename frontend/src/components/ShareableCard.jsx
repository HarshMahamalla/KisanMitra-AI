import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Share2, Download, Check, Loader2 } from 'lucide-react'
import { useLang } from '../context/AppContext'
import { t } from '../utils/helpers'
import toast from 'react-hot-toast'

/**
 * ShareableCard — captures advisory summary as a branded PNG
 * Uses html2canvas. Falls back to clipboard copy if Share API unavailable.
 */
export default function ShareableCard({ advisory, healthScore, profile }) {
  const { lang } = useLang()
  const cardRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [done, setDone] = useState(false)

  const capture = async () => {
    setCapturing(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) { toast.error('Could not capture card.'); setCapturing(false); return }
        const file = new File([blob], 'kisanmitra-advisory.png', { type: 'image/png' })
        // Try Web Share API first (mobile)
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'KisanMitra AI Advisory', text: advisory?.summary || 'Farm advisory from KisanMitra AI' })
            setDone(true)
            setTimeout(() => setDone(false), 2000)
          } catch {}
        } else {
          // Desktop: trigger download
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'kisanmitra-advisory.png'
          a.click()
          URL.revokeObjectURL(url)
          toast.success(t('Advisory card downloaded!', 'सलाह कार्ड डाउनलोड हुआ!', lang))
          setDone(true)
          setTimeout(() => setDone(false), 2000)
        }
        setCapturing(false)
      }, 'image/png')
    } catch (err) {
      toast.error('Share failed. Please try again.')
      setCapturing(false)
    }
  }

  const score = healthScore?.score
  const grade = lang === 'hi' ? healthScore?.grade_hi : healthScore?.grade
  const color = healthScore?.color === 'green' ? '#16a34a' : healthScore?.color === 'amber' ? '#d97706' : '#dc2626'

  return (
    <div>
      {/* Hidden card that gets captured */}
      <div
        ref={cardRef}
        style={{
          position: 'absolute', left: '-9999px', top: 0,
          width: 420, padding: 24, background: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: 16, border: '1px solid #e5e7eb',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: '#16a34a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 20 }}>🌾</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>KisanMitra AI</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>किसान मित्र — Smart Farming Advisory</div>
          </div>
          {score !== undefined && (
            <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{score}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>Farm Score</div>
            </div>
          )}
        </div>

        {/* Farmer */}
        {profile?.name && (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
            👨‍🌾 {profile.name} · {profile.crop} · {profile.location}
          </div>
        )}

        {/* Summary */}
        {advisory?.summary && (
          <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Recommendation</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2328', lineHeight: 1.5 }}>{advisory.summary}</div>
          </div>
        )}
        {advisory?.summary_hi && (
          <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, marginBottom: 12, fontFamily: 'Noto Sans Devanagari, serif', fontSize: 13, color: '#166534' }}>
            {advisory.summary_hi}
          </div>
        )}

        {/* Actions */}
        {advisory?.immediate_actions?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Immediate Actions</div>
            {advisory.immediate_actions.slice(0, 3).map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, color: '#374151', marginBottom: 3 }}>
                <span style={{ color: '#16a34a' }}>✓</span> {a}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>AI-generated · Verify with local KVK</span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{new Date().toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* Share button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={capture}
        disabled={capturing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {capturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : done ? <Check className="w-3.5 h-3.5 text-kisan-600" /> : <Share2 className="w-3.5 h-3.5" />}
        {t(done ? 'Shared!' : 'Share Card', done ? 'शेयर हो गया!' : 'शेयर करें', lang)}
      </motion.button>
    </div>
  )
}

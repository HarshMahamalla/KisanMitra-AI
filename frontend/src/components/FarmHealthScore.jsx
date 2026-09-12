import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useLang } from '../context/AppContext'
import { t } from '../utils/helpers'

/**
 * FarmHealthScore — animated radial SVG gauge 0-100
 * Color: red <40, amber 40-70, green >70
 * Animates stroke-dashoffset on mount.
 */
export default function FarmHealthScore({ score, grade, grade_hi, color, breakdown }) {
  const { lang } = useLang()
  const [displayed, setDisplayed] = useState(0)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(100, Math.max(0, score || 0))
  const offset = circumference - (pct / 100) * circumference

  // spring-animate the number
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 })
  useEffect(() => {
    const unsub = spring.on('change', v => setDisplayed(Math.round(v)))
    return unsub
  }, [spring])
  useEffect(() => { motionVal.set(pct) }, [pct, motionVal])

  const trackColor = color === 'green' ? '#16a34a' : color === 'amber' ? '#d97706' : '#dc2626'
  const bgColor    = color === 'green' ? '#dcfce7' : color === 'amber' ? '#fef3c7' : '#fee2e2'
  const darkTrack  = color === 'green' ? '#4ade80' : color === 'amber' ? '#fbbf24' : '#f87171'

  if (score === undefined || score === null) return null

  return (
    <div className="flex items-center gap-4">
      {/* SVG ring */}
      <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" className="rotate-[-90deg]">
          {/* Track */}
          <circle cx="60" cy="60" r={radius} fill="none"
            stroke="currentColor" strokeWidth="10"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress arc */}
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.6, ease: 'easeOut', delay: 0.2 }}
            className="dark:[stroke:var(--track)]"
            style={{ '--track': darkTrack }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color: trackColor }}>
            {displayed}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-none">/ 100</span>
        </div>
      </div>

      {/* Text side */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {t('Farm Health Score', 'खेत स्वास्थ्य स्कोर', lang)}
          </span>
        </div>
        <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2`}
          style={{ background: bgColor, color: trackColor }}>
          {lang === 'hi' ? grade_hi : grade}
        </div>

        {/* Breakdown bars */}
        {breakdown && (
          <div className="space-y-1">
            {[
              { label: t('Soil', 'मिट्टी', lang), pts: breakdown.soil_pts, max: 35 },
              { label: t('Irrigation', 'सिंचाई', lang), pts: breakdown.irrigation_pts, max: 25 },
              { label: t('Pest Risk', 'कीट जोखिम', lang), pts: breakdown.pest_pts, max: 25 },
              { label: t('Market', 'बाज़ार', lang), pts: breakdown.market_pts, max: 15 },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 w-14 truncate">{b.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: trackColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.pts / b.max) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-gray-400">{b.pts}/{b.max}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

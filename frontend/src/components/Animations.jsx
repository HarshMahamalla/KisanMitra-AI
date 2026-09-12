import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import { generateRaindrops } from '../utils/helpers'

// ── Rain Overlay ───────────────────────────────────────────────────────────────
export function RainOverlay({ active }) {
  const drops = React.useMemo(() => generateRaindrops(35), [])
  if (!active) return null
  return (
    <div className="rain-overlay">
      {drops.map(d => (
        <div
          key={d.id}
          className="raindrop"
          style={{
            left: d.left,
            height: d.height,
            opacity: d.opacity,
            animationDuration: d.duration,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}

// ── Soil Moisture Wave Gauge ───────────────────────────────────────────────────
export function SoilMoistureGauge({ pct = 50, label = '', labelHi = '' }) {
  const fill = Math.min(100, Math.max(0, pct))
  const color = fill < 25 ? '#ef4444' : fill < 45 ? '#f59e0b' : fill > 75 ? '#3b82f6' : '#22c55e'

  return (
    <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {/* Wave fill */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        initial={{ height: 0 }}
        animate={{ height: `${fill}%` }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{ backgroundColor: color + '33' }}
      >
        {/* SVG wave on top of fill */}
        <svg viewBox="0 0 200 20" preserveAspectRatio="none"
          className="absolute top-0 left-0 w-full"
          style={{ marginTop: '-19px', fill: color + '66' }}
        >
          <motion.path
            animate={{ d: [
              'M0,10 C50,0 100,20 150,10 C175,5 190,12 200,10 L200,20 L0,20 Z',
              'M0,10 C40,20 90,0 140,10 C170,18 190,6 200,10 L200,20 L0,20 Z',
              'M0,10 C50,0 100,20 150,10 C175,5 190,12 200,10 L200,20 L0,20 Z',
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      {/* Label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold" style={{ color }}>{fill}%</span>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

// ── Animated Number / Price Ticker ─────────────────────────────────────────────
export function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0, duration = 1.5 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 80, damping: 20 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (inView) motionVal.set(typeof value === 'number' ? value : 0)
  }, [inView, value, motionVal])

  useEffect(() => {
    const unsub = spring.on('change', v => setDisplay(v))
    return unsub
  }, [spring])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('en-IN')

  return (
    <span ref={ref} className="price-ticker tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  )
}

// ── Skeleton Loader ────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 3, height = 'h-24' }) {
  return (
    <div className={`${height} rounded-2xl p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`shimmer mb-2 rounded ${i === 0 ? 'h-4 w-3/4' : i === lines - 1 ? 'h-3 w-1/2' : 'h-3 w-full'}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={4} height="h-32" />
      ))}
    </div>
  )
}

// ── Staggered Card Wrapper ─────────────────────────────────────────────────────
export function FadeUpCard({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────────
export function ScrollReveal({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Live Clock ─────────────────────────────────────────────────────────────────
export function LiveClock({ light = false }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className={`tabular-nums text-sm font-medium ${light ? 'text-white drop-shadow' : 'text-gray-600 dark:text-gray-300'}`}>
      {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────────────────────────
export function StatusBadge({ label, color = 'green', pulse = false }) {
  const colorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-500/25 dark:text-green-200 border-green-300 dark:border-green-500/50',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200 border-amber-300 dark:border-amber-500/50',
    red:   'bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-200 border-red-300 dark:border-red-500/50',
    // Rain warning blue — bright & visible in both modes
    blue:  'bg-blue-600 text-white dark:bg-blue-500 dark:text-white border-blue-700 dark:border-blue-400',
    gray:  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  }
  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.06, 1], opacity: [1, 0.85, 1] } : {}}
      transition={pulse ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm ${colorMap[color] || colorMap.gray}`}
    >
      {label}
    </motion.span>
  )
}

// ── Trend Arrow ───────────────────────────────────────────────────────────────
export function TrendArrow({ pct, light = false }) {
  if (pct === undefined || pct === null) return null
  const up = pct >= 0
  const colorClass = light
    ? (up ? 'text-green-200' : 'text-red-200')
    : (up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
  return (
    <motion.span
      animate={{ y: [0, up ? -2 : 2, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`inline-flex items-center text-xs font-semibold ${colorClass}`}
    >
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </motion.span>
  )
}

// ── Action Decision Banner ─────────────────────────────────────────────────────
export function ActionBanner({ action, lang }) {
  const config = {
    IRRIGATE:         { bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800', icon: '💧', text: 'Irrigate Now', hi: 'अभी पानी दें' },
    DELAY:            { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: '⏳', text: 'Delay Irrigation', hi: 'पानी बाद में दें' },
    DRAIN:            { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',   icon: '🌊', text: 'Drain Field', hi: 'खेत से पानी निकालें' },
    SELL_NOW:         { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: '💰', text: 'Sell Now', hi: 'अभी बेचें' },
    HOLD:             { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: '📦', text: 'Hold Stock', hi: 'रोक कर रखें' },
    DIVERSIFY_MARKET: { bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800', icon: '🗺️', text: 'Diversify Market', hi: 'दूसरी मंडी में बेचें' },
  }
  const c = config[action]
  if (!c) return null
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}
    >
      <span className="text-2xl">{c.icon}</span>
      <span className="font-bold text-base">
        {lang === 'hi' ? c.hi : c.text}
      </span>
    </motion.div>
  )
}

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useAnimationFrame, useReducedMotion } from 'framer-motion'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max, seed = Math.random()) => min + seed * (max - min)
const seededRand = (seed) => {
  const x = Math.sin(seed + 1) * 43758.5453123
  return x - Math.floor(x)
}

// ─── Time-of-day logic (real clock) ──────────────────────────────────────────
function getTimeOfDay(hour, min) {
  const t = hour + min / 60
  if (t >= 5 && t < 6.5) return 'dawn'
  if (t >= 6.5 && t < 17.5) return 'day'
  if (t >= 17.5 && t < 19.5) return 'dusk'
  if (t >= 19.5 || t < 5) return 'night'
  return 'day'
}

function getCelestialProgress(hour, min) {
  const t = hour + min / 60
  if (t >= 6 && t <= 18) return (t - 6) / 12
  if (t > 18) return (t - 18) / 11
  if (t < 5) return (t + 6) / 11
  return 0
}

const SKY_GRADIENTS = {
  dawn:  { top: '#1a1a4e', mid: '#e07b54', bot: '#f5cba7' },
  day:   { top: '#1a6fb5', mid: '#4fc3f7', bot: '#b2ebf2' },
  dusk:  { top: '#0d0d2b', mid: '#b71c1c', bot: '#f57c00' },
  night: { top: '#010510', mid: '#080d28', bot: '#0f1629' },
}

// ─── Static sky colors for reduced-motion fallback ───────────────────────────
const SKY_STATIC_CSS = {
  dawn:  'linear-gradient(to bottom, #1a1a4e 0%, #e07b54 55%, #f5cba7 100%)',
  day:   'linear-gradient(to bottom, #1a6fb5 0%, #4fc3f7 55%, #b2ebf2 100%)',
  dusk:  'linear-gradient(to bottom, #0d0d2b 0%, #b71c1c 55%, #f57c00 100%)',
  night: 'linear-gradient(to bottom, #010510 0%, #080d28 55%, #0f1629 100%)',
}

// ─── Star field ───────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  cx: seededRand(i * 3) * 100,
  cy: seededRand(i * 7) * 55,
  r: seededRand(i * 11) * 1.6 + 0.3,
  twinkleDelay: seededRand(i * 13) * 3,
  twinkleDur: seededRand(i * 17) * 2 + 1.5,
}))

// ─── Cloud shapes — three depths (far/mid/near) ───────────────────────────────
const CLOUD_SHAPES = {
  far: [
    'M0,20 Q8,6 18,12 Q26,2 38,10 Q50,0 62,9 Q74,2 80,14 Q88,8 90,20Z',
    'M0,18 Q10,5 22,13 Q32,1 46,10 Q58,3 70,12 Q78,6 84,18Z',
  ],
  mid: [
    'M0,25 Q10,8 22,16 Q34,4 48,13 Q62,2 74,14 Q84,8 90,25Z',
    'M0,28 Q12,10 28,18 Q42,4 58,16 Q70,6 82,18 Q90,12 96,28Z',
  ],
  near: [
    'M0,30 Q14,10 30,20 Q44,5 58,16 Q70,2 84,16 Q94,8 100,28Z',
    'M0,32 Q18,12 34,22 Q48,6 62,18 Q76,4 90,18 Q98,12 102,30Z',
  ],
}

// Build layered clouds: far (small, high, fast), mid, near (large, low, slow)
const FAR_CLOUDS = Array.from({ length: 4 }, (_, i) => ({
  id: `far-${i}`,
  shape: CLOUD_SHAPES.far[i % 2],
  y: seededRand(i * 5) * 12 + 2,
  scale: seededRand(i * 9) * 0.3 + 0.3,
  speed: seededRand(i * 7) * 10 + 20,
  startX: seededRand(i * 3) * 110 - 20,
  opacity: seededRand(i * 11) * 0.2 + 0.12,
  layer: 'far',
}))

const MID_CLOUDS = Array.from({ length: 4 }, (_, i) => ({
  id: `mid-${i}`,
  shape: CLOUD_SHAPES.mid[i % 2],
  y: seededRand(i * 5) * 14 + 6,
  scale: seededRand(i * 9) * 0.45 + 0.45,
  speed: seededRand(i * 7) * 12 + 14,
  startX: seededRand(i * 3) * 110 - 10,
  opacity: seededRand(i * 11) * 0.25 + 0.2,
  layer: 'mid',
}))

const NEAR_CLOUDS = Array.from({ length: 3 }, (_, i) => ({
  id: `near-${i}`,
  shape: CLOUD_SHAPES.near[i % 2],
  y: seededRand(i * 5) * 10 + 12,
  scale: seededRand(i * 9) * 0.5 + 0.65,
  speed: seededRand(i * 7) * 8 + 8,
  startX: seededRand(i * 3) * 110,
  opacity: seededRand(i * 11) * 0.3 + 0.3,
  layer: 'near',
}))

// ─── Fireflies ────────────────────────────────────────────────────────────────
const FIREFLIES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: seededRand(i * 4) * 90 + 5,
  y: seededRand(i * 8) * 30 + 55,
  size: seededRand(i * 6) * 2.5 + 1,
  glowColor: i % 3 === 0 ? '#fde68a' : i % 3 === 1 ? '#bbf7d0' : '#93c5fd',
  dur: seededRand(i * 12) * 3 + 2,
  delay: seededRand(i * 15) * 4,
  floatAmpX: seededRand(i * 19) * 4 + 1,
  floatAmpY: seededRand(i * 23) * 3 + 1,
}))

// ─── Raindrop streaks ─────────────────────────────────────────────────────────
const RAIN_STREAKS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: seededRand(i * 2) * 110 - 5,
  length: seededRand(i * 6) * 9 + 5,
  dur: seededRand(i * 9) * 0.45 + 0.4,
  delay: seededRand(i * 13) * 1.8,
  opacity: seededRand(i * 17) * 0.55 + 0.2,
}))

// ─── Lightning bolt paths ─────────────────────────────────────────────────────
const LIGHTNING_BOLTS = [
  { x: 30, path: 'M30,10 L26,30 L31,30 L26,52', w: 0.6 },
  { x: 65, path: 'M65,8 L60,28 L65,28 L59,50', w: 0.6 },
  { x: 48, path: 'M48,5 L43,26 L49,26 L43,48', w: 0.7 },
]

// ─── Crop path generator ──────────────────────────────────────────────────────
function getCropPath(cropType, baseX, height, swayOffset) {
  const h = height
  const sx = swayOffset
  switch (cropType) {
    case 'rice':
    case 'wheat':
      return {
        stalk: `M${baseX},100 Q${baseX + sx * 0.3},${100 - h * 0.4} ${baseX + sx},${100 - h}`,
        ear: `M${baseX + sx},${100 - h} Q${baseX + sx + 3},${100 - h - 8} ${baseX + sx + 1},${100 - h - 15}`,
        leaves: [
          `M${baseX + sx * 0.5},${100 - h * 0.5} Q${baseX + sx * 0.5 + 8 + sx * 0.3},${100 - h * 0.5 - 5} ${baseX + sx * 0.5 + 12 + sx * 0.4},${100 - h * 0.5 + 2}`,
          `M${baseX + sx * 0.7},${100 - h * 0.7} Q${baseX + sx * 0.7 - 8 + sx * 0.2},${100 - h * 0.7 - 4} ${baseX + sx * 0.7 - 11 + sx * 0.3},${100 - h * 0.7 + 3}`,
        ],
      }
    case 'maize':
    case 'corn':
      return {
        stalk: `M${baseX},100 Q${baseX + sx * 0.2},${100 - h * 0.5} ${baseX + sx * 0.6},${100 - h}`,
        ear: `M${baseX + sx * 0.5},${100 - h * 0.55} Q${baseX + sx * 0.5 + 6},${100 - h * 0.55 + 3} ${baseX + sx * 0.5 + 5},${100 - h * 0.55 + 12}`,
        leaves: [
          `M${baseX + sx * 0.3},${100 - h * 0.35} Q${baseX + sx * 0.3 + 10 + sx * 0.4},${100 - h * 0.35 - 8} ${baseX + sx * 0.3 + 18 + sx * 0.5},${100 - h * 0.35 + 1}`,
          `M${baseX + sx * 0.5},${100 - h * 0.6} Q${baseX + sx * 0.5 - 10 + sx * 0.2},${100 - h * 0.6 - 6} ${baseX + sx * 0.5 - 16 + sx * 0.3},${100 - h * 0.6 + 2}`,
        ],
      }
    default:
      return {
        stalk: `M${baseX},100 C${baseX + sx * 0.2},${100 - h * 0.33} ${baseX + sx * 0.6},${100 - h * 0.66} ${baseX + sx},${100 - h}`,
        ear: null,
        leaves: [
          `M${baseX + sx * 0.4},${100 - h * 0.4} Q${baseX + sx * 0.4 + 9 + sx * 0.3},${100 - h * 0.4 - 4} ${baseX + sx * 0.4 + 13 + sx * 0.4},${100 - h * 0.4 + 4}`,
        ],
      }
  }
}

// ─── Single Crop Stalk ────────────────────────────────────────────────────────
function CropStalk({ cropType, baseX, height, windSpeed, windDir, index }) {
  const swayAmp = Math.min(windSpeed * 0.4, 14) * windDir
  const dur = 2 + seededRand(index * 7) * 1.5
  const delay = seededRand(index * 13) * 2
  const stalkColor = cropType === 'wheat' || cropType === 'rice'
    ? '#a3be6e' : cropType === 'maize' || cropType === 'corn'
    ? '#5a8a2e' : '#4a7c3f'
  const earColor = cropType === 'wheat' ? '#d4a853' : cropType === 'rice' ? '#c8b560' : '#e8c84a'
  const paths = getCropPath(cropType, baseX, height, swayAmp * 0.15)
  return (
    <motion.g
      animate={{ rotate: [0, swayAmp * 0.6, swayAmp, swayAmp * 0.6, 0, -swayAmp * 0.3, 0] }}
      transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ originX: `${baseX}%`, originY: '100%', transformBox: 'fill-box' }}
    >
      <path d={paths.stalk} stroke={stalkColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {paths.ear && <path d={paths.ear} stroke={earColor} strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      {paths.leaves.map((lp, li) => (
        <path key={li} d={lp} stroke={stalkColor} strokeWidth="0.9" fill="none" opacity="0.85" />
      ))}
    </motion.g>
  )
}

// ─── Field Ground ─────────────────────────────────────────────────────────────
function FieldGround({ cropType, windSpeed, windDir }) {
  const stalks = useMemo(() => {
    const rows = [
      { count: 30, heightRange: [22, 30] },
      { count: 24, heightRange: [18, 25] },
      { count: 20, heightRange: [14, 20] },
    ]
    return rows.flatMap((row, ri) =>
      Array.from({ length: row.count }, (_, i) => ({
        id: `${ri}-${i}`,
        baseX: (i / (row.count - 1)) * 98 + 1,
        height: rand(row.heightRange[0], row.heightRange[1], seededRand(ri * 100 + i)),
        row: ri,
      }))
    )
  }, [cropType])

  return (
    <g>
      <rect x="0" y="85" width="100" height="15" fill="#4a7c3f" opacity="0.6" />
      <rect x="0" y="88" width="100" height="12" fill="#3d6b35" opacity="0.5" />
      <ellipse cx="50" cy="93" rx="52" ry="8" fill="#2d5a27" opacity="0.4" />
      {stalks.map((s, idx) => (
        <CropStalk
          key={s.id}
          cropType={cropType}
          baseX={s.baseX}
          height={s.height}
          windSpeed={windSpeed}
          windDir={windDir}
          index={idx}
        />
      ))}
    </g>
  )
}

// ─── Sun ──────────────────────────────────────────────────────────────────────
function SunBody({ progress, timeOfDay }) {
  if (timeOfDay === 'night') return null
  const cx = 5 + progress * 90
  const cy = 35 - Math.sin(progress * Math.PI) * 28
  const isHot = timeOfDay === 'day' && progress > 0.3 && progress < 0.7
  const sunColor = timeOfDay === 'dawn' || timeOfDay === 'dusk' ? '#f97316' : '#fbbf24'
  const glowColor = timeOfDay === 'dawn' || timeOfDay === 'dusk' ? '#fed7aa' : '#fef08a'
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={isHot ? 10 : 7} fill={glowColor} opacity={0.18}
        animate={{ r: isHot ? [10, 14, 10] : [7, 9, 7], opacity: isHot ? [0.18, 0.28, 0.18] : [0.15, 0.2, 0.15] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle cx={cx} cy={cy} r={5.5} fill={sunColor}
        animate={{ r: isHot ? [5.5, 6.2, 5.5] : [5.5, 5.8, 5.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180
        const x1 = cx + Math.cos(angle) * 7, y1 = cy + Math.sin(angle) * 7
        const x2 = cx + Math.cos(angle) * 10.5, y2 = cy + Math.sin(angle) * 10.5
        return (
          <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={sunColor} strokeWidth="0.8" strokeLinecap="round" opacity={0.7}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        )
      })}
    </g>
  )
}

// ─── Moon ─────────────────────────────────────────────────────────────────────
function MoonBody({ progress, timeOfDay }) {
  if (timeOfDay !== 'night' && timeOfDay !== 'dusk') return null
  const cx = 5 + progress * 90
  const cy = 30 - Math.sin(progress * Math.PI) * 22
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={9} fill="#e0f2fe" opacity={0.08}
        animate={{ r: [9, 12, 9], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <circle cx={cx} cy={cy} r={5} fill="#e2e8f0" />
      <circle cx={cx + 2.8} cy={cy - 0.8} r={4.2} fill="#0a0f2e" />
    </g>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function StarField({ visible }) {
  if (!visible) return null
  return (
    <g>
      {STARS.map(s => (
        <motion.circle key={s.id} cx={s.cx} cy={s.cy} r={s.r} fill="white"
          animate={{ opacity: [0.2, 1, 0.2], r: [s.r, s.r * 1.4, s.r] }}
          transition={{ duration: s.twinkleDur, repeat: Infinity, delay: s.twinkleDelay, ease: 'easeInOut' }}
        />
      ))}
    </g>
  )
}

// ─── Layered Animated Clouds ──────────────────────────────────────────────────
function CloudLayer({ clouds, cloudOpacity, cloudColor, darkBelly, timeOfDay }) {
  return (
    <g>
      {clouds.map(c => (
        <motion.g key={c.id} style={{ transformBox: 'fill-box' }}
          animate={{ x: [`${c.startX}%`, `${c.startX + c.speed * 1.5}%`] }}
          transition={{ duration: c.speed * 2, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        >
          <motion.g style={{ scale: c.scale, originX: '50%', originY: '50%' }}
            animate={{ y: [0, -1.8, 0] }}
            transition={{ duration: 5 + c.id, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d={c.shape} fill={cloudColor}
              opacity={c.opacity * cloudOpacity}
              transform={`translate(-20, ${c.y})`}
            />
            {/* Lighter highlight on top edge */}
            <path d={c.shape} fill="white"
              opacity={c.opacity * cloudOpacity * 0.18}
              transform={`translate(-20, ${c.y - 1}) scale(1, 0.4)`}
            />
            {/* Dark rain belly */}
            {darkBelly && (
              <path d={c.shape} fill="#1e293b"
                opacity={c.opacity * cloudOpacity * 0.45}
                transform={`translate(-20, ${c.y + 7}) scale(1, 0.28)`}
              />
            )}
          </motion.g>
        </motion.g>
      ))}
    </g>
  )
}

function AnimatedClouds({ condition, timeOfDay }) {
  const isRain = condition?.toLowerCase().includes('rain') || condition?.toLowerCase().includes('thunder')
  const isCloudy = condition === 'Cloudy' || condition === 'Partly Cloudy'
  const cloudOpacity = isRain ? 0.95 : isCloudy ? 0.75 : 0.35
  if (cloudOpacity < 0.1) return null
  const cloudColor = timeOfDay === 'night' ? '#1e2d45'
    : timeOfDay === 'dusk' ? '#4a3045'
    : isRain ? '#546e8a'
    : '#dce8f5'
  const darkBelly = isRain || timeOfDay === 'night'
  return (
    <g>
      {/* Far layer — lightest, fastest */}
      <CloudLayer clouds={FAR_CLOUDS} cloudOpacity={cloudOpacity * 0.6} cloudColor={cloudColor} darkBelly={darkBelly} timeOfDay={timeOfDay} />
      {/* Mid layer */}
      <CloudLayer clouds={MID_CLOUDS} cloudOpacity={cloudOpacity * 0.85} cloudColor={cloudColor} darkBelly={darkBelly} timeOfDay={timeOfDay} />
      {/* Near layer — darkest, slowest */}
      <CloudLayer clouds={NEAR_CLOUDS} cloudOpacity={cloudOpacity} cloudColor={cloudColor} darkBelly={darkBelly} timeOfDay={timeOfDay} />
    </g>
  )
}

// ─── Rain Layer ───────────────────────────────────────────────────────────────
function RainLayer({ active, windDir }) {
  if (!active) return null
  const slantX = windDir * 5
  return (
    <g opacity="0.6">
      {RAIN_STREAKS.map(r => (
        <motion.line key={r.id}
          x1={r.x} y1={-8} x2={r.x + slantX} y2={r.length}
          stroke="#93c5fd" strokeWidth="0.4" strokeLinecap="round" opacity={r.opacity}
          animate={{ y: [0, 102], opacity: [0, r.opacity, 0] }}
          transition={{ duration: r.dur, repeat: Infinity, delay: r.delay, ease: 'linear' }}
        />
      ))}
    </g>
  )
}

// ─── Lightning Flash ──────────────────────────────────────────────────────────
function LightningLayer({ active }) {
  const [boltIndex, setBoltIndex] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return
    // Random lightning strikes every 4–10s
    let timeoutId
    const scheduleStrike = () => {
      const wait = 4000 + Math.random() * 6000
      timeoutId = setTimeout(() => {
        setBoltIndex(Math.floor(Math.random() * LIGHTNING_BOLTS.length))
        setVisible(true)
        setTimeout(() => setVisible(false), 180)
        setTimeout(() => {
          setVisible(true)
          setTimeout(() => setVisible(false), 80)
        }, 260)
        scheduleStrike()
      }, wait)
    }
    scheduleStrike()
    return () => clearTimeout(timeoutId)
  }, [active])

  if (!active || !visible) return null
  const bolt = LIGHTNING_BOLTS[boltIndex]

  return (
    <g>
      {/* Sky flash */}
      <rect width="100" height="100" fill="#e8f4ff" opacity="0.12" />
      {/* Bolt */}
      <path d={bolt.path} stroke="#ffffff" strokeWidth={bolt.w + 0.8}
        fill="none" strokeLinecap="round" opacity="0.9" />
      <path d={bolt.path} stroke="#93c5fd" strokeWidth={bolt.w}
        fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Glow halo around bolt */}
      <path d={bolt.path} stroke="#bfdbfe" strokeWidth={bolt.w + 2.5}
        fill="none" strokeLinecap="round" opacity="0.15" />
    </g>
  )
}

// ─── Fireflies (night) ────────────────────────────────────────────────────────
function Fireflies({ timeOfDay }) {
  const isNight = timeOfDay === 'night' || timeOfDay === 'dusk'
  if (!isNight) return null
  return (
    <g>
      {FIREFLIES.map(f => (
        <motion.g key={f.id}
          animate={{
            x: [0, f.floatAmpX, -f.floatAmpX * 0.5, f.floatAmpX * 0.3, 0],
            y: [0, -f.floatAmpY, f.floatAmpY * 0.7, -f.floatAmpY * 0.4, 0],
          }}
          transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut', delay: f.delay }}
        >
          <motion.circle cx={f.x} cy={f.y} r={f.size * 3} fill={f.glowColor} opacity={0}
            animate={{ opacity: [0, 0.4, 0.1, 0.5, 0], r: [f.size * 2, f.size * 4, f.size * 2] }}
            transition={{ duration: f.dur * 0.7, repeat: Infinity, delay: f.delay }}
          />
          <motion.circle cx={f.x} cy={f.y} r={f.size} fill={f.glowColor}
            animate={{ opacity: [0.1, 1, 0.2, 0.9, 0.1], r: [f.size, f.size * 1.5, f.size] }}
            transition={{ duration: f.dur * 0.7, repeat: Infinity, delay: f.delay }}
          />
        </motion.g>
      ))}
    </g>
  )
}

// ─── Wind Arrow ───────────────────────────────────────────────────────────────
function WindArrow({ windSpeed, windDir, timeOfDay }) {
  if (windSpeed < 3) return null
  const textColor = timeOfDay === 'night' ? '#94a3b8' : '#475569'
  return (
    <motion.text x="96" y="8" fontSize="3.5" fill={textColor}
      textAnchor="end" fontFamily="system-ui, sans-serif" opacity={0.7}
      animate={{ opacity: [0.5, 0.9, 0.5] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      {windDir >= 0 ? '→' : '←'} {Math.round(windSpeed)} km/h
    </motion.text>
  )
}

// ─── Heat Shimmer ─────────────────────────────────────────────────────────────
function HeatShimmer({ active }) {
  if (!active) return null
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <motion.line key={i}
          x1={15 + i * 13} y1={83} x2={15 + i * 13 + seededRand(i) * 4 - 2} y2={70}
          stroke="#fbbf24" strokeWidth="0.4" strokeLinecap="round" opacity={0}
          animate={{ opacity: [0, 0.15, 0], y1: [83, 78, 83], y2: [70, 65, 70] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

// ─── Sky gradient defs ────────────────────────────────────────────────────────
function SkyBackground({ timeOfDay }) {
  const g = SKY_GRADIENTS[timeOfDay] || SKY_GRADIENTS.day
  const id = `skyGrad-${timeOfDay}`
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={g.top} />
        <stop offset="55%" stopColor={g.mid} />
        <stop offset="100%" stopColor={g.bot} />
      </linearGradient>
    </defs>
  )
}

// ─── Horizon Glow ─────────────────────────────────────────────────────────────
function HorizonGlow({ timeOfDay }) {
  if (timeOfDay !== 'dawn' && timeOfDay !== 'dusk') return null
  const color = timeOfDay === 'dawn' ? '#fed7aa' : '#fca5a5'
  return (
    <motion.ellipse cx="50" cy="82" rx="55" ry="14" fill={color} opacity={0}
      animate={{ opacity: [0.12, 0.32, 0.12] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ─── Hills (parallax depth) ───────────────────────────────────────────────────
function Hills({ timeOfDay }) {
  const fillFar = timeOfDay === 'night' ? '#0f172a' : timeOfDay === 'dusk' ? '#7c3f2f' : '#6b9e5e'
  const fillNear = timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'dusk' ? '#4a2e22' : '#4a7c3f'
  return (
    <g>
      <path d="M0,88 Q15,72 30,80 Q45,68 60,77 Q75,65 90,74 Q97,70 100,72 L100,90 L0,90Z"
        fill={fillFar} opacity="0.55" />
      <path d="M0,92 Q20,82 35,87 Q50,78 65,85 Q80,76 100,84 L100,93 L0,93Z"
        fill={fillNear} opacity="0.7" />
    </g>
  )
}

// ─── Static reduced-motion scene ─────────────────────────────────────────────
function StaticScene({ weatherData, cropType, timeOfDay }) {
  const isRain = (weatherData?.current?.condition || '').toLowerCase().includes('rain')
  const hillFar = timeOfDay === 'night' ? '#0f172a' : timeOfDay === 'dusk' ? '#7c3f2f' : '#6b9e5e'
  const hillNear = timeOfDay === 'night' ? '#1e293b' : timeOfDay === 'dusk' ? '#4a2e22' : '#4a7c3f'
  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative select-none"
      style={{ background: SKY_STATIC_CSS[timeOfDay] || SKY_STATIC_CSS.day }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="w-full h-full" style={{ display: 'block' }}>
        {/* Hills */}
        <path d="M0,88 Q15,72 30,80 Q45,68 60,77 Q75,65 90,74 Q97,70 100,72 L100,90 L0,90Z" fill={hillFar} opacity="0.55" />
        <path d="M0,92 Q20,82 35,87 Q50,78 65,85 Q80,76 100,84 L100,93 L0,93Z" fill={hillNear} opacity="0.7" />
        {/* Ground */}
        <rect x="0" y="85" width="100" height="15" fill="#4a7c3f" opacity="0.6" />
        {/* Static crop stalks */}
        {Array.from({ length: 22 }, (_, i) => {
          const bx = (i / 21) * 96 + 2
          const h = 18 + seededRand(i * 5) * 10
          return <line key={i} x1={bx} y1={100} x2={bx + seededRand(i * 7) * 2 - 1} y2={100 - h} stroke="#a3be6e" strokeWidth="1.1" opacity="0.85" />
        })}
        {/* Vignette */}
        <defs>
          <radialGradient id="vig-static" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vig-static)" />
      </svg>
    </div>
  )
}

// ─── Main WeatherScene ────────────────────────────────────────────────────────
export default function WeatherScene({ weatherData, cropType = 'wheat', height = 260 }) {
  const reducedMotion = useReducedMotion()
  const [now, setNow] = useState(new Date())
  const scrollRef = useRef(0)
  const [parallaxY, setParallaxY] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  // Subtle parallax on scroll — clouds shift upward slightly
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setParallaxY(Math.min(y * 0.08, 12))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hour = now.getHours()
  const min = now.getMinutes()
  const timeOfDay = getTimeOfDay(hour, min)
  const celestialProgress = getCelestialProgress(hour, min)

  const condition = weatherData?.current?.condition || 'Clear'
  const temp = weatherData?.current?.temperature_c || 28
  const windSpeed = weatherData?.current?.wind_speed_kmh || 8
  const isRaining = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('thunder')
  const isThunder = condition.toLowerCase().includes('thunder')
  const isHot = temp > 36 && timeOfDay === 'day'
  const windDir = 1
  const skyGradId = `skyGrad-${timeOfDay}`

  if (reducedMotion) {
    return <StaticScene weatherData={weatherData} cropType={cropType} timeOfDay={timeOfDay} />
  }

  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative select-none"
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        {/* Sky */}
        <SkyBackground timeOfDay={timeOfDay} />
        <rect width="100" height="100" fill={`url(#${skyGradId})`} />

        {/* Stars */}
        <StarField visible={timeOfDay === 'night' || timeOfDay === 'dusk'} />
        <HorizonGlow timeOfDay={timeOfDay} />

        {/* Celestial bodies */}
        <SunBody progress={celestialProgress} timeOfDay={timeOfDay} />
        <MoonBody progress={celestialProgress} timeOfDay={timeOfDay} />

        {/* Cloud layers — parallax applied via translate */}
        <g style={{ transform: `translateY(${-parallaxY * 0.4}px)` }}>
          <AnimatedClouds condition={condition} timeOfDay={timeOfDay} />
        </g>

        {/* Rain + lightning */}
        <RainLayer active={isRaining} windDir={windDir} />
        <LightningLayer active={isThunder} />

        {/* Landscape */}
        <Hills timeOfDay={timeOfDay} />
        <FieldGround cropType={cropType} windSpeed={windSpeed} windDir={windDir} />

        {/* Atmospheric effects */}
        <HeatShimmer active={isHot} />
        <Fireflies timeOfDay={timeOfDay} />
        <WindArrow windSpeed={windSpeed} windDir={windDir} timeOfDay={timeOfDay} />

        {/* Vignette */}
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="black" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#vignette)" />
      </svg>
    </div>
  )
}

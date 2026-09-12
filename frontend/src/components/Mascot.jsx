import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * KisanMitra SVG Mascot — friendly farmer face
 * States: idle | thinking | happy | concerned | speaking
 * Driven by advisory result via `state` prop.
 */

// ── Face expressions ──────────────────────────────────────────────────────────
const EXPRESSIONS = {
  idle: {
    // neutral calm smile
    eyeL: { cy: 38, rx: 4, ry: 3.5 },
    eyeR: { cy: 38, rx: 4, ry: 3.5 },
    pupilL: { cy: 39 }, pupilR: { cy: 39 },
    mouth: 'M 34 58 Q 40 64 46 58',
    eyebrowL: 'M 28 32 Q 34 28 40 32',
    eyebrowR: 'M 42 32 Q 48 28 54 32',
    blush: 0.0,
  },
  thinking: {
    eyeL: { cy: 38, rx: 4, ry: 2 },  // squinting
    eyeR: { cy: 38, rx: 4, ry: 2 },
    pupilL: { cy: 39 }, pupilR: { cy: 39 },
    mouth: 'M 34 60 Q 40 57 46 60',  // flat
    eyebrowL: 'M 28 30 Q 34 26 40 31',
    eyebrowR: 'M 42 28 Q 48 29 54 33',  // one brow up
    blush: 0.0,
  },
  happy: {
    eyeL: { cy: 40, rx: 4, ry: 1.5 }, // crescent eyes
    eyeR: { cy: 40, rx: 4, ry: 1.5 },
    pupilL: { cy: 40 }, pupilR: { cy: 40 },
    mouth: 'M 32 56 Q 40 68 48 56',  // big smile
    eyebrowL: 'M 28 30 Q 34 25 40 30',
    eyebrowR: 'M 42 30 Q 48 25 54 30',
    blush: 0.55,
  },
  concerned: {
    eyeL: { cy: 38, rx: 4, ry: 3.5 },
    eyeR: { cy: 38, rx: 4, ry: 3.5 },
    pupilL: { cy: 40 }, pupilR: { cy: 40 },
    mouth: 'M 34 62 Q 40 56 46 62',  // frown
    eyebrowL: 'M 28 34 Q 34 30 40 36',
    eyebrowR: 'M 42 36 Q 48 30 54 34',  // worried brows
    blush: 0.0,
  },
  speaking: {
    eyeL: { cy: 38, rx: 4, ry: 3.5 },
    eyeR: { cy: 38, rx: 4, ry: 3.5 },
    pupilL: { cy: 38 }, pupilR: { cy: 38 },
    mouth: 'M 34 57 Q 40 65 46 57',  // open smile
    eyebrowL: 'M 28 32 Q 34 27 40 32',
    eyebrowR: 'M 42 32 Q 48 27 54 32',
    blush: 0.3,
  },
}

function MascotSVG({ expr, speaking, thinking }) {
  const e = EXPRESSIONS[expr] || EXPRESSIONS.idle

  return (
    <svg viewBox="0 0 80 90" width="80" height="90" className="select-none">
      {/* Turban */}
      <motion.ellipse cx="40" cy="22" rx="22" ry="12" fill="#f59e0b" />
      <motion.path d="M18 22 Q 25 10 40 10 Q 55 10 62 22" fill="#d97706" />
      <circle cx="40" cy="12" r="5" fill="#fbbf24" />

      {/* Face */}
      <circle cx="40" cy="48" r="24" fill="#fde68a" />

      {/* Cheek blush */}
      {e.blush > 0 && (
        <>
          <ellipse cx="20" cy="52" rx="6" ry="4" fill="#fca5a5" opacity={e.blush} />
          <ellipse cx="60" cy="52" rx="6" ry="4" fill="#fca5a5" opacity={e.blush} />
        </>
      )}

      {/* Eyes */}
      <motion.ellipse cx="32" cy={e.eyeL.cy} rx={e.eyeL.rx} ry={e.eyeL.ry} fill="#1c1917"
        animate={{ ry: e.eyeL.ry }} transition={{ duration: 0.4 }} />
      <motion.ellipse cx="48" cy={e.eyeR.cy} rx={e.eyeR.rx} ry={e.eyeR.ry} fill="#1c1917"
        animate={{ ry: e.eyeR.ry }} transition={{ duration: 0.4 }} />

      {/* Pupils (white gleam) */}
      <circle cx="34" cy={e.pupilL.cy - 1} r="1" fill="white" />
      <circle cx="50" cy={e.pupilR.cy - 1} r="1" fill="white" />

      {/* Eyebrows */}
      <motion.path d={e.eyebrowL} stroke="#92400e" strokeWidth="1.8"
        fill="none" strokeLinecap="round"
        animate={{ d: e.eyebrowL }} transition={{ duration: 0.35 }} />
      <motion.path d={e.eyebrowR} stroke="#92400e" strokeWidth="1.8"
        fill="none" strokeLinecap="round"
        animate={{ d: e.eyebrowR }} transition={{ duration: 0.35 }} />

      {/* Mouth */}
      <motion.path
        d={e.mouth}
        stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round"
        animate={{ d: e.mouth }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />

      {/* Speaking mouth open/close */}
      {speaking && (
        <motion.ellipse cx="40" cy="60" rx="4" ry="3" fill="#92400e"
          animate={{ ry: [1, 4, 1, 3, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}

      {/* Thinking dots */}
      {thinking && (
        <g>
          {[0, 1, 2].map(i => (
            <motion.circle key={i} cx={52 + i * 5} cy={28} r="2" fill="#a3a3a3"
              animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
            />
          ))}
        </g>
      )}

      {/* Mustache */}
      <path d="M 34 63 Q 37 65 40 63 Q 43 65 46 63" stroke="#92400e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Beard line */}
      <path d="M 22 60 Q 26 70 40 72 Q 54 70 58 60" stroke="#d97706" strokeWidth="1.2" fill="#fde68a" />

      {/* Body / kurta */}
      <path d="M 20 72 Q 25 86 40 88 Q 55 86 60 72 Q 55 68 40 68 Q 25 68 20 72Z" fill="#166534" />
      <path d="M 40 68 L 40 88" stroke="#15803d" strokeWidth="1" />
    </svg>
  )
}

// ── Mascot state derivation from advisory result ───────────────────────────────
export function deriveMascotState(result, loading) {
  if (loading) return 'thinking'
  if (!result) return 'idle'

  const di = result?.domain_insights || {}
  const severity = di?.health_diagnosis?.confidence
  const market   = di?.market?.recommended_action
  const pest     = di?.health_diagnosis?.issue_detected
  const score    = result?.farm_health_score?.score

  if (pest && (severity === 'High' || result?.domain_insights?.health_diagnosis?.severity === 'Critical')) return 'concerned'
  if (di?.irrigation?.action === 'DRAIN') return 'concerned'
  if (market === 'SELL_NOW' && result?.farm_health_score?.color === 'green') return 'happy'
  if (score >= 70) return 'happy'
  if (score < 40) return 'concerned'
  return 'idle'
}

// ── Floating Mascot Widget ────────────────────────────────────────────────────
export default function Mascot({ state = 'idle', speaking = false, compact = false }) {
  const thinking = state === 'thinking'
  const expr = state

  return (
    <motion.div
      animate={thinking ? { rotate: [0, -5, 5, -3, 0] } : { rotate: 0 }}
      transition={thinking ? { duration: 1.8, repeat: Infinity } : { duration: 0.4 }}
      className={`relative ${compact ? 'w-10 h-10' : 'w-20 h-20'}`}
    >
      {/* Glow ring when happy */}
      {state === 'happy' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: ['0 0 0px #4ade80', '0 0 16px #4ade80', '0 0 0px #4ade80'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* Alert pulse when concerned */}
      {state === 'concerned' && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: ['0 0 0px #f97316', '0 0 14px #f97316', '0 0 0px #f97316'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <MascotSVG expr={expr} speaking={speaking} thinking={thinking} />
    </motion.div>
  )
}

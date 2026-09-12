// ── Language helpers ───────────────────────────────────────────────────────────
export const t = (en, hi, lang) => (lang === 'hi' ? hi : en)

export const formatPrice = (n) =>
  typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : n || '—'

export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export const cropEmoji = (crop = '') => {
  const map = {
    wheat: '🌾', rice: '🌾', maize: '🌽', corn: '🌽',
    cotton: '🤍', tomato: '🍅', potato: '🥔', onion: '🧅',
    soybean: '🫘', sugarcane: '🌿', mustard: '🌻', chickpea: '🫘',
    groundnut: '🥜',
  }
  return map[crop.toLowerCase()] || '🌱'
}

export const weatherEmoji = (condition = '') => {
  const c = condition.toLowerCase()
  if (c.includes('heavy rain')) return '⛈️'
  if (c.includes('light rain')) return '🌦️'
  if (c.includes('thunder')) return '⛈️'
  if (c.includes('cloudy')) return '☁️'
  if (c.includes('partly')) return '⛅'
  if (c.includes('clear')) return '🌤️'
  if (c.includes('sunny')) return '☀️'
  return '🌡️'
}

export const actionColor = (action) => {
  if (!action) return 'gray'
  const a = action.toUpperCase()
  if (a === 'IRRIGATE' || a === 'SELL_NOW') return 'green'
  if (a === 'DRAIN' || a === 'CRITICAL') return 'red'
  if (a === 'HOLD' || a === 'DELAY') return 'amber'
  if (a === 'DIVERSIFY_MARKET') return 'blue'
  return 'gray'
}

export const confidenceColor = (conf) => {
  if (!conf) return 'gray'
  if (conf === 'High') return 'green'
  if (conf === 'Medium') return 'amber'
  return 'red'
}

export const severityColor = (sev) => {
  if (!sev) return 'gray'
  if (sev === 'Mild') return 'green'
  if (sev === 'Moderate') return 'amber'
  if (sev === 'Severe') return 'red'
  if (sev === 'Critical') return 'red'
  return 'gray'
}

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

export const generateRaindrops = (count = 30) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    height: `${Math.random() * 50 + 30}px`,
    duration: `${Math.random() * 1.5 + 0.8}s`,
    delay: `${Math.random() * 2}s`,
    opacity: Math.random() * 0.4 + 0.2,
  }))

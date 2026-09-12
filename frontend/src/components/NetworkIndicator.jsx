import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Signal, ChevronDown, AlertCircle } from 'lucide-react'
import { useLang } from '../context/AppContext'
import { t, formatDate } from '../utils/helpers'

const MODE_CONFIG = {
  good:    { icon: Wifi,    color: 'text-kisan-600 dark:text-kisan-400',   label: 'Live',       label_hi: 'लाइव',       bg: '' },
  poor:    { icon: Signal,  color: 'text-amber-600 dark:text-amber-400',   label: 'Poor',       label_hi: 'धीमा',       bg: 'bg-amber-50 dark:bg-amber-900/10' },
  offline: { icon: WifiOff, color: 'text-red-600 dark:text-red-400',       label: 'Offline',    label_hi: 'ऑफलाइन',    bg: 'bg-red-50 dark:bg-red-900/10' },
}

/**
 * NetworkIndicator — header pill showing connection mode with dropdown to change
 */
export function NetworkIndicator({ mode, setMode }) {
  const { lang } = useLang()
  const [open, setOpen] = React.useState(false)
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.good

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${cfg.bg}`}
      >
        <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        <span className={cfg.color}>{lang === 'hi' ? cfg.label_hi : cfg.label}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {t('Simulate Network', 'नेटवर्क सिमुलेशन', lang)}
                </p>
              </div>
              {Object.entries(MODE_CONFIG).map(([m, c]) => (
                <button key={m} onClick={() => { setMode(m); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${mode === m ? 'font-semibold' : ''}`}
                >
                  <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                  <span>{lang === 'hi' ? c.label_hi : c.label}</span>
                  {mode === m && <span className="ml-auto text-kisan-600 dark:text-kisan-400 text-xs">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * OfflineBanner — shown when mode is poor or offline with cached advisory info
 */
export function OfflineBanner({ mode, lastCached, lang }) {
  if (mode === 'good') return null

  const isOffline = mode === 'offline'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`overflow-hidden ${isOffline ? 'bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-900/30'}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2.5">
          <AlertCircle className={`w-4 h-4 flex-shrink-0 ${isOffline ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <p className={`text-xs font-medium ${isOffline ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {isOffline
              ? t(
                  lastCached
                    ? `Offline mode — showing last saved advisory (${formatDate(lastCached.timestamp)}). Reconnect for live update.`
                    : 'Offline mode — no cached advisory available. Switch to Live to get advice.',
                  lastCached
                    ? `ऑफलाइन — पिछली सलाह दिखाई जा रही है (${formatDate(lastCached.timestamp)})। लाइव के लिए नेटवर्क से जुड़ें।`
                    : 'ऑफलाइन — कोई कैश नहीं। सलाह के लिए लाइव मोड पर जाएं।',
                  lang
                )
              : t(
                  'Poor connectivity — streaming disabled, responses may be slower.',
                  'धीमा नेटवर्क — स्ट्रीमिंग बंद है, जवाब धीरे आएगा।',
                  lang
                )
            }
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Lightbulb } from 'lucide-react'
import { useLang } from '../context/AppContext'
import { t } from '../utils/helpers'

/**
 * ExplainabilityPanel — shows reasoning_factors from each agent
 * as an expandable accordion beneath advisory results.
 */
export default function ExplainabilityPanel({ reasoningFactors }) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)

  if (!reasoningFactors) return null

  // Flatten all factors from all agents
  const allFactors = Object.entries(reasoningFactors).flatMap(([agent, factors]) =>
    Array.isArray(factors) ? factors.map(f => ({ ...f, agent })) : []
  ).filter(f => f.factor && f.value)

  if (allFactors.length === 0) return null

  const agentLabel = { crop: t('Crop Advisory', 'फसल सलाह', lang), irrigation: t('Irrigation', 'सिंचाई', lang), pest: t('Pest/Disease', 'कीट/रोग', lang), market: t('Market', 'बाज़ार', lang) }
  const agentColor = { crop: 'kisan', irrigation: 'blue', pest: 'amber', market: 'purple' }
  const colorClass = {
    kisan:  'bg-kisan-100 dark:bg-kisan-900/30 text-kisan-700 dark:text-kisan-400',
    blue:   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    amber:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  }

  return (
    <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          {t('Why this advice? (Explainability)', 'यह सलाह क्यों? (कारण देखें)', lang)}
          <span className="text-xs text-gray-400">({allFactors.length} {t('factors', 'कारक', lang)})</span>
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2.5">
              {allFactors.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 text-sm"
                >
                  {/* Agent badge */}
                  <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${colorClass[agentColor[f.agent]] || colorClass.blue}`}>
                    {agentLabel[f.agent] || f.agent}
                  </span>
                  {/* Factor + value */}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{f.factor}</span>
                    <span className="mx-1.5 text-gray-400">→</span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{f.value}</span>
                    {f.impact && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">{f.impact}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

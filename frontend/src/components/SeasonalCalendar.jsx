import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronRight, Sprout } from 'lucide-react'
import { fetchCalendar } from '../utils/api'
import { useLang, useProfile } from '../context/AppContext'
import { t } from '../utils/helpers'

const COLOR_MAP = {
  kisan:  { bg: 'bg-kisan-500',  light: 'bg-kisan-100  dark:bg-kisan-900/30',  text: 'text-kisan-700  dark:text-kisan-400',  border: 'border-kisan-300  dark:border-kisan-700'  },
  earth:  { bg: 'bg-earth-500',  light: 'bg-earth-100  dark:bg-earth-900/30',  text: 'text-earth-700  dark:text-earth-400',  border: 'border-earth-300  dark:border-earth-700'  },
  amber:  { bg: 'bg-amber-500',  light: 'bg-amber-100  dark:bg-amber-900/30',  text: 'text-amber-700  dark:text-amber-400',  border: 'border-amber-300  dark:border-amber-700'  },
  gold:   { bg: 'bg-yellow-400', light: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  gray:   { bg: 'bg-gray-400',   light: 'bg-gray-100   dark:bg-gray-800',      text: 'text-gray-600   dark:text-gray-400',   border: 'border-gray-300   dark:border-gray-700'   },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' },
}

function CalendarStage({ stage, index }) {
  const c = COLOR_MAP[stage.color] || COLOR_MAP.gray
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex-shrink-0 w-36 rounded-xl border-2 p-3 ${
        stage.active
          ? `${c.light} ${c.border} shadow-md`
          : stage.upcoming
          ? `bg-white dark:bg-gray-900 ${c.border} border-dashed`
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
      }`}
    >
      {/* Active pulse dot */}
      {stage.active && (
        <motion.div
          className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full ${c.bg}`}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Color bar */}
      <div className={`h-1.5 rounded-full ${c.bg} mb-2`} />

      <p className={`text-xs font-bold ${stage.active ? c.text : 'text-gray-700 dark:text-gray-300'}`}>
        {stage.label}
      </p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        {stage.start_label}{stage.start_month !== stage.end_month ? `–${stage.end_label}` : ''}
      </p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-1">
        {stage.description}
      </p>

      {/* Upcoming countdown */}
      {stage.upcoming && stage.days_until > 0 && (
        <div className={`mt-1.5 text-[10px] font-semibold ${c.text}`}>
          in {stage.days_until}d →
        </div>
      )}
    </motion.div>
  )
}

export default function SeasonalCalendar() {
  const { profile } = useProfile()
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  useEffect(() => {
    const crop = profile?.crop || 'wheat'
    setLoading(true)
    fetchCalendar(crop)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [profile?.crop])

  // Auto-scroll to active stage
  useEffect(() => {
    if (!data || !scrollRef.current) return
    const activeIdx = (data.stages || []).findIndex(s => s.active)
    if (activeIdx > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ left: activeIdx * 152, behavior: 'smooth' })
      }, 600)
    }
  }, [data])

  if (loading) return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
      <div className="flex gap-3">
        {[1,2,3,4].map(i => <div key={i} className="w-36 h-28 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />)}
      </div>
    </div>
  )

  if (!data) return null

  const cur = data.current_stage
  const nxt = data.next_stage

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-kisan-600 dark:text-kisan-400" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {t('Crop Calendar', 'फसल कैलेंडर', lang)} — <span className="capitalize">{data.crop}</span>
          </h3>
        </div>
        <span className="text-xs text-gray-400">{data.current_month_label}</span>
      </div>

      {/* Current + Next summary */}
      {(cur || nxt) && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {cur && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${(COLOR_MAP[cur.color] || COLOR_MAP.gray).light} ${(COLOR_MAP[cur.color] || COLOR_MAP.gray).text}`}>
              🟢 {t('Now', 'अभी', lang)}: {cur.label}
            </span>
          )}
          {nxt && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              ⏭ {t('Next', 'अगला', lang)}: {nxt.label} ({nxt.days_until}d)
            </span>
          )}
        </div>
      )}

      {/* Horizontal scroll timeline */}
      <div ref={scrollRef} className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {/* "Today" marker before active stage */}
        {data.stages?.map((stage, i) => (
          <React.Fragment key={i}>
            {stage.active && (
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                <div className="text-[10px] text-kisan-600 dark:text-kisan-400 font-bold rotate-[-90deg] whitespace-nowrap" style={{ height: 28 }}>
                  TODAY
                </div>
                <div className="w-0.5 flex-1 bg-kisan-400 dark:bg-kisan-600" style={{ height: 80 }} />
              </div>
            )}
            <CalendarStage stage={stage} index={i} />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

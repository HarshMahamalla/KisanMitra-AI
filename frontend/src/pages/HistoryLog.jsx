import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, Clock, MessageSquare, ChevronRight, Sprout } from 'lucide-react'
import { useHistory, useLang } from '../context/AppContext'
import { t, formatDate, cropEmoji } from '../utils/helpers'
import { FadeUpCard, ScrollReveal } from '../components/Animations'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function HistoryLog() {
  const { history, clearHistory } = useHistory()
  const { lang } = useLang()

  const handleClear = () => {
    clearHistory()
    toast.success(t('History cleared', 'इतिहास साफ हो गया', lang))
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 max-w-3xl mx-auto">
      <FadeUpCard className="mt-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-kisan-600" />
              {t('Advisory History', 'सलाह इतिहास', lang)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('Your recent KisanMitra queries', 'आपकी हाल की KisanMitra पूछताछ', lang)}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('Clear', 'साफ करें', lang)}
            </button>
          )}
        </div>
      </FadeUpCard>

      {history.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t('No queries yet', 'अभी तक कोई सवाल नहीं', lang)}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mb-5">
            {t('Your advisory queries will appear here', 'आपकी सलाह यहाँ दिखेगी', lang)}
          </p>
          <Link
            to="/ask"
            className="inline-flex items-center gap-2 px-4 py-2 bg-kisan-600 text-white rounded-xl text-sm font-medium hover:bg-kisan-700 transition-colors"
          >
            <Sprout className="w-4 h-4" />
            {t('Ask your first question', 'पहला सवाल पूछें', lang)}
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {history.map((entry, i) => (
              <ScrollReveal key={entry.id || i}>
                <Link
                  to={`/ask?q=${encodeURIComponent(entry.query)}`}
                  className="block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-kisan-300 dark:hover:border-kisan-700 hover:shadow-md transition-all group p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-kisan-50 dark:bg-kisan-900/30 flex items-center justify-center flex-shrink-0 text-base mt-0.5">
                        {cropEmoji(entry.crop)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {entry.query}
                        </p>
                        {entry.summary && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {lang === 'hi' && entry.summary_hi ? entry.summary_hi : entry.summary}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{formatDate(entry.timestamp)}</span>
                          {entry.crop && (
                            <span className="text-xs px-1.5 py-0.5 bg-kisan-50 dark:bg-kisan-900/20 text-kisan-700 dark:text-kisan-400 rounded-md capitalize">{entry.crop}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-kisan-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

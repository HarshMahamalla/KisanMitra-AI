import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, ArrowRight, Leaf, TrendingUp, Droplets, Bug, AlertTriangle, Sprout, CloudRain } from 'lucide-react'
import { useProfile, useLang } from '../context/AppContext'
import { WeatherWidget, MarketWidget, SoilWidget } from '../components/Widgets'
import { FadeUpCard, ScrollReveal, LiveClock } from '../components/Animations'
import WeatherScene from '../components/WeatherScene'
import SeasonalCalendar from '../components/SeasonalCalendar'
import { fetchWeather } from '../utils/api'
import { t, cropEmoji } from '../utils/helpers'

// ── Rain Warning Badge — highly visible in both light & dark mode ──────────────
function RainWarningBadge({ lang }) {
  return (
    <motion.div
      animate={{ boxShadow: ['0 0 0 0 rgba(59,130,246,0.5)', '0 0 0 6px rgba(59,130,246,0)', '0 0 0 0 rgba(59,130,246,0)'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 bg-blue-600 border-blue-400 text-white dark:bg-blue-500 dark:border-blue-300 dark:text-white shadow-lg"
    >
      <motion.span
        animate={{ rotate: [0, -12, 12, -8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.2 }}
        className="text-sm leading-none"
      >
        🌧️
      </motion.span>
      <span>{t('Rain Warning', 'बारिश चेतावनी', lang)}</span>
    </motion.div>
  )
}

const QUICK_QUERIES = [
  { en: 'What fertilizer should I apply now?', hi: 'अभी कौन सी खाद डालनी चाहिए?', icon: Leaf, color: 'kisan' },
  { en: 'Should I irrigate today?', hi: 'आज पानी देना चाहिए?', icon: Droplets, color: 'blue' },
  { en: 'My crop leaves are turning yellow', hi: 'फसल की पत्तियां पीली हो रही हैं', icon: Bug, color: 'amber' },
  { en: 'Is this a good time to sell at mandi?', hi: 'क्या अभी मंडी में बेचना सही है?', icon: TrendingUp, color: 'earth' },
]

// ── Welcome (no-profile) scene ────────────────────────────────────────────────
function WelcomeScreen({ lang }) {
  const [weather, setWeather] = useState(null)
  useEffect(() => {
    fetchWeather('punjab').then(setWeather).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen pt-16 pb-8 flex flex-col">
      {/* Full-page living scene */}
      <div className="relative flex-1 flex flex-col">
        <div className="relative w-full" style={{ height: '55vh', minHeight: 320 }}>
          <WeatherScene weatherData={weather} cropType="wheat" height="100%" />

          {/* Overlay: welcome text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-3xl px-8 py-8 text-center max-w-md border border-white/10 shadow-2xl">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-flex w-16 h-16 rounded-2xl bg-kisan-600/90 items-center justify-center mb-4 shadow-lg"
              >
                <Sprout className="w-9 h-9 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-1 drop-shadow">
                {t('Welcome to KisanMitra AI', 'KisanMitra AI में स्वागत है', lang)}
              </h1>
              <p className="text-white/80 text-sm mb-1 drop-shadow">
                {t("India's Smart Farming Advisory System", 'भारत का स्मार्ट खेती सलाहकार', lang)}
              </p>
              <p className="text-white/60 text-xs font-devanagari mb-6">
                {t('Personalized advice for your farm — in Hindi & English', 'हिंदी और अंग्रेज़ी में आपके खेत की सलाह', lang)}
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-kisan-600 hover:bg-kisan-500 text-white rounded-xl font-semibold text-sm shadow-lg transition-colors"
              >
                <Sprout className="w-4 h-4" />
                {t('Setup My Farm Profile', 'मेरा खेत प्रोफ़ाइल बनाएं', lang)}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile, hasProfile } = useProfile()
  const { lang } = useLang()
  const [weatherData, setWeatherData] = useState(null)
  const [rainActive, setRainActive] = useState(false)
  const [loadingWeather, setLoadingWeather] = useState(true)

  useEffect(() => {
    const loc = profile?.location || 'punjab'
    setLoadingWeather(true)
    fetchWeather(loc)
      .then(d => {
        setWeatherData(d)
        setRainActive(d?.rain_warning_48h || false)
      })
      .catch(() => {})
      .finally(() => setLoadingWeather(false))
  }, [profile?.location])

  if (!hasProfile) return <WelcomeScreen lang={lang} />

  const colorMap = {
    kisan: 'text-kisan-600 bg-kisan-50 dark:text-kisan-400 dark:bg-kisan-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
    earth: 'text-earth-600 bg-earth-50 dark:text-earth-400 dark:bg-earth-900/20',
  }

  const condition = weatherData?.current?.condition || ''
  const isRainy = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('thunder')

  return (
    <div className="min-h-screen pb-12">

      {/* ── Living Weather Hero Banner ─────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 320, marginTop: 64 }}>
        {/* The animated scene */}
        <WeatherScene
          weatherData={weatherData}
          cropType={profile?.crop || 'wheat'}
          height={320}
        />

        {/* Multi-stop gradient fade: scene → page bg */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-gray-50 via-gray-50/60 dark:from-gray-950 dark:via-gray-950/60 to-transparent pointer-events-none" />

        {/* Farmer greeting overlay */}
        <div className="absolute inset-0 flex items-end px-5 pb-10 max-w-7xl mx-auto left-0 right-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-end justify-between w-full flex-wrap gap-3"
          >
            <div>
              {/* Clock + rain badge */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="bg-black/35 backdrop-blur-md rounded-lg px-2.5 py-1 border border-white/15">
                  <LiveClock light />
                </div>
                {rainActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <RainWarningBadge lang={lang} />
                  </motion.div>
                )}
              </div>

              {/* Name + crop line */}
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg tracking-tight">
                {t(`नमस्ते, ${profile?.name || 'Kisan'} 👋`, `नमस्ते, ${profile?.name || 'किसान'} 👋`, lang)}
              </h1>
              <p className="text-white/80 text-sm drop-shadow mt-1 flex items-center gap-1.5 flex-wrap">
                <span>{cropEmoji(profile?.crop)}</span>
                <span className="capitalize font-medium">{profile?.crop}</span>
                <span className="text-white/50">·</span>
                <span>{profile?.location}</span>
                <span className="text-white/50">·</span>
                <span>{t(`${profile?.land_size} acres`, `${profile?.land_size} एकड़`, lang)}</span>
              </p>
            </div>

            {/* Ask button — gradient + shadow */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350 }}>
              <Link
                to="/ask"
                className="flex items-center gap-2 px-5 py-3 text-white rounded-xl text-sm font-semibold shadow-glow-green backdrop-blur-sm"
                style={{ background: 'linear-gradient(135deg, #3d9e4a 0%, #1d7e3a 100%)' }}
              >
                <MessageSquare className="w-4 h-4" />
                {t('Ask KisanMitra', 'सलाह लें', lang)}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Dashboard content ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 mt-5">

        {/* Widgets row — staggered entrance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[<WeatherWidget key="w" />, <MarketWidget key="m" />, <SoilWidget key="s" />].map((widget, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {widget}
            </motion.div>
          ))}
        </div>

        {/* Quick Queries */}
        <ScrollReveal>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Sprout className="w-4 h-4 text-kisan-600 dark:text-kisan-400" />
            {t('Quick Questions', 'जल्दी पूछें', lang)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_QUERIES.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to={`/ask?q=${encodeURIComponent(lang === 'hi' ? q.hi : q.en)}`}
                  className="flex items-center gap-3 p-4 km-card km-card-hover hover:border-kisan-300 dark:hover:border-kisan-700 group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[q.color]}`}>
                    <q.icon className="w-[18px] h-[18px]" />
                  </div>
                  <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {lang === 'hi' ? q.hi : q.en}
                  </p>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="w-4 h-4 text-kisan-600 dark:text-kisan-400 flex-shrink-0" />
                  </motion.div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:hidden" />
                </Link>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Seasonal Calendar */}
        <ScrollReveal className="mb-6">
          <SeasonalCalendar />
        </ScrollReveal>

        {/* Disclaimer */}
        <ScrollReveal className="mt-0">
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-900/30">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {t(
                'All weather, soil, and market data is simulated for demo purposes. Verify AI advice with your local KVK (Krishi Vigyan Kendra) before real-world application.',
                'यहाँ दिखाया गया डेटा प्रदर्शन के लिए नकली है। असली खेती में उपयोग से पहले अपने स्थानीय KVK से सलाह जरूर लें।',
                lang
              )}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

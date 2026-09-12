import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, LayoutDashboard, MessageSquare, History, User,
  Sun, Moon, Globe, Menu, X, Sprout, Bell, ChevronRight
} from 'lucide-react'
import { useTheme, useLang, useProfile } from '../context/AppContext'
import { t } from '../utils/helpers'

const NAV_ITEMS = [
  { path: '/',         icon: LayoutDashboard, en: 'Dashboard',    hi: 'डैशबोर्ड' },
  { path: '/ask',      icon: MessageSquare,   en: 'Ask KisanMitra', hi: 'सलाह लें' },
  { path: '/history',  icon: History,         en: 'History',      hi: 'इतिहास' },
  { path: '/profile',  icon: User,            en: 'My Farm',      hi: 'मेरा खेत' },
]

export default function Navbar() {
  const { dark, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang, isHindi } = useLang()
  const { profile } = useProfile()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 dark:bg-gray-950/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/60 shadow-elev-2'
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-glow-green overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3d9e4a 0%, #1d7e3a 60%, #0f5f2c 100%)' }}
            >
              <Sprout className="w-5 h-5 text-white drop-shadow" />
            </motion.div>
            <div className="leading-tight">
              <span className={`font-bold text-sm tracking-tight ${scrolled ? 'text-kisan-700 dark:text-kisan-400' : 'text-white drop-shadow'}`}>
                KisanMitra
              </span>
              <span className={`ml-1 text-xs font-devanagari ${scrolled ? 'text-gray-500 dark:text-gray-400' : 'text-white/70 drop-shadow'}`}>
                किसान मित्र
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} className="relative px-3 py-1.5">
                  <span className={`relative z-10 flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-kisan-700 dark:text-kisan-300'
                      : scrolled
                        ? 'text-gray-600 dark:text-gray-400 hover:text-kisan-600 dark:hover:text-kisan-400'
                        : 'text-white/80 hover:text-white'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    {t(item.en, item.hi, lang)}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-kisan-100/80 dark:bg-kisan-900/40 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleLang}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors duration-200 ${
                scrolled
                  ? 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                  : 'border-white/30 text-white/90 hover:bg-white/10'
              }`}
              title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
            >
              <Globe className="w-3.5 h-3.5" />
              {isHindi ? 'EN' : 'हि'}
            </motion.button>

            {/* Theme toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                scrolled
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                  : 'text-white/90 hover:bg-white/10'
              }`}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {dark ? (
                  <motion.div key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileOpen(o => !o)}
              className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
                scrolled
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-elev-4 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-glow-green"
                    style={{ background: 'linear-gradient(135deg, #3d9e4a 0%, #1d7e3a 100%)' }}>
                    <Sprout className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-kisan-700 dark:text-kisan-400">KisanMitra AI</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {profile && (
                <div className="px-5 py-3 bg-gradient-to-r from-kisan-50 to-green-50 dark:from-kisan-900/20 dark:to-green-900/10 border-b border-kisan-100/60 dark:border-kisan-900/30">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('Logged in as', 'नाम', lang)}</p>
                  <p className="font-semibold text-kisan-700 dark:text-kisan-400">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.crop} · {profile.location}</p>
                </div>
              )}

              <nav className="flex-1 px-4 py-4 space-y-1">
                {NAV_ITEMS.map(item => {
                  const active = location.pathname === item.path
                  return (
                    <Link
                      key={item.path} to={item.path}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-kisan-100 dark:bg-kisan-900/40 text-kisan-700 dark:text-kisan-400'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="w-4 h-4" />
                        {t(item.en, item.hi, lang)}
                      </span>
                      {active && <ChevronRight className="w-4 h-4 opacity-50" />}
                    </Link>
                  )
                })}
              </nav>

              <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <button onClick={toggleLang}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
                </button>
                <button onClick={toggleTheme}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

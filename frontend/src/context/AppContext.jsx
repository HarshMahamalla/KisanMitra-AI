import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()
const LangContext = createContext()
const ProfileContext = createContext()
const HistoryContext = createContext()

// ── Theme Provider ─────────────────────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('km-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('km-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Language Provider ──────────────────────────────────────────────────────────
export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('km-lang') || 'en')

  const toggle = () => setLang(l => {
    const next = l === 'en' ? 'hi' : 'en'
    localStorage.setItem('km-lang', next)
    return next
  })

  return (
    <LangContext.Provider value={{ lang, toggle, isHindi: lang === 'hi' }}>
      {children}
    </LangContext.Provider>
  )
}

// ── Profile Provider ───────────────────────────────────────────────────────────
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('km-profile') || 'null')
    } catch { return null }
  })

  const saveProfile = (data) => {
    setProfile(data)
    localStorage.setItem('km-profile', JSON.stringify(data))
  }

  return (
    <ProfileContext.Provider value={{ profile, saveProfile, hasProfile: !!profile }}>
      {children}
    </ProfileContext.Provider>
  )
}

// ── History Provider ───────────────────────────────────────────────────────────
export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([])

  const addEntry = (entry) => {
    setHistory(h => [entry, ...h].slice(0, 20))
  }

  const clearHistory = () => setHistory([])

  return (
    <HistoryContext.Provider value={{ history, addEntry, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  )
}

// ── Hooks ──────────────────────────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext)
export const useLang = () => useContext(LangContext)
export const useProfile = () => useContext(ProfileContext)
export const useHistory = () => useContext(HistoryContext)

import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import AskKisanMitra from './pages/AskKisanMitra'
import HistoryLog from './pages/HistoryLog'
import FarmerProfile from './pages/FarmerProfile'

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
)

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            background: 'var(--toast-bg, #1f2937)',
            color: '#f9fafb',
            fontSize: '13px',
            maxWidth: '360px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/ask" element={<PageTransition><AskKisanMitra /></PageTransition>} />
          <Route path="/history" element={<PageTransition><HistoryLog /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><FarmerProfile /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}

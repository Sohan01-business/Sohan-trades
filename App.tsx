import React, { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext'
import { BottomNav } from './components/BottomNav'

import Dashboard from './pages/Dashboard'
import TradesList from './pages/TradesList'
import AddTrade from './pages/AddTrade'
import TradeDetail from './pages/TradeDetail'
import EditTrade from './pages/EditTrade'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import DailyJournal from './pages/DailyJournal'
import TradingRules from './pages/TradingRules'
import RiskCalculator from './pages/RiskCalculator'

function ThemeEffect() {
  const { settings } = useApp()

  useEffect(() => {
    const root = document.documentElement
    const apply = (mode: 'dark' | 'light') => {
      root.classList.toggle('light', mode === 'light')
      root.classList.toggle('dark', mode === 'dark')
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      apply(mq.matches ? 'light' : 'dark')
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? 'light' : 'dark')
      mq.addEventListener('change', listener)
      return () => mq.removeEventListener('change', listener)
    }
    apply(settings.theme)
  }, [settings.theme])

  return null
}

function Shell() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <ThemeEffect />
      <div className="max-w-lg mx-auto pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trades" element={<TradesList />} />
          <Route path="/trades/:id" element={<TradeDetail />} />
          <Route path="/trades/:id/edit" element={<EditTrade />} />
          <Route path="/add" element={<AddTrade />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/journal" element={<DailyJournal />} />
          <Route path="/rules" element={<TradingRules />} />
          <Route path="/risk-calculator" element={<RiskCalculator />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  )
}

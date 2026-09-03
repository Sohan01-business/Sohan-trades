import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Trade, DailyJournalEntry, StrategyDef, TradingRule, Settings, ScreenshotRecord } from '../types'
import { DEFAULT_SETTINGS, DEFAULT_STRATEGIES } from '../types'
import { tradesRepo, journalRepo, strategiesRepo, rulesRepo, settingsRepo, screenshotsRepo, clearEverything } from '../db'
import { newId } from '../utils/id'
import { buildDemoTrades } from '../utils/demoData'

interface AppState {
  ready: boolean
  trades: Trade[]
  dailyJournal: DailyJournalEntry[]
  strategies: StrategyDef[]
  tradingRules: TradingRule[]
  settings: Settings

  // Trades
  saveTrade: (t: Trade) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  duplicateTrade: (id: string) => Promise<Trade | null>

  // Journal
  saveJournalEntry: (e: DailyJournalEntry) => Promise<void>

  // Strategies
  addStrategy: (name: string) => Promise<StrategyDef>
  deleteStrategy: (id: string) => Promise<void>

  // Rules
  addRule: (text: string) => Promise<void>
  updateRule: (rule: TradingRule) => Promise<void>
  deleteRule: (id: string) => Promise<void>

  // Settings
  updateSettings: (patch: Partial<Settings>) => Promise<void>

  // Screenshots
  saveScreenshot: (tradeId: string, blob: Blob, mimeType: string) => Promise<string>
  getScreenshotUrl: (id: string) => Promise<string | null>
  deleteScreenshot: (id: string) => Promise<void>

  // Demo data
  loadDemoData: () => Promise<void>
  deleteDemoData: () => Promise<void>

  // Danger zone
  wipeAllData: () => Promise<void>

  refresh: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])
  const [dailyJournal, setDailyJournal] = useState<DailyJournalEntry[]>([])
  const [strategies, setStrategies] = useState<StrategyDef[]>([])
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  const load = useCallback(async () => {
    const [t, j, s, r, cfg] = await Promise.all([
      tradesRepo.all(), journalRepo.all(), strategiesRepo.all(), rulesRepo.all(), settingsRepo.get()
    ])

    let finalStrategies = s
    if (s.length === 0) {
      // First run: seed the default strategy list.
      finalStrategies = DEFAULT_STRATEGIES.map((name) => ({ id: newId('strat'), name, isCustom: false }))
      await Promise.all(finalStrategies.map((st) => strategiesRepo.put(st)))
    }

    setTrades(t.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)))
    setDailyJournal(j)
    setStrategies(finalStrategies)
    setTradingRules(r)
    setSettings(cfg)
    setReady(true)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveTrade = useCallback(async (t: Trade) => {
    const trade = { ...t, id: t.id || newId('trade'), updatedAt: new Date().toISOString() }
    await tradesRepo.put(trade)
    if (trade.screenshotId) {
      const shot = await screenshotsRepo.get(trade.screenshotId)
      if (shot && shot.tradeId !== trade.id) {
        await screenshotsRepo.put({ ...shot, tradeId: trade.id })
      }
    }
    await load()
  }, [load])

  const deleteTrade = useCallback(async (id: string) => {
    const trade = await tradesRepo.get(id)
    if (trade?.screenshotId) await screenshotsRepo.delete(trade.screenshotId)
    await tradesRepo.delete(id)
    await load()
  }, [load])

  const duplicateTrade = useCallback(async (id: string) => {
    const t = await tradesRepo.get(id)
    if (!t) return null
    const now = new Date().toISOString()
    const copy: Trade = { ...t, id: newId('trade'), createdAt: now, updatedAt: now, screenshotId: null }
    await tradesRepo.put(copy)
    await load()
    return copy
  }, [load])

  const saveJournalEntry = useCallback(async (e: DailyJournalEntry) => {
    await journalRepo.put({ ...e, updatedAt: new Date().toISOString() })
    await load()
  }, [load])

  const addStrategy = useCallback(async (name: string) => {
    const def: StrategyDef = { id: newId('strat'), name: name.trim(), isCustom: true }
    await strategiesRepo.put(def)
    await load()
    return def
  }, [load])

  const deleteStrategy = useCallback(async (id: string) => {
    await strategiesRepo.delete(id)
    await load()
  }, [load])

  const addRule = useCallback(async (text: string) => {
    const rule: TradingRule = { id: newId('rule'), text: text.trim(), active: true, createdAt: new Date().toISOString() }
    await rulesRepo.put(rule)
    await load()
  }, [load])

  const updateRule = useCallback(async (rule: TradingRule) => {
    await rulesRepo.put(rule)
    await load()
  }, [load])

  const deleteRule = useCallback(async (id: string) => {
    await rulesRepo.delete(id)
    await load()
  }, [load])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch }
    await settingsRepo.put(next)
    setSettings(next)
  }, [settings])

  const saveScreenshot = useCallback(async (tradeId: string, blob: Blob, mimeType: string) => {
    const id = newId('shot')
    const rec: ScreenshotRecord = { id, tradeId, blob, mimeType, createdAt: new Date().toISOString() }
    await screenshotsRepo.put(rec)
    return id
  }, [])

  const getScreenshotUrl = useCallback(async (id: string) => {
    const rec = await screenshotsRepo.get(id)
    if (!rec) return null
    return URL.createObjectURL(rec.blob)
  }, [])

  const deleteScreenshot = useCallback(async (id: string) => {
    await screenshotsRepo.delete(id)
  }, [])

  const loadDemoData = useCallback(async () => {
    const demo = buildDemoTrades()
    await Promise.all(demo.map((t) => tradesRepo.put(t)))
    await updateSettings({ demoDataLoaded: true })
    await load()
  }, [load, updateSettings])

  const deleteDemoData = useCallback(async () => {
    await tradesRepo.clearDemo()
    await updateSettings({ demoDataLoaded: false })
    await load()
  }, [load, updateSettings])

  const wipeAllData = useCallback(async () => {
    await clearEverything()
    await load()
  }, [load])

  const value = useMemo<AppState>(() => ({
    ready, trades, dailyJournal, strategies, tradingRules, settings,
    saveTrade, deleteTrade, duplicateTrade,
    saveJournalEntry,
    addStrategy, deleteStrategy,
    addRule, updateRule, deleteRule,
    updateSettings,
    saveScreenshot, getScreenshotUrl, deleteScreenshot,
    loadDemoData, deleteDemoData,
    wipeAllData,
    refresh: load
  }), [ready, trades, dailyJournal, strategies, tradingRules, settings, saveTrade, deleteTrade, duplicateTrade,
      saveJournalEntry, addStrategy, deleteStrategy, addRule, updateRule, deleteRule, updateSettings,
      saveScreenshot, getScreenshotUrl, deleteScreenshot, loadDemoData, deleteDemoData, wipeAllData, load])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

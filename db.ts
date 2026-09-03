// TradeVault local database.
// Plain browser IndexedDB — no external library, no server, nothing
// leaves the device. All data lives in one database with five stores,
// matching the brief's suggested entities.

import type {
  Trade, DailyJournalEntry, StrategyDef, TradingRule, Settings, ScreenshotRecord
} from './types'
import { DEFAULT_SETTINGS } from './types'

const DB_NAME = 'tradevault-db'
const DB_VERSION = 1

export const STORES = {
  trades: 'trades',
  dailyJournal: 'dailyJournal',
  strategies: 'strategies',
  tradingRules: 'tradingRules',
  settings: 'settings',
  screenshots: 'screenshots'
} as const

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.trades)) {
        const s = db.createObjectStore(STORES.trades, { keyPath: 'id' })
        s.createIndex('date', 'date')
        s.createIndex('status', 'status')
        s.createIndex('symbol', 'symbol')
        s.createIndex('strategy', 'strategy')
      }
      if (!db.objectStoreNames.contains(STORES.dailyJournal)) {
        db.createObjectStore(STORES.dailyJournal, { keyPath: 'date' })
      }
      if (!db.objectStoreNames.contains(STORES.strategies)) {
        db.createObjectStore(STORES.strategies, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.tradingRules)) {
        db.createObjectStore(STORES.tradingRules, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.screenshots)) {
        const s = db.createObjectStore(STORES.screenshots, { keyPath: 'id' })
        s.createIndex('tradeId', 'tradeId')
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('Database upgrade blocked. Close other tabs running TradeVault and retry.'))
  })
  return dbPromise
}

function tx<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(storeName, mode)
        const store = t.objectStore(storeName)
        const req = fn(store)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
      })
  )
}

function getAll<T>(storeName: string): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(storeName, 'readonly')
        const req = t.objectStore(storeName).getAll()
        req.onsuccess = () => resolve(req.result as T[])
        req.onerror = () => reject(req.error)
      })
  )
}

// ---------- Trades ----------
export const tradesRepo = {
  all: () => getAll<Trade>(STORES.trades),
  get: (id: string) => tx<Trade | undefined>(STORES.trades, 'readonly', (s) => s.get(id)),
  put: (trade: Trade) => tx<IDBValidKey>(STORES.trades, 'readwrite', (s) => s.put(trade)),
  delete: (id: string) => tx<undefined>(STORES.trades, 'readwrite', (s) => s.delete(id)),
  clearDemo: async () => {
    const db = await openDb()
    const all = await getAll<Trade>(STORES.trades)
    const demoIds = all.filter((t) => t.isDemo).map((t) => t.id)
    await Promise.all(
      demoIds.map(
        (id) =>
          new Promise<void>((resolve, reject) => {
            const t = db.transaction(STORES.trades, 'readwrite')
            const req = t.objectStore(STORES.trades).delete(id)
            req.onsuccess = () => resolve()
            req.onerror = () => reject(req.error)
          })
      )
    )
  },
  clearAll: () => clearStore(STORES.trades)
}

// ---------- Daily Journal ----------
export const journalRepo = {
  all: () => getAll<DailyJournalEntry>(STORES.dailyJournal),
  get: (date: string) => tx<DailyJournalEntry | undefined>(STORES.dailyJournal, 'readonly', (s) => s.get(date)),
  put: (entry: DailyJournalEntry) => tx<IDBValidKey>(STORES.dailyJournal, 'readwrite', (s) => s.put(entry)),
  clearAll: () => clearStore(STORES.dailyJournal)
}

// ---------- Strategies ----------
export const strategiesRepo = {
  all: () => getAll<StrategyDef>(STORES.strategies),
  put: (s: StrategyDef) => tx<IDBValidKey>(STORES.strategies, 'readwrite', (store) => store.put(s)),
  delete: (id: string) => tx<undefined>(STORES.strategies, 'readwrite', (s) => s.delete(id)),
  clearAll: () => clearStore(STORES.strategies)
}

// ---------- Trading Rules ----------
export const rulesRepo = {
  all: () => getAll<TradingRule>(STORES.tradingRules),
  put: (r: TradingRule) => tx<IDBValidKey>(STORES.tradingRules, 'readwrite', (s) => s.put(r)),
  delete: (id: string) => tx<undefined>(STORES.tradingRules, 'readwrite', (s) => s.delete(id)),
  clearAll: () => clearStore(STORES.tradingRules)
}

// ---------- Settings ----------
export const settingsRepo = {
  get: async (): Promise<Settings> => {
    const s = await tx<Settings | undefined>(STORES.settings, 'readonly', (store) => store.get('settings'))
    return s ?? DEFAULT_SETTINGS
  },
  put: (s: Settings) => tx<IDBValidKey>(STORES.settings, 'readwrite', (store) => store.put(s))
}

// ---------- Screenshots ----------
export const screenshotsRepo = {
  get: (id: string) => tx<ScreenshotRecord | undefined>(STORES.screenshots, 'readonly', (s) => s.get(id)),
  put: (rec: ScreenshotRecord) => tx<IDBValidKey>(STORES.screenshots, 'readwrite', (s) => s.put(rec)),
  delete: (id: string) => tx<undefined>(STORES.screenshots, 'readwrite', (s) => s.delete(id)),
  all: () => getAll<ScreenshotRecord>(STORES.screenshots),
  clearAll: () => clearStore(STORES.screenshots)
}

function clearStore(storeName: string) {
  return tx<undefined>(storeName, 'readwrite', (s) => s.clear())
}

export async function clearEverything() {
  await Promise.all([
    tradesRepo.clearAll(),
    journalRepo.clearAll(),
    strategiesRepo.clearAll(),
    rulesRepo.clearAll(),
    screenshotsRepo.clearAll()
  ])
  await settingsRepo.put(DEFAULT_SETTINGS)
}

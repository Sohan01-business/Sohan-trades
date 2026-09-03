// Central domain types for TradeVault.
// Everything here is plain, serializable data — safe to store in
// IndexedDB and safe to round-trip through JSON export/import.

export type AssetType =
  | 'Crypto' | 'Forex' | 'Stocks' | 'Futures' | 'Options' | 'Commodities' | 'Indices' | 'Other'

export const ASSET_TYPES: AssetType[] = [
  'Crypto', 'Forex', 'Stocks', 'Futures', 'Options', 'Commodities', 'Indices', 'Other'
]

export type Direction = 'Long' | 'Short'
export type TradeStatus = 'Open' | 'Closed' | 'Cancelled'

export const DEFAULT_STRATEGIES = [
  'Breakout', 'Pullback', 'Support/Resistance', 'Trend Following', 'Moving Average',
  'RSI', 'MACD', 'Price Action', 'Scalping', 'Swing', 'Momentum', 'Reversal', 'Other'
]

export interface PsychologyBefore {
  emotionalState: string
  confidence: number | null // 1-10
  followedPlan: boolean | null
  plannedTrade: boolean | null
  fomo: boolean
  revengeTrade: boolean
  overtrading: boolean
  tradingAfterLoss: boolean
}

export interface PsychologyAfter {
  emotionalState: string
  followedPlan: boolean | null
  movedStopLoss: boolean
  exitedEarly: boolean
  enteredLate: boolean
  overstayed: boolean
  whatDoneCorrectly: string
  whatDoneIncorrectly: string
  whatToChange: string
}

export function emptyPsychologyBefore(): PsychologyBefore {
  return {
    emotionalState: '', confidence: null, followedPlan: null, plannedTrade: null,
    fomo: false, revengeTrade: false, overtrading: false, tradingAfterLoss: false
  }
}

export function emptyPsychologyAfter(): PsychologyAfter {
  return {
    emotionalState: '', followedPlan: null, movedStopLoss: false, exitedEarly: false,
    enteredLate: false, overstayed: false, whatDoneCorrectly: '', whatDoneIncorrectly: '', whatToChange: ''
  }
}

export interface Trade {
  id: string
  createdAt: string
  updatedAt: string
  isDemo: boolean
  quickAdd: boolean

  // Basic
  date: string        // yyyy-mm-dd
  time: string         // HH:mm
  market: string
  symbol: string
  assetType: AssetType
  direction: Direction
  broker: string
  status: TradeStatus

  // Prices & position
  entryPrice: number | null
  stopLoss: number | null
  target: number | null
  exitPrice: number | null
  exitDate: string | null
  exitTime: string | null
  quantity: number | null
  positionSize: number | null
  leverage: number | null
  marginUsed: number | null
  contractMultiplier: number | null

  // Used only by Quick Add when there isn't enough price data to derive
  // Net P&L from entry/exit/quantity. When gross P&L IS computable from
  // prices, this field is ignored in favour of the real calculation.
  manualNetPnl: number | null

  // Fees
  brokerage: number
  tradingFees: number
  taxes: number
  otherCharges: number

  // Strategy / setup
  strategy: string
  marketCondition: string
  trendDirection: string
  setupQuality: number | null   // 1-5
  confidence: number | null     // 1-10
  timeframe: string
  entryReason: string
  stopLossReason: string
  targetReason: string

  // Psychology
  psychologyBefore: PsychologyBefore
  psychologyAfter: PsychologyAfter

  // Notes
  thesis: string
  executionNotes: string
  lessonLearned: string

  // Screenshot (stored separately, referenced by id)
  screenshotId: string | null

  // Rules
  followedRules: boolean | null
}

export interface DailyJournalEntry {
  date: string // yyyy-mm-dd, primary key
  marketOutlook: string
  plan: string
  biggestMistake: string
  bestDecision: string
  emotionalState: string
  lessonLearned: string
  tomorrowFocus: string
  updatedAt: string
}

export interface StrategyDef {
  id: string
  name: string
  isCustom: boolean
}

export interface TradingRule {
  id: string
  text: string
  active: boolean
  createdAt: string
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CUSTOM'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  id: 'settings' // singleton row
  theme: ThemeMode
  currency: Currency
  customCurrencySymbol: string
  dateFormat: DateFormat
  onboardingSeen: boolean
  demoDataLoaded: boolean
}

export interface ScreenshotRecord {
  id: string
  tradeId: string
  blob: Blob
  mimeType: string
  createdAt: string
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  theme: 'dark',
  currency: 'INR',
  customCurrencySymbol: '$',
  dateFormat: 'DD/MM/YYYY',
  onboardingSeen: false,
  demoDataLoaded: false
}

export function emptyTrade(overrides: Partial<Trade> = {}): Trade {
  const now = new Date()
  const iso = now.toISOString()
  return {
    id: '',
    createdAt: iso,
    updatedAt: iso,
    isDemo: false,
    quickAdd: false,
    date: iso.slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    market: '',
    symbol: '',
    assetType: 'Stocks',
    direction: 'Long',
    broker: '',
    status: 'Open',
    entryPrice: null,
    stopLoss: null,
    target: null,
    exitPrice: null,
    exitDate: null,
    exitTime: null,
    quantity: null,
    positionSize: null,
    leverage: null,
    marginUsed: null,
    contractMultiplier: null,
    manualNetPnl: null,
    brokerage: 0,
    tradingFees: 0,
    taxes: 0,
    otherCharges: 0,
    strategy: '',
    marketCondition: '',
    trendDirection: '',
    setupQuality: null,
    confidence: null,
    timeframe: '',
    entryReason: '',
    stopLossReason: '',
    targetReason: '',
    psychologyBefore: emptyPsychologyBefore(),
    psychologyAfter: emptyPsychologyAfter(),
    thesis: '',
    executionNotes: '',
    lessonLearned: '',
    screenshotId: null,
    followedRules: null,
    ...overrides
  }
}

export interface BackupPayload {
  appName: 'TradeVault'
  exportedAt: string
  version: 1
  trades: Trade[]
  dailyJournal: DailyJournalEntry[]
  strategies: StrategyDef[]
  tradingRules: TradingRule[]
  settings: Settings
  screenshots: { id: string; tradeId: string; mimeType: string; base64: string }[]
}

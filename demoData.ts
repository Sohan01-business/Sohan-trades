import type { Trade } from '../types'
import { emptyTrade, emptyPsychologyBefore, emptyPsychologyAfter } from '../types'
import { newId } from './id'

// A small, varied, hand-picked set of demo trades so the Dashboard,
// Trades list, and Analytics pages all have something meaningful to
// show. Every one is flagged isDemo: true and quantities/prices are
// intentionally simple round numbers so they're easy to recognize as
// sample data.

interface Seed {
  daysAgo: number
  symbol: string
  assetType: Trade['assetType']
  direction: Trade['direction']
  entry: number
  exit: number | null
  stopLoss: number
  target: number
  quantity: number
  strategy: string
  status: Trade['status']
  planned: boolean
  fees?: number
}

const SEEDS: Seed[] = [
  { daysAgo: 21, symbol: 'RELIANCE', assetType: 'Stocks', direction: 'Long', entry: 2450, exit: 2510, stopLoss: 2410, target: 2540, quantity: 20, strategy: 'Breakout', status: 'Closed', planned: true, fees: 40 },
  { daysAgo: 20, symbol: 'BTCUSDT', assetType: 'Crypto', direction: 'Long', entry: 61000, exit: 59500, stopLoss: 59800, target: 64000, quantity: 0.05, strategy: 'Trend Following', status: 'Closed', planned: true, fees: 5 },
  { daysAgo: 18, symbol: 'EURUSD', assetType: 'Forex', direction: 'Short', entry: 1.0850, exit: 1.0790, stopLoss: 1.0900, target: 1.0760, quantity: 10000, strategy: 'Support/Resistance', status: 'Closed', planned: true, fees: 2 },
  { daysAgo: 16, symbol: 'NIFTY24SEPFUT', assetType: 'Futures', direction: 'Long', entry: 24800, exit: 24650, stopLoss: 24700, target: 25100, quantity: 25, strategy: 'Momentum', status: 'Closed', planned: false, fees: 60 },
  { daysAgo: 14, symbol: 'TCS', assetType: 'Stocks', direction: 'Short', entry: 3900, exit: 3820, stopLoss: 3960, target: 3780, quantity: 15, strategy: 'RSI', status: 'Closed', planned: true, fees: 35 },
  { daysAgo: 12, symbol: 'ETHUSDT', assetType: 'Crypto', direction: 'Long', entry: 3400, exit: 3600, stopLoss: 3300, target: 3700, quantity: 0.8, strategy: 'Price Action', status: 'Closed', planned: true, fees: 6 },
  { daysAgo: 10, symbol: 'GBPUSD', assetType: 'Forex', direction: 'Long', entry: 1.2650, exit: 1.2600, stopLoss: 1.2600, target: 1.2750, quantity: 8000, strategy: 'Pullback', status: 'Closed', planned: false, fees: 2 },
  { daysAgo: 9, symbol: 'INFY', assetType: 'Stocks', direction: 'Long', entry: 1800, exit: 1855, stopLoss: 1770, target: 1860, quantity: 25, strategy: 'Moving Average', status: 'Closed', planned: true, fees: 30 },
  { daysAgo: 7, symbol: 'GOLD', assetType: 'Commodities', direction: 'Long', entry: 2350, exit: 2385, stopLoss: 2330, target: 2400, quantity: 5, strategy: 'Swing', status: 'Closed', planned: true, fees: 10 },
  { daysAgo: 6, symbol: 'BANKNIFTY24SEPFUT', assetType: 'Futures', direction: 'Short', entry: 51200, exit: 51600, stopLoss: 51400, target: 50600, quantity: 15, strategy: 'Reversal', status: 'Closed', planned: false, fees: 55 },
  { daysAgo: 4, symbol: 'HDFCBANK', assetType: 'Stocks', direction: 'Long', entry: 1650, exit: 1680, stopLoss: 1625, target: 1700, quantity: 30, strategy: 'MACD', status: 'Closed', planned: true, fees: 32 },
  { daysAgo: 3, symbol: 'SOLUSDT', assetType: 'Crypto', direction: 'Short', entry: 145, exit: 138, stopLoss: 152, target: 130, quantity: 12, strategy: 'Scalping', status: 'Closed', planned: true, fees: 4 },
  { daysAgo: 1, symbol: 'NIFTY24SEPFUT', assetType: 'Futures', direction: 'Long', entry: 25050, exit: null, stopLoss: 24900, target: 25400, quantity: 25, strategy: 'Breakout', status: 'Open', planned: true, fees: 0 }
]

function isoDateDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function buildDemoTrades(): Trade[] {
  return SEEDS.map((seed) => {
    const before = emptyPsychologyBefore()
    before.plannedTrade = seed.planned
    before.confidence = seed.planned ? 7 : 4
    before.followedPlan = seed.planned
    before.fomo = !seed.planned
    const after = emptyPsychologyAfter()
    after.followedPlan = seed.planned
    if (seed.status === 'Closed') {
      after.whatDoneCorrectly = seed.planned ? 'Followed the plan and let the setup play out.' : 'Cut losses reasonably fast once wrong.'
      after.whatDoneIncorrectly = seed.planned ? '' : 'Entered without a clear trigger.'
    }

    return emptyTrade({
      id: newId('demo'),
      isDemo: true,
      date: isoDateDaysAgo(seed.daysAgo),
      time: '09:30',
      exitDate: seed.status === 'Closed' ? isoDateDaysAgo(Math.max(seed.daysAgo - 1, 0)) : null,
      exitTime: seed.status === 'Closed' ? '14:15' : null,
      market: seed.assetType === 'Forex' ? 'Forex' : seed.assetType === 'Crypto' ? 'Crypto' : 'NSE',
      symbol: seed.symbol,
      assetType: seed.assetType,
      direction: seed.direction,
      broker: 'Demo Broker',
      status: seed.status,
      entryPrice: seed.entry,
      exitPrice: seed.exit,
      stopLoss: seed.stopLoss,
      target: seed.target,
      quantity: seed.quantity,
      positionSize: seed.entry * seed.quantity,
      leverage: seed.assetType === 'Forex' ? 10 : seed.assetType === 'Futures' ? 5 : 1,
      marginUsed: null,
      contractMultiplier: null,
      brokerage: seed.fees ?? 0,
      tradingFees: 0,
      taxes: 0,
      otherCharges: 0,
      strategy: seed.strategy,
      marketCondition: 'Trending',
      trendDirection: seed.direction === 'Long' ? 'Up' : 'Down',
      setupQuality: seed.planned ? 4 : 2,
      confidence: seed.planned ? 7 : 4,
      timeframe: '15m',
      entryReason: 'Sample entry reasoning for demo data.',
      psychologyBefore: before,
      psychologyAfter: after,
      thesis: 'Demo trade thesis — replace with your own notes.',
      followedRules: seed.planned
    })
  })
}

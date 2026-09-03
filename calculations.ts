// All trading-math lives here, isolated from components.
// Guiding rule: never return NaN or raw Infinity from a function that
// a component will render directly. Use `null` for "not computable"
// and the explicit Number.POSITIVE_INFINITY sentinel (handled by
// format.ts as "∞") only for profit factor, which is conventionally
// shown as infinite when there are zero losing trades.

import type { Trade } from '../types'

// ---------- Per-trade calculations ----------

function multiplier(t: Trade): number {
  return t.contractMultiplier && t.contractMultiplier > 0 ? t.contractMultiplier : 1
}

/** Gross P&L before fees. Null if the trade doesn't have enough data yet (e.g. still open, no exit price). */
export function grossPnl(t: Trade): number | null {
  if (t.entryPrice == null || t.exitPrice == null || t.quantity == null) return null
  if (!isFinite(t.entryPrice) || !isFinite(t.exitPrice) || !isFinite(t.quantity)) return null
  const diff = t.direction === 'Long' ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice
  return diff * t.quantity * multiplier(t)
}

export function feesTotal(t: Trade): number {
  const fees = [t.brokerage, t.tradingFees, t.taxes, t.otherCharges]
  return fees.reduce((sum, f) => sum + (isFinite(f) ? f : 0), 0)
}

/**
 * Net P&L = Gross P&L - Fees. This is the number used for all
 * performance statistics. If there isn't enough price data to derive
 * a gross P&L (e.g. a Quick Add trade logged with just a result),
 * falls back to the manually entered net P&L instead.
 */
export function netPnl(t: Trade): number | null {
  const gross = grossPnl(t)
  if (gross != null) return gross - feesTotal(t)
  if (t.manualNetPnl != null && isFinite(t.manualNetPnl)) return t.manualNetPnl
  return null
}

function capitalBase(t: Trade): number | null {
  if (t.marginUsed != null && t.marginUsed > 0) return t.marginUsed
  if (t.positionSize != null && t.positionSize > 0) return t.positionSize
  if (t.entryPrice != null && t.quantity != null && t.entryPrice > 0 && t.quantity > 0) {
    return t.entryPrice * t.quantity
  }
  return null
}

export function pnlPercent(t: Trade): number | null {
  const net = netPnl(t)
  const base = capitalBase(t)
  if (net == null || base == null || base === 0) return null
  return (net / base) * 100
}

/** Planned risk in currency terms, from entry vs stop loss. */
export function plannedRisk(t: Trade): number | null {
  if (t.entryPrice == null || t.stopLoss == null || t.quantity == null) return null
  const dist = Math.abs(t.entryPrice - t.stopLoss)
  if (dist === 0) return null
  return dist * t.quantity * multiplier(t)
}

/** Potential reward in currency terms, from entry vs target. */
export function potentialReward(t: Trade): number | null {
  if (t.entryPrice == null || t.target == null || t.quantity == null) return null
  const dist = Math.abs(t.target - t.entryPrice)
  return dist * t.quantity * multiplier(t)
}

export function riskRewardRatio(t: Trade): number | null {
  const risk = plannedRisk(t)
  const reward = potentialReward(t)
  if (risk == null || reward == null || risk === 0) return null
  return reward / risk
}

/** R multiple = actual net P&L / planned risk. */
export function rMultiple(t: Trade): number | null {
  const risk = plannedRisk(t)
  const net = netPnl(t)
  if (risk == null || net == null || risk === 0) return null
  return net / risk
}

/** Trade duration in minutes, only if both entry and exit date/time are present. */
export function durationMinutes(t: Trade): number | null {
  if (!t.exitDate || !t.exitTime) return null
  const start = new Date(`${t.date}T${t.time || '00:00'}:00`)
  const end = new Date(`${t.exitDate}T${t.exitTime}:00`)
  const ms = end.getTime() - start.getTime()
  if (!isFinite(ms) || ms < 0) return null
  return ms / 60000
}

export function isWin(t: Trade): boolean | null {
  const net = netPnl(t)
  if (net == null) return null
  if (net === 0) return false
  return net > 0
}

export function isClosedWithPnl(t: Trade): boolean {
  return t.status === 'Closed' && netPnl(t) != null
}

// ---------- Aggregate stats ----------

export interface AggregateStats {
  totalTrades: number
  closedTrades: number
  wins: number
  losses: number
  winRate: number       // percent, 0 if no closed trades
  lossRate: number       // percent
  netPnl: number
  grossProfit: number
  grossLoss: number      // positive number representing the magnitude of losses
  profitFactor: number | null // null = no losses AND no profit either (0/0); Infinity sentinel when only wins
  avgWin: number
  avgLoss: number
  avgPnlPerTrade: number
  largestWin: number | null
  largestLoss: number | null
  expectancy: number
}

export function computeAggregateStats(trades: Trade[]): AggregateStats {
  const closed = trades.filter(isClosedWithPnl)
  const nets = closed.map((t) => netPnl(t) as number)
  const wins = nets.filter((n) => n > 0)
  const losses = nets.filter((n) => n < 0)

  const grossProfit = wins.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
  const netTotal = nets.reduce((a, b) => a + b, 0)

  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const lossRate = closed.length ? (losses.length / closed.length) * 100 : 0

  let profitFactor: number | null = null
  if (grossLoss > 0) profitFactor = grossProfit / grossLoss
  else if (grossProfit > 0) profitFactor = Number.POSITIVE_INFINITY

  const avgWin = wins.length ? grossProfit / wins.length : 0
  const avgLoss = losses.length ? grossLoss / losses.length : 0
  const avgPnlPerTrade = closed.length ? netTotal / closed.length : 0

  // Expectancy uses decimal win/loss rates, per spec.
  const expectancy = (winRate / 100) * avgWin - (lossRate / 100) * avgLoss

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    lossRate,
    netPnl: netTotal,
    grossProfit,
    grossLoss,
    profitFactor,
    avgWin,
    avgLoss,
    avgPnlPerTrade,
    largestWin: wins.length ? Math.max(...wins) : null,
    largestLoss: losses.length ? Math.min(...losses) : null,
    expectancy
  }
}

// ---------- Streaks ----------

export interface StreakStats {
  currentWinStreak: number
  currentLossStreak: number
  maxWinStreak: number
  maxLossStreak: number
}

export function computeStreaks(trades: Trade[]): StreakStats {
  const closed = trades
    .filter(isClosedWithPnl)
    .slice()
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  let maxWin = 0, maxLoss = 0, runWin = 0, runLoss = 0
  let currentWin = 0, currentLoss = 0

  for (const t of closed) {
    const win = isWin(t)
    if (win) {
      runWin += 1
      runLoss = 0
    } else {
      runLoss += 1
      runWin = 0
    }
    maxWin = Math.max(maxWin, runWin)
    maxLoss = Math.max(maxLoss, runLoss)
  }
  // Current streak = the run at the very end of the sorted (chronological) list.
  currentWin = runWin
  currentLoss = runLoss

  return { currentWinStreak: currentWin, currentLossStreak: currentLoss, maxWinStreak: maxWin, maxLossStreak: maxLoss }
}

// ---------- Equity curve & drawdown ----------

export type Granularity = 'daily' | 'weekly' | 'monthly' | 'all'

export interface EquityPoint {
  label: string   // bucket label (date / week / month)
  date: string    // ISO date used for sorting, first day of the bucket
  pnl: number      // net P&L within that bucket
  cumulative: number
}

function bucketKey(dateStr: string, granularity: Granularity): { key: string; label: string } {
  const d = new Date(dateStr + 'T00:00:00')
  if (granularity === 'weekly') {
    const day = d.getDay()
    const diffToMonday = (day + 6) % 7
    const monday = new Date(d)
    monday.setDate(d.getDate() - diffToMonday)
    const key = monday.toISOString().slice(0, 10)
    return { key, label: key }
  }
  if (granularity === 'monthly') {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return { key, label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
  }
  // daily / all -> bucket by day
  const key = d.toISOString().slice(0, 10)
  return { key, label: key }
}

export function buildEquityCurve(trades: Trade[], granularity: Granularity = 'daily'): EquityPoint[] {
  const closed = trades.filter(isClosedWithPnl).slice().sort((a, b) => a.date.localeCompare(b.date))
  if (closed.length === 0) return []

  const buckets = new Map<string, { label: string; pnl: number }>()
  for (const t of closed) {
    const { key, label } = bucketKey(t.date, granularity === 'all' ? 'daily' : granularity)
    const existing = buckets.get(key) ?? { label, pnl: 0 }
    existing.pnl += netPnl(t) as number
    buckets.set(key, existing)
  }

  const sortedKeys = Array.from(buckets.keys()).sort()
  let cumulative = 0
  return sortedKeys.map((key) => {
    const b = buckets.get(key)!
    cumulative += b.pnl
    return { label: b.label, date: key, pnl: b.pnl, cumulative }
  })
}

const EQUITY_VIEW_RANGE_DAYS: Record<'daily' | 'weekly' | 'monthly', number> = {
  daily: 30, weekly: 90, monthly: 365
}

/** Scopes trades to a sensible lookback window for each equity-curve view. 'all' returns everything. */
export function filterTradesForEquityView(trades: Trade[], view: Granularity): Trade[] {
  if (view === 'all') return trades
  const days = EQUITY_VIEW_RANGE_DAYS[view]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return trades.filter((t) => t.date >= cutoffStr)
}

export interface DrawdownStats {
  maxDrawdown: number         // currency, positive number
  maxDrawdownPercent: number | null
}

export function computeMaxDrawdown(equityCurve: EquityPoint[]): DrawdownStats {
  let peak = 0
  let maxDD = 0
  let maxDDPercent: number | null = null
  for (const point of equityCurve) {
    if (point.cumulative > peak) peak = point.cumulative
    const dd = peak - point.cumulative
    if (dd > maxDD) {
      maxDD = dd
      maxDDPercent = peak > 0 ? (dd / peak) * 100 : null
    }
  }
  return { maxDrawdown: maxDD, maxDrawdownPercent: maxDDPercent }
}

export function avgDurationMinutes(trades: Trade[]): number | null {
  const durations = trades.map(durationMinutes).filter((d): d is number => d != null)
  if (durations.length === 0) return null
  return durations.reduce((a, b) => a + b, 0) / durations.length
}

// ---------- Group-by breakdowns ----------

export interface GroupStat extends AggregateStats {
  key: string
}

export function groupStatsBy(trades: Trade[], keyFn: (t: Trade) => string): GroupStat[] {
  const groups = new Map<string, Trade[]>()
  for (const t of trades) {
    const key = keyFn(t) || 'Unspecified'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  return Array.from(groups.entries())
    .map(([key, list]) => ({ key, ...computeAggregateStats(list) }))
    .sort((a, b) => b.netPnl - a.netPnl)
}

export function groupPnlByStrategy(trades: Trade[]) {
  return groupStatsBy(trades, (t) => t.strategy || 'Unspecified')
}
export function groupPnlBySymbol(trades: Trade[]) {
  return groupStatsBy(trades, (t) => t.symbol || 'Unspecified')
}
export function groupPnlByDay(trades: Trade[]) {
  const closed = trades.filter(isClosedWithPnl)
  const map = new Map<string, number>()
  for (const t of closed) map.set(t.date, (map.get(t.date) ?? 0) + (netPnl(t) as number))
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, pnl]) => ({ date, pnl }))
}
export function groupPnlByMonth(trades: Trade[]) {
  const closed = trades.filter(isClosedWithPnl)
  const map = new Map<string, number>()
  for (const t of closed) {
    const month = t.date.slice(0, 7)
    map.set(month, (map.get(month) ?? 0) + (netPnl(t) as number))
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, pnl]) => ({ month, pnl }))
}

// ---------- Planned vs unplanned ----------

export interface PlannedComparison {
  planned: AggregateStats
  unplanned: AggregateStats
}

export function comparePlannedVsUnplanned(trades: Trade[]): PlannedComparison {
  const planned = trades.filter((t) => t.psychologyBefore.plannedTrade === true)
  const unplanned = trades.filter((t) => t.psychologyBefore.plannedTrade === false)
  return { planned: computeAggregateStats(planned), unplanned: computeAggregateStats(unplanned) }
}

// ---------- Risk calculator (standalone, not tied to a saved trade) ----------

export interface RiskCalcInput {
  accountBalance: number
  riskPercent: number
  entry: number
  stopLoss: number
  target: number | null
}

export interface RiskCalcResult {
  maxRiskAmount: number
  stopLossDistance: number
  potentialReward: number | null
  riskRewardRatio: number | null
  suggestedPositionSize: number | null // in units of the instrument
}

export function computeRiskCalculator(input: RiskCalcInput): RiskCalcResult {
  const maxRiskAmount = (input.accountBalance * input.riskPercent) / 100
  const stopLossDistance = Math.abs(input.entry - input.stopLoss)
  const potentialReward = input.target != null ? Math.abs(input.target - input.entry) : null
  const riskRewardRatio = potentialReward != null && stopLossDistance > 0 ? potentialReward / stopLossDistance : null
  const suggestedPositionSize = stopLossDistance > 0 ? maxRiskAmount / stopLossDistance : null
  return { maxRiskAmount, stopLossDistance, potentialReward, riskRewardRatio, suggestedPositionSize }
}

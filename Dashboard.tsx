import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import {
  computeAggregateStats, computeStreaks, buildEquityCurve, filterTradesForEquityView
} from '../utils/calculations'
import type { Granularity } from '../utils/calculations'
import { formatMoney, formatPercent, formatRatio, currencySymbol, todayIso } from '../utils/format'
import { PageHeader, Card, StatCard, StatGrid, SegmentedControl, Button, EmptyState } from '../components/ui'
import { EquityCurveChart } from '../components/Charts'

export default function Dashboard() {
  const { trades, settings, ready } = useApp()
  const [view, setView] = useState<Granularity>('daily')
  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)
  const money = (n: number | null) => formatMoney(n, symbol, { signed: true })

  const todayTrades = useMemo(() => trades.filter((t) => t.date === todayIso()), [trades])
  const today = useMemo(() => computeAggregateStats(todayTrades), [todayTrades])
  const overall = useMemo(() => computeAggregateStats(trades), [trades])
  const streaks = useMemo(() => computeStreaks(trades), [trades])

  const equityCurve = useMemo(
    () => buildEquityCurve(filterTradesForEquityView(trades, view), view === 'all' ? 'daily' : view),
    [trades, view]
  )

  if (!ready) return null

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="No trades recorded yet."
          action={<Link to="/add"><Button>+ Add your first trade</Button></Link>}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your trading performance at a glance." />

      <div className="px-4 flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Today</h2>
          <StatGrid>
            <StatCard label="Trades today" value={String(todayTrades.length)} />
            <StatCard label="Net P&L" value={money(today.netPnl)} tone={today.netPnl > 0 ? 'profit' : today.netPnl < 0 ? 'loss' : 'neutral'} />
            <StatCard label="Wins / Losses" value={`${today.wins} / ${today.losses}`} />
            <StatCard label="Win rate" value={formatPercent(today.closedTrades ? today.winRate : null)} />
            <StatCard label="Avg profit" value={money(today.wins ? today.avgWin : null)} tone="profit" />
            <StatCard label="Avg loss" value={money(today.losses ? -today.avgLoss : null)} tone="loss" />
            <StatCard label="Profit factor" value={formatRatio(today.profitFactor)} />
          </StatGrid>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-muted">Equity curve</h2>
          </div>
          <Card>
            <div className="mb-3">
              <SegmentedControl<Granularity>
                value={view} onChange={setView}
                options={[
                  { label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' }, { label: 'All Time', value: 'all' }
                ]}
              />
            </div>
            <EquityCurveChart data={equityCurve} moneyFmt={(n) => money(n)} />
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Overall</h2>
          <StatGrid>
            <StatCard label="Total trades" value={String(overall.totalTrades)} />
            <StatCard label="Wins / Losses" value={`${overall.wins} / ${overall.losses}`} />
            <StatCard label="Win rate" value={formatPercent(overall.closedTrades ? overall.winRate : null)} />
            <StatCard label="Net P&L" value={money(overall.netPnl)} tone={overall.netPnl > 0 ? 'profit' : overall.netPnl < 0 ? 'loss' : 'neutral'} />
            <StatCard label="Avg P&L / trade" value={money(overall.closedTrades ? overall.avgPnlPerTrade : null)} />
            <StatCard label="Largest win" value={money(overall.largestWin)} tone="profit" />
            <StatCard label="Largest loss" value={money(overall.largestLoss)} tone="loss" />
            <StatCard label="Current streak" value={streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak}W` : streaks.currentLossStreak > 0 ? `${streaks.currentLossStreak}L` : '—'}
              tone={streaks.currentWinStreak > 0 ? 'profit' : streaks.currentLossStreak > 0 ? 'loss' : 'neutral'} />
            <StatCard label="Max win streak" value={String(streaks.maxWinStreak)} tone="profit" />
            <StatCard label="Max loss streak" value={String(streaks.maxLossStreak)} tone="loss" />
          </StatGrid>
        </section>
      </div>
    </div>
  )
}

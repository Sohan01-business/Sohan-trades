import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import {
  computeAggregateStats, buildEquityCurve, computeMaxDrawdown, avgDurationMinutes,
  groupPnlByStrategy, groupPnlBySymbol, groupPnlByDay, groupPnlByMonth, riskRewardRatio, isClosedWithPnl,
  comparePlannedVsUnplanned
} from '../utils/calculations'
import { formatMoney, formatPercent, formatRatio, formatDuration, currencySymbol } from '../utils/format'
import { PageHeader, Card, StatCard, StatGrid, EmptyState, Button } from '../components/ui'
import { EquityCurveChart, PnlBarChart, WinRateBarChart, WinsLossesPie } from '../components/Charts'

export default function Analytics() {
  const { trades, settings } = useApp()
  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)
  const money = (n: number | null) => formatMoney(n, symbol, { signed: true })

  const stats = useMemo(() => computeAggregateStats(trades), [trades])
  const equity = useMemo(() => buildEquityCurve(trades, 'daily'), [trades])
  const drawdown = useMemo(() => computeMaxDrawdown(equity), [equity])
  const avgDuration = useMemo(() => avgDurationMinutes(trades), [trades])

  const byStrategy = useMemo(() => groupPnlByStrategy(trades), [trades])
  const bySymbol = useMemo(() => groupPnlBySymbol(trades), [trades])
  const byDay = useMemo(() => groupPnlByDay(trades), [trades])
  const byMonth = useMemo(() => groupPnlByMonth(trades), [trades])
  const plannedVsUnplanned = useMemo(() => comparePlannedVsUnplanned(trades), [trades])

  const avgRR = useMemo(() => {
    const ratios = trades.filter(isClosedWithPnl).map(riskRewardRatio).filter((r): r is number => r != null && isFinite(r))
    if (ratios.length === 0) return null
    return ratios.reduce((a, b) => a + b, 0) / ratios.length
  }, [trades])

  const hasClosed = stats.closedTrades > 0

  if (trades.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState title="Add some closed trades to see your performance." action={<Link to="/add"><Button>+ Add a trade</Button></Link>} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Based on your closed trades." />

      <div className="px-4 flex flex-col gap-6 pb-10">
        <StatGrid>
          <StatCard label="Total trades" value={String(stats.totalTrades)} />
          <StatCard label="Win rate" value={formatPercent(hasClosed ? stats.winRate : null)} />
          <StatCard label="Loss rate" value={formatPercent(hasClosed ? stats.lossRate : null)} />
          <StatCard label="Net profit" value={money(stats.netPnl)} tone={stats.netPnl > 0 ? 'profit' : stats.netPnl < 0 ? 'loss' : 'neutral'} />
          <StatCard label="Gross profit" value={money(stats.grossProfit)} tone="profit" />
          <StatCard label="Gross loss" value={money(-stats.grossLoss)} tone="loss" />
          <StatCard label="Profit factor" value={formatRatio(stats.profitFactor)} />
          <StatCard label="Expectancy" value={money(hasClosed ? stats.expectancy : null)} />
          <StatCard label="Avg win" value={money(stats.wins ? stats.avgWin : null)} tone="profit" />
          <StatCard label="Avg loss" value={money(stats.losses ? -stats.avgLoss : null)} tone="loss" />
          <StatCard label="Avg R:R" value={formatRatio(avgRR)} />
          <StatCard label="Max drawdown" value={money(drawdown.maxDrawdown ? -drawdown.maxDrawdown : 0)} tone={drawdown.maxDrawdown > 0 ? 'loss' : 'neutral'} sub={drawdown.maxDrawdownPercent != null ? formatPercent(drawdown.maxDrawdownPercent) : undefined} />
          <StatCard label="Largest win" value={money(stats.largestWin)} tone="profit" />
          <StatCard label="Largest loss" value={money(stats.largestLoss)} tone="loss" />
          <StatCard label="Avg trade duration" value={avgDuration != null ? formatDuration(avgDuration) : 'Not available'} />
        </StatGrid>

        <ChartSection title="Equity curve">
          <EquityCurveChart data={equity} moneyFmt={(n) => money(n)} />
        </ChartSection>

        <ChartSection title="Wins vs losses">
          <WinsLossesPie wins={stats.wins} losses={stats.losses} />
        </ChartSection>

        <ChartSection title="P&L by strategy">
          <PnlBarChart data={byStrategy.slice(0, 8).map((g) => ({ key: g.key, value: g.netPnl }))} moneyFmt={(n) => money(n)} />
        </ChartSection>

        <ChartSection title="P&L by symbol">
          <PnlBarChart data={bySymbol.slice(0, 8).map((g) => ({ key: g.key, value: g.netPnl }))} moneyFmt={(n) => money(n)} />
        </ChartSection>

        <ChartSection title="P&L by day">
          <PnlBarChart data={byDay.slice(-10).map((d) => ({ key: d.date.slice(5), value: d.pnl }))} moneyFmt={(n) => money(n)} />
        </ChartSection>

        <ChartSection title="P&L by month">
          <PnlBarChart data={byMonth.map((m) => ({ key: m.month, value: m.pnl }))} moneyFmt={(n) => money(n)} />
        </ChartSection>

        <ChartSection title="Win rate by strategy">
          <WinRateBarChart data={byStrategy.filter((g) => g.closedTrades > 0).slice(0, 8).map((g) => ({ key: g.key, winRate: g.winRate }))} />
        </ChartSection>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Strategy breakdown</h2>
          {byStrategy.length === 0 ? (
            <Card><span className="text-sm text-ink-muted">No strategies recorded yet.</span></Card>
          ) : (
            <div className="flex flex-col gap-2">
              {byStrategy.map((g) => (
                <Card key={g.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">{g.key}</span>
                    <span className={`font-semibold tabular-nums ${g.netPnl > 0 ? 'text-profit' : g.netPnl < 0 ? 'text-loss' : 'text-ink'}`}>{money(g.netPnl)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-ink-muted">
                    <span>{g.totalTrades} trades</span>
                    <span>{g.wins}W / {g.losses}L</span>
                    <span>{formatPercent(g.closedTrades ? g.winRate : null, 0)} win rate</span>
                    <span>{formatRatio(g.profitFactor)} PF</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Planned vs unplanned trades</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="flex flex-col gap-2">
              <span className="text-xs text-ink-muted">Planned</span>
              <span className={`font-semibold tabular-nums ${plannedVsUnplanned.planned.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{money(plannedVsUnplanned.planned.netPnl)}</span>
              <span className="text-xs text-ink-muted">{formatPercent(plannedVsUnplanned.planned.closedTrades ? plannedVsUnplanned.planned.winRate : null, 0)} win rate · {plannedVsUnplanned.planned.totalTrades} trades</span>
            </Card>
            <Card className="flex flex-col gap-2">
              <span className="text-xs text-ink-muted">Unplanned</span>
              <span className={`font-semibold tabular-nums ${plannedVsUnplanned.unplanned.netPnl >= 0 ? 'text-profit' : 'text-loss'}`}>{money(plannedVsUnplanned.unplanned.netPnl)}</span>
              <span className="text-xs text-ink-muted">{formatPercent(plannedVsUnplanned.unplanned.closedTrades ? plannedVsUnplanned.unplanned.winRate : null, 0)} win rate · {plannedVsUnplanned.unplanned.totalTrades} trades</span>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink-muted">{title}</h2>
      <Card>{children}</Card>
    </section>
  )
}

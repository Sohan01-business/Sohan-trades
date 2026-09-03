import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import {
  grossPnl, netPnl, pnlPercent, plannedRisk, potentialReward, riskRewardRatio, rMultiple, feesTotal, isWin, durationMinutes
} from '../utils/calculations'
import { formatMoney, formatPercent, formatRatio, formatR, formatDate, formatDuration, currencySymbol } from '../utils/format'
import { shortTradeRef as ref } from '../utils/id'
import {
  PageHeader, Card, Button, ConfirmDialog, StatusBadge, DirectionBadge, PnlBadge, DemoBadge
} from '../components/ui'

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { trades, settings, deleteTrade, duplicateTrade, getScreenshotUrl } = useApp()
  const trade = trades.find((t) => t.id === id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    if (trade?.screenshotId) {
      getScreenshotUrl(trade.screenshotId).then((u) => { if (!cancelled) { url = u; setScreenshotUrl(u) } })
    } else {
      setScreenshotUrl(null)
    }
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [trade?.screenshotId, getScreenshotUrl])

  if (!trade) {
    return (
      <div>
        <PageHeader title="Trade" />
        <div className="px-4 text-sm text-ink-muted">This trade could not be found. It may have been deleted.</div>
      </div>
    )
  }

  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)
  const money = (n: number | null) => formatMoney(n, symbol, { signed: true })
  const net = netPnl(trade)
  const win = isWin(trade)

  async function handleDelete() {
    await deleteTrade(trade!.id)
    navigate('/trades')
  }

  async function handleDuplicate() {
    const copy = await duplicateTrade(trade!.id)
    if (copy) navigate(`/trades/${copy.id}`)
  }

  return (
    <div>
      <PageHeader
        title={trade.symbol || 'Trade'}
        subtitle={`${ref(trade.id)} · ${formatDate(trade.date, settings.dateFormat)}`}
      />

      <div className="px-4 flex flex-col gap-4 pb-10">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={trade.status} />
          <DirectionBadge direction={trade.direction} />
          {trade.status === 'Closed' && <PnlBadge isWin={win} />}
          {trade.isDemo && <DemoBadge />}
          {trade.quickAdd && <span className="text-xs px-2 py-0.5 rounded-pill bg-base-overlay text-ink-muted">Quick Add</span>}
        </div>

        <Card className="grid grid-cols-2 gap-4">
          <Stat label="Net P&L" value={money(net)} tone={net} big />
          <Stat label="P&L %" value={formatPercent(pnlPercent(trade))} tone={pnlPercent(trade)} big />
          <Stat label="Gross P&L" value={money(grossPnl(trade))} tone={grossPnl(trade)} />
          <Stat label="Fees" value={money(-feesTotal(trade))} />
          <Stat label="Risk / Reward" value={formatRatio(riskRewardRatio(trade))} />
          <Stat label="R multiple" value={formatR(rMultiple(trade))} tone={rMultiple(trade)} />
        </Card>

        <Section title="Trade information">
          <Row label="Market" value={trade.market || '—'} />
          <Row label="Symbol" value={trade.symbol || '—'} />
          <Row label="Asset type" value={trade.assetType} />
          <Row label="Broker / platform" value={trade.broker || '—'} />
          <Row label="Time" value={trade.time || '—'} />
        </Section>

        <Section title="Execution">
          <Row label="Entry price" value={money(trade.entryPrice)} />
          <Row label="Exit price" value={money(trade.exitPrice)} />
          <Row label="Stop loss" value={money(trade.stopLoss)} />
          <Row label="Target" value={money(trade.target)} />
          <Row label="Quantity" value={trade.quantity != null ? String(trade.quantity) : '—'} />
          <Row label="Position size" value={money(trade.positionSize)} />
          <Row label="Leverage" value={trade.leverage != null ? `${trade.leverage}x` : '—'} />
          <Row label="Margin / capital used" value={money(trade.marginUsed)} />
          <Row label="Contract multiplier" value={trade.contractMultiplier != null ? String(trade.contractMultiplier) : '—'} />
          <Row label="Planned risk" value={money(plannedRisk(trade))} />
          <Row label="Potential reward" value={money(potentialReward(trade))} />
          <Row label="Duration" value={formatDuration(durationMinutes(trade))} />
        </Section>

        <Section title="Fees">
          <Row label="Brokerage" value={money(trade.brokerage)} />
          <Row label="Trading fees" value={money(trade.tradingFees)} />
          <Row label="Taxes" value={money(trade.taxes)} />
          <Row label="Other charges" value={money(trade.otherCharges)} />
        </Section>

        {(trade.strategy || trade.entryReason || trade.marketCondition) && (
          <Section title="Strategy">
            <Row label="Strategy" value={trade.strategy || '—'} />
            <Row label="Market condition" value={trade.marketCondition || '—'} />
            <Row label="Trend direction" value={trade.trendDirection || '—'} />
            <Row label="Timeframe" value={trade.timeframe || '—'} />
            <Row label="Setup quality" value={trade.setupQuality != null ? `${trade.setupQuality}/5` : '—'} />
            <Row label="Confidence" value={trade.confidence != null ? `${trade.confidence}/10` : '—'} />
            {trade.entryReason && <TextBlock label="Entry reason" value={trade.entryReason} />}
            {trade.stopLossReason && <TextBlock label="Stop-loss reason" value={trade.stopLossReason} />}
            {trade.targetReason && <TextBlock label="Target reason" value={trade.targetReason} />}
          </Section>
        )}

        <Section title="Psychology">
          <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide">Before</span>
          <Row label="Emotional state" value={trade.psychologyBefore.emotionalState || '—'} />
          <Row label="Planned trade" value={boolLabel(trade.psychologyBefore.plannedTrade)} />
          <Row label="Followed plan" value={boolLabel(trade.psychologyBefore.followedPlan)} />
          <Row label="FOMO / Revenge / Overtrading" value={[
            trade.psychologyBefore.fomo && 'FOMO', trade.psychologyBefore.revengeTrade && 'Revenge',
            trade.psychologyBefore.overtrading && 'Overtrading', trade.psychologyBefore.tradingAfterLoss && 'After a loss'
          ].filter(Boolean).join(', ') || 'None flagged'} />
          <span className="text-xs font-semibold text-ink-faint uppercase tracking-wide pt-2 block">After</span>
          <Row label="Emotional state" value={trade.psychologyAfter.emotionalState || '—'} />
          <Row label="Followed plan" value={boolLabel(trade.psychologyAfter.followedPlan)} />
          <Row label="Flags" value={[
            trade.psychologyAfter.movedStopLoss && 'Moved stop', trade.psychologyAfter.exitedEarly && 'Exited early',
            trade.psychologyAfter.enteredLate && 'Entered late', trade.psychologyAfter.overstayed && 'Overstayed'
          ].filter(Boolean).join(', ') || 'None flagged'} />
          {trade.psychologyAfter.whatDoneCorrectly && <TextBlock label="What was done correctly" value={trade.psychologyAfter.whatDoneCorrectly} />}
          {trade.psychologyAfter.whatDoneIncorrectly && <TextBlock label="What was done incorrectly" value={trade.psychologyAfter.whatDoneIncorrectly} />}
          {trade.psychologyAfter.whatToChange && <TextBlock label="What will change" value={trade.psychologyAfter.whatToChange} />}
          {trade.followedRules != null && <Row label="Followed my rules" value={boolLabel(trade.followedRules)} />}
        </Section>

        {(trade.thesis || trade.executionNotes || trade.lessonLearned) && (
          <Section title="Notes">
            {trade.thesis && <TextBlock label="Trade thesis" value={trade.thesis} />}
            {trade.executionNotes && <TextBlock label="Execution notes" value={trade.executionNotes} />}
            {trade.lessonLearned && <TextBlock label="Lesson learned" value={trade.lessonLearned} />}
          </Section>
        )}

        {screenshotUrl && (
          <Section title="Screenshot">
            <img src={screenshotUrl} alt="Trade screenshot" className="w-full rounded-card border border-base-border max-h-80 object-contain bg-black" />
          </Section>
        )}

        <div className="flex gap-3 pt-2">
          <Link to={`/trades/${trade.id}/edit`} className="flex-1"><Button variant="secondary" className="w-full">Edit</Button></Link>
          <Button variant="secondary" className="flex-1" onClick={handleDuplicate}>Duplicate</Button>
          <Button variant="danger" className="flex-1" onClick={() => setConfirmDelete(true)}>Delete</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this trade?"
        message="This permanently removes the trade and its screenshot from this device. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {children}
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink text-right tabular-nums">{value}</span>
    </div>
  )
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="block text-xs text-ink-muted mb-1">{label}</span>
      <p className="text-sm text-ink whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone?: number | null; big?: boolean }) {
  const cls = tone == null ? 'text-ink' : tone > 0 ? 'text-profit' : tone < 0 ? 'text-loss' : 'text-ink'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`font-semibold tabular-nums ${big ? 'text-xl' : 'text-sm'} ${cls}`}>{value}</span>
    </div>
  )
}

function boolLabel(v: boolean | null | undefined): string {
  if (v == null) return '—'
  return v ? 'Yes' : 'No'
}

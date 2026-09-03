import React, { useMemo, useState } from 'react'
import type { Trade, AssetType, Direction, TradeStatus } from '../types'
import { ASSET_TYPES } from '../types'
import { useApp } from '../store/AppContext'
import {
  grossPnl, netPnl, pnlPercent, plannedRisk, potentialReward, riskRewardRatio, rMultiple
} from '../utils/calculations'
import { parseNum, validateTrade, blockingIssues } from '../utils/validation'
import { formatMoney, formatPercent, formatRatio, formatR, currencySymbol } from '../utils/format'
import {
  Card, Field, TextInput, NumberInput, TextArea, Select, SegmentedControl, Button,
  CollapsibleSection, Toggle, InlineWarning
} from './ui'
import { ScreenshotUpload } from './ScreenshotUpload'

export function TradeForm({
  initial, mode, onSaved, onCancel
}: { initial: Trade; mode: 'full' | 'quick'; onSaved: (t: Trade) => void; onCancel: () => void }) {
  const { strategies, addStrategy, tradingRules, trades, settings, saveTrade } = useApp()
  const [form, setForm] = useState<Trade>(initial)
  const [customStrategy, setCustomStrategy] = useState('')
  const [showCustomStrategy, setShowCustomStrategy] = useState(
    !!initial.strategy && !strategies.some((s) => s.name === initial.strategy)
  )
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)
  const money = (n: number | null) => formatMoney(n, symbol, { signed: true })

  function set<K extends keyof Trade>(key: K, value: Trade[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const activeRules = tradingRules.filter((r) => r.active)

  const recentSymbols = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const t of trades) {
      if (t.symbol && !seen.has(t.symbol)) {
        seen.add(t.symbol)
        out.push(t.symbol)
      }
      if (out.length >= 6) break
    }
    return out
  }, [trades])

  const preview = useMemo(() => ({
    gross: grossPnl(form),
    net: netPnl(form),
    pct: pnlPercent(form),
    risk: plannedRisk(form),
    reward: potentialReward(form),
    rr: riskRewardRatio(form),
    r: rMultiple(form)
  }), [form])

  const issues = useMemo(() => validateTrade(form), [form])
  const blocking = blockingIssues(issues)
  const warnings = issues.filter((i) => !i.blocking)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (blocking.length > 0) return

    setSaving(true)
    let finalStrategy = form.strategy
    if (showCustomStrategy && customStrategy.trim()) {
      const existing = strategies.find((s) => s.name.toLowerCase() === customStrategy.trim().toLowerCase())
      finalStrategy = existing ? existing.name : (await addStrategy(customStrategy.trim())).name
    }
    const toSave: Trade = { ...form, strategy: finalStrategy, quickAdd: mode === 'quick' || form.quickAdd }
    await saveTrade(toSave)
    setSaving(false)
    onSaved(toSave)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-28">
      {submitted && blocking.length > 0 && (
        <Card className="border-loss/40 bg-loss-dim">
          <ul className="text-sm text-loss list-disc pl-4 space-y-1">
            {blocking.map((b, i) => <li key={i}>{b.message}</li>)}
          </ul>
        </Card>
      )}

      {/* ---------- Basic ---------- */}
      <Card className="flex flex-col gap-3">
        <Field label="Symbol *">
          <TextInput value={form.symbol} onChange={(e) => set('symbol', e.target.value.toUpperCase())} placeholder="e.g. RELIANCE, BTCUSDT" autoFocus />
        </Field>
        {recentSymbols.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {recentSymbols.map((s) => (
              <button key={s} type="button" onClick={() => set('symbol', s)}
                className="text-xs px-2 py-1 rounded-pill bg-base-overlay text-ink-muted border border-base-border">
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date *"><TextInput type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Time"><TextInput type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></Field>
        </div>
        <Field label="Direction">
          <SegmentedControl<Direction> value={form.direction} onChange={(v) => set('direction', v)}
            options={[{ label: 'Long', value: 'Long' }, { label: 'Short', value: 'Short' }]} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asset type">
            <Select value={form.assetType} onChange={(e) => set('assetType', e.target.value as AssetType)}>
              {ASSET_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as TradeStatus)}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </Field>
        </div>
        {mode === 'full' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Market"><TextInput value={form.market} onChange={(e) => set('market', e.target.value)} placeholder="NSE, Binance…" /></Field>
            <Field label="Broker / platform"><TextInput value={form.broker} onChange={(e) => set('broker', e.target.value)} /></Field>
          </div>
        )}
      </Card>

      {/* ---------- Prices & Position ---------- */}
      <Card className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entry price"><NumberInput value={form.entryPrice ?? ''} onChange={(e) => set('entryPrice', parseNum(e.target.value))} /></Field>
          <Field label="Exit price"><NumberInput value={form.exitPrice ?? ''} onChange={(e) => set('exitPrice', parseNum(e.target.value))} /></Field>
          <Field label="Stop loss"><NumberInput value={form.stopLoss ?? ''} onChange={(e) => set('stopLoss', parseNum(e.target.value))} /></Field>
          <Field label="Target"><NumberInput value={form.target ?? ''} onChange={(e) => set('target', parseNum(e.target.value))} /></Field>
          <Field label="Quantity"><NumberInput value={form.quantity ?? ''} onChange={(e) => set('quantity', parseNum(e.target.value))} /></Field>
          {mode === 'quick' && (
            <Field label="Net P&L (optional override)" hint="Only needed if you're not entering full price details.">
              <NumberInput value={form.manualNetPnl ?? ''} onChange={(e) => set('manualNetPnl', parseNum(e.target.value))} />
            </Field>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {warnings.map((w, i) => <InlineWarning key={i}>{w.message}</InlineWarning>)}
          </div>
        )}

        {mode === 'full' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Field label="Position size"><NumberInput value={form.positionSize ?? ''} onChange={(e) => set('positionSize', parseNum(e.target.value))} /></Field>
            <Field label="Leverage"><NumberInput value={form.leverage ?? ''} onChange={(e) => set('leverage', parseNum(e.target.value))} /></Field>
            <Field label="Margin / capital used"><NumberInput value={form.marginUsed ?? ''} onChange={(e) => set('marginUsed', parseNum(e.target.value))} /></Field>
            <Field label="Contract multiplier" hint="Leave blank unless this is a contract (futures/options).">
              <NumberInput value={form.contractMultiplier ?? ''} onChange={(e) => set('contractMultiplier', parseNum(e.target.value))} />
            </Field>
          </div>
        )}

        {form.status === 'Closed' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Exit date"><TextInput type="date" value={form.exitDate ?? ''} onChange={(e) => set('exitDate', e.target.value || null)} /></Field>
            <Field label="Exit time"><TextInput type="time" value={form.exitTime ?? ''} onChange={(e) => set('exitTime', e.target.value || null)} /></Field>
          </div>
        )}
      </Card>

      {/* ---------- Fees ---------- */}
      {mode === 'full' && (
        <CollapsibleSection title="Fees">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Brokerage"><NumberInput value={form.brokerage || ''} onChange={(e) => set('brokerage', parseNum(e.target.value) ?? 0)} /></Field>
            <Field label="Trading fees"><NumberInput value={form.tradingFees || ''} onChange={(e) => set('tradingFees', parseNum(e.target.value) ?? 0)} /></Field>
            <Field label="Taxes"><NumberInput value={form.taxes || ''} onChange={(e) => set('taxes', parseNum(e.target.value) ?? 0)} /></Field>
            <Field label="Other charges"><NumberInput value={form.otherCharges || ''} onChange={(e) => set('otherCharges', parseNum(e.target.value) ?? 0)} /></Field>
          </div>
        </CollapsibleSection>
      )}

      {/* ---------- Live calculated preview ---------- */}
      <Card className="grid grid-cols-2 gap-3">
        <PreviewStat label="Gross P&L" value={money(preview.gross)} tone={preview.gross} />
        <PreviewStat label="Net P&L" value={money(preview.net)} tone={preview.net} />
        <PreviewStat label="P&L %" value={formatPercent(preview.pct)} tone={preview.pct} />
        <PreviewStat label="Risk / Reward" value={formatRatio(preview.rr)} />
        <PreviewStat label="Planned risk" value={money(preview.risk)} />
        <PreviewStat label="R multiple" value={formatR(preview.r)} tone={preview.r} />
      </Card>

      {/* ---------- Strategy / setup ---------- */}
      {mode === 'full' ? (
        <CollapsibleSection title="Strategy & setup" defaultOpen>
          <StrategyPicker
            strategies={strategies.map((s) => s.name)}
            value={form.strategy}
            onSelect={(v) => { set('strategy', v); setShowCustomStrategy(false) }}
            showCustom={showCustomStrategy}
            onShowCustom={() => setShowCustomStrategy(true)}
            customValue={customStrategy}
            onCustomChange={setCustomStrategy}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Market condition"><TextInput value={form.marketCondition} onChange={(e) => set('marketCondition', e.target.value)} placeholder="Trending, Ranging…" /></Field>
            <Field label="Trend direction"><TextInput value={form.trendDirection} onChange={(e) => set('trendDirection', e.target.value)} placeholder="Up, Down, Sideways" /></Field>
            <Field label="Timeframe"><TextInput value={form.timeframe} onChange={(e) => set('timeframe', e.target.value)} placeholder="5m, 1h, Daily…" /></Field>
            <Field label="Setup quality (1–5)">
              <NumberInput value={form.setupQuality ?? ''} onChange={(e) => set('setupQuality', clamp(parseNum(e.target.value), 1, 5))} />
            </Field>
            <Field label="Confidence (1–10)">
              <NumberInput value={form.confidence ?? ''} onChange={(e) => set('confidence', clamp(parseNum(e.target.value), 1, 10))} />
            </Field>
          </div>
          <Field label="Entry reason"><TextArea value={form.entryReason} onChange={(e) => set('entryReason', e.target.value)} /></Field>
          <Field label="Stop-loss reason"><TextArea value={form.stopLossReason} onChange={(e) => set('stopLossReason', e.target.value)} /></Field>
          <Field label="Target reason"><TextArea value={form.targetReason} onChange={(e) => set('targetReason', e.target.value)} /></Field>
        </CollapsibleSection>
      ) : (
        <Card>
          <StrategyPicker
            strategies={strategies.map((s) => s.name)}
            value={form.strategy}
            onSelect={(v) => { set('strategy', v); setShowCustomStrategy(false) }}
            showCustom={showCustomStrategy}
            onShowCustom={() => setShowCustomStrategy(true)}
            customValue={customStrategy}
            onCustomChange={setCustomStrategy}
          />
        </Card>
      )}

      {/* ---------- Psychology ---------- */}
      {mode === 'full' && (
        <CollapsibleSection title="Psychology">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Before the trade</span>
            <Field label="Emotional state"><TextInput value={form.psychologyBefore.emotionalState} onChange={(e) => set('psychologyBefore', { ...form.psychologyBefore, emotionalState: e.target.value })} placeholder="Calm, anxious, excited…" /></Field>
            <Toggle label="Planned trade?" checked={!!form.psychologyBefore.plannedTrade} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, plannedTrade: v })} />
            <Toggle label="Followed trading plan?" checked={!!form.psychologyBefore.followedPlan} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, followedPlan: v })} />
            <Toggle label="FOMO?" checked={form.psychologyBefore.fomo} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, fomo: v })} />
            <Toggle label="Revenge trading?" checked={form.psychologyBefore.revengeTrade} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, revengeTrade: v })} />
            <Toggle label="Overtrading?" checked={form.psychologyBefore.overtrading} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, overtrading: v })} />
            <Toggle label="Trading after a loss?" checked={form.psychologyBefore.tradingAfterLoss} onChange={(v) => set('psychologyBefore', { ...form.psychologyBefore, tradingAfterLoss: v })} />
          </div>
          <div className="flex flex-col gap-3 pt-2 border-t border-base-border">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">After the trade</span>
            <Field label="Emotional state"><TextInput value={form.psychologyAfter.emotionalState} onChange={(e) => set('psychologyAfter', { ...form.psychologyAfter, emotionalState: e.target.value })} /></Field>
            <Toggle label="Followed plan?" checked={!!form.psychologyAfter.followedPlan} onChange={(v) => set('psychologyAfter', { ...form.psychologyAfter, followedPlan: v })} />
            <Toggle label="Moved stop loss?" checked={form.psychologyAfter.movedStopLoss} onChange={(v) => set('psychologyAfter', { ...form.psychologyAfter, movedStopLoss: v })} />
            <Toggle label="Exited early?" checked={form.psychologyAfter.exitedEarly} onChange={(v) => set('psychologyAfter', { ...form.psychologyAfter, exitedEarly: v })} />
            <Toggle label="Entered late?" checked={form.psychologyAfter.enteredLate} onChange={(v) => set('psychologyAfter', { ...form.psychologyAfter, enteredLate: v })} />
            <Toggle label="Overstayed?" checked={form.psychologyAfter.overstayed} onChange={(v) => set('psychologyAfter', { ...form.psychologyAfter, overstayed: v })} />
            <Field label="What was done correctly"><TextArea value={form.psychologyAfter.whatDoneCorrectly} onChange={(e) => set('psychologyAfter', { ...form.psychologyAfter, whatDoneCorrectly: e.target.value })} /></Field>
            <Field label="What was done incorrectly"><TextArea value={form.psychologyAfter.whatDoneIncorrectly} onChange={(e) => set('psychologyAfter', { ...form.psychologyAfter, whatDoneIncorrectly: e.target.value })} /></Field>
            <Field label="What will be done differently"><TextArea value={form.psychologyAfter.whatToChange} onChange={(e) => set('psychologyAfter', { ...form.psychologyAfter, whatToChange: e.target.value })} /></Field>
          </div>
        </CollapsibleSection>
      )}

      {/* ---------- Rules ---------- */}
      {mode === 'full' && activeRules.length > 0 && (
        <Card>
          <Toggle
            label="Did this trade follow my rules?"
            checked={!!form.followedRules}
            onChange={(v) => set('followedRules', v)}
          />
        </Card>
      )}

      {/* ---------- Notes ---------- */}
      {mode === 'full' && (
        <CollapsibleSection title="Notes">
          <Field label="Trade thesis"><TextArea value={form.thesis} onChange={(e) => set('thesis', e.target.value)} /></Field>
          <Field label="Execution notes"><TextArea value={form.executionNotes} onChange={(e) => set('executionNotes', e.target.value)} /></Field>
          <Field label="Lesson learned"><TextArea value={form.lessonLearned} onChange={(e) => set('lessonLearned', e.target.value)} /></Field>
        </CollapsibleSection>
      )}

      {/* ---------- Screenshot ---------- */}
      {mode === 'full' && (
        <CollapsibleSection title="Screenshot">
          <ScreenshotUpload screenshotId={form.screenshotId} onChange={(id) => set('screenshotId', id)} />
        </CollapsibleSection>
      )}

      <div className="fixed bottom-16 left-0 right-0 z-30 bg-base/95 backdrop-blur border-t border-base-border px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save trade'}</Button>
        </div>
      </div>
    </form>
  )
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: number | null }) {
  const cls = tone == null ? 'text-ink' : tone > 0 ? 'text-profit' : tone < 0 ? 'text-loss' : 'text-ink'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${cls}`}>{value}</span>
    </div>
  )
}

function StrategyPicker({
  strategies, value, onSelect, showCustom, onShowCustom, customValue, onCustomChange
}: {
  strategies: string[]; value: string; onSelect: (v: string) => void
  showCustom: boolean; onShowCustom: () => void; customValue: string; onCustomChange: (v: string) => void
}) {
  return (
    <Field label="Strategy">
      {!showCustom ? (
        <Select value={value} onChange={(e) => e.target.value === '__custom__' ? onShowCustom() : onSelect(e.target.value)}>
          <option value="">Select a strategy…</option>
          {strategies.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="__custom__">+ Add custom strategy…</option>
        </Select>
      ) : (
        <TextInput value={customValue} onChange={(e) => onCustomChange(e.target.value)} placeholder="Custom strategy name" autoFocus />
      )}
    </Field>
  )
}

function clamp(n: number | null, min: number, max: number): number | null {
  if (n == null) return null
  return Math.min(max, Math.max(min, n))
}

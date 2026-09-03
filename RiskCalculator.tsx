import React, { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { computeRiskCalculator } from '../utils/calculations'
import { parseNum } from '../utils/validation'
import { formatMoney, formatRatio, currencySymbol } from '../utils/format'
import { PageHeader, Card, Field, NumberInput, StatCard, StatGrid } from '../components/ui'

export default function RiskCalculator() {
  const { settings } = useApp()
  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)

  const [balance, setBalance] = useState('')
  const [riskPct, setRiskPct] = useState('1')
  const [entry, setEntry] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [target, setTarget] = useState('')

  const result = useMemo(() => {
    const b = parseNum(balance)
    const r = parseNum(riskPct)
    const e = parseNum(entry)
    const sl = parseNum(stopLoss)
    const t = parseNum(target)
    if (b == null || r == null || e == null || sl == null) return null
    return computeRiskCalculator({ accountBalance: b, riskPercent: r, entry: e, stopLoss: sl, target: t })
  }, [balance, riskPct, entry, stopLoss, target])

  return (
    <div>
      <PageHeader title="Risk Calculator" subtitle="A calculator, not financial advice." />
      <div className="px-4 flex flex-col gap-4 pb-10">
        <Card className="flex flex-col gap-3">
          <Field label="Account balance"><NumberInput value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="e.g. 100000" /></Field>
          <Field label="Risk % per trade"><NumberInput value={riskPct} onChange={(e) => setRiskPct(e.target.value)} placeholder="e.g. 1" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Entry"><NumberInput value={entry} onChange={(e) => setEntry(e.target.value)} /></Field>
            <Field label="Stop loss"><NumberInput value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} /></Field>
            <Field label="Target"><NumberInput value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
          </div>
        </Card>

        {result ? (
          <StatGrid>
            <StatCard label="Max risk amount" value={formatMoney(result.maxRiskAmount, symbol)} tone="warn" />
            <StatCard label="Stop-loss distance" value={result.stopLossDistance.toLocaleString(undefined, { maximumFractionDigits: 4 })} />
            <StatCard label="Potential reward" value={result.potentialReward != null ? formatMoney(result.potentialReward, symbol) : '—'} tone="profit" />
            <StatCard label="Risk / Reward" value={formatRatio(result.riskRewardRatio)} />
            <StatCard label="Suggested position size" value={result.suggestedPositionSize != null ? result.suggestedPositionSize.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'} sub="units of the instrument" />
          </StatGrid>
        ) : (
          <Card><span className="text-sm text-ink-muted">Enter your account balance, risk %, entry, and stop loss to see the numbers.</span></Card>
        )}

        <p className="text-xs text-ink-faint px-1">
          This tool only does arithmetic on the numbers you enter. It is not financial advice, does not know your
          broker's margin rules, and never recommends leverage — check your own risk tolerance and broker terms.
        </p>
      </div>
    </div>
  )
}

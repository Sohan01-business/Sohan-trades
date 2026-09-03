import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { DailyJournalEntry } from '../types'
import { computeAggregateStats } from '../utils/calculations'
import { formatMoney, currencySymbol, todayIso } from '../utils/format'
import { PageHeader, Card, Field, TextInput, TextArea, Button } from '../components/ui'
import { TradeListItem } from '../components/TradeListItem'

function emptyEntry(date: string): DailyJournalEntry {
  return {
    date, marketOutlook: '', plan: '', biggestMistake: '', bestDecision: '',
    emotionalState: '', lessonLearned: '', tomorrowFocus: '', updatedAt: new Date().toISOString()
  }
}

export default function DailyJournal() {
  const { trades, dailyJournal, saveJournalEntry, settings } = useApp()
  const [date, setDate] = useState(todayIso())
  const [entry, setEntry] = useState<DailyJournalEntry>(emptyEntry(date))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const existing = dailyJournal.find((j) => j.date === date)
    setEntry(existing ?? emptyEntry(date))
    setSaved(false)
  }, [date, dailyJournal])

  const dayTrades = useMemo(() => trades.filter((t) => t.date === date), [trades, date])
  const dayStats = useMemo(() => computeAggregateStats(dayTrades), [dayTrades])
  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)

  function shiftDate(deltaDays: number) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + deltaDays)
    setDate(d.toISOString().slice(0, 10))
  }

  function set<K extends keyof DailyJournalEntry>(key: K, value: DailyJournalEntry[K]) {
    setEntry((e) => ({ ...e, [key]: value }))
  }

  async function handleSave() {
    await saveJournalEntry(entry)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div>
      <PageHeader title="Daily Journal" subtitle="One reflection per trading day." />
      <div className="px-4 flex flex-col gap-4 pb-10">
        <Card className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => shiftDate(-1)}>←</Button>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-center" />
          <Button variant="ghost" onClick={() => shiftDate(1)}>→</Button>
        </Card>

        <Card className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-muted">Number of trades</span>
            <span className="text-lg font-semibold text-ink tabular-nums">{dayTrades.length}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-muted">Daily P&L</span>
            <span className={`text-lg font-semibold tabular-nums ${dayStats.netPnl > 0 ? 'text-profit' : dayStats.netPnl < 0 ? 'text-loss' : 'text-ink'}`}>
              {formatMoney(dayStats.netPnl, symbol, { signed: true })}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <Field label="Daily market outlook"><TextArea value={entry.marketOutlook} onChange={(e) => set('marketOutlook', e.target.value)} /></Field>
          <Field label="What I planned today"><TextArea value={entry.plan} onChange={(e) => set('plan', e.target.value)} /></Field>
          <Field label="Biggest mistake"><TextArea value={entry.biggestMistake} onChange={(e) => set('biggestMistake', e.target.value)} /></Field>
          <Field label="Best decision"><TextArea value={entry.bestDecision} onChange={(e) => set('bestDecision', e.target.value)} /></Field>
          <Field label="Emotional state"><TextInput value={entry.emotionalState} onChange={(e) => set('emotionalState', e.target.value)} /></Field>
          <Field label="What I learned"><TextArea value={entry.lessonLearned} onChange={(e) => set('lessonLearned', e.target.value)} /></Field>
          <Field label="Tomorrow's focus"><TextArea value={entry.tomorrowFocus} onChange={(e) => set('tomorrowFocus', e.target.value)} /></Field>
          <Button onClick={handleSave}>{saved ? 'Saved ✓' : 'Save journal entry'}</Button>
        </Card>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink-muted">Trades on this day</h2>
          {dayTrades.length === 0 ? (
            <Card><span className="text-sm text-ink-muted">No trades logged for this date.</span></Card>
          ) : (
            <div className="flex flex-col gap-2">
              {dayTrades.map((t) => <TradeListItem key={t.id} trade={t} />)}
            </div>
          )}
          <Link to="/add"><Button variant="secondary" className="w-full">+ Add a trade for this day</Button></Link>
        </section>
      </div>
    </div>
  )
}

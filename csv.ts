import type { Trade } from '../types'
import { grossPnl, netPnl, pnlPercent, riskRewardRatio, rMultiple } from './calculations'

const HEADERS = [
  'Date', 'Symbol', 'Market', 'Direction', 'Strategy', 'Timeframe', 'Entry', 'Exit',
  'Stop Loss', 'Target', 'Quantity', 'Leverage', 'Capital', 'Gross P&L', 'Fees', 'Net P&L',
  'P&L %', 'R:R', 'R Multiple', 'Setup Quality', 'Confidence', 'Notes'
]

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function tradesToCsv(trades: Trade[]): string {
  const rows = trades.map((t) => {
    const capital = t.marginUsed ?? t.positionSize ?? (t.entryPrice != null && t.quantity != null ? t.entryPrice * t.quantity : null)
    const fees = t.brokerage + t.tradingFees + t.taxes + t.otherCharges
    const notes = [t.thesis, t.executionNotes, t.lessonLearned].filter(Boolean).join(' | ')
    return [
      t.date, t.symbol, t.market, t.direction, t.strategy, t.timeframe,
      t.entryPrice, t.exitPrice, t.stopLoss, t.target, t.quantity, t.leverage,
      capital, grossPnl(t), fees, netPnl(t), pnlPercent(t), riskRewardRatio(t), rMultiple(t),
      t.setupQuality, t.confidence, notes
    ].map(csvCell)
  })

  return [HEADERS.map(csvCell).join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

import type { Trade } from '../types'

export interface FieldIssue {
  field: string
  message: string
  blocking: boolean // true = must fix before saving, false = warning only
}

/** Parses a form text input into a number or null. Never returns NaN. */
export function parseNum(raw: string): number | null {
  if (raw == null || raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function validateTrade(t: Trade): FieldIssue[] {
  const issues: FieldIssue[] = []

  if (!t.symbol.trim()) issues.push({ field: 'symbol', message: 'Symbol is required.', blocking: true })
  if (!t.date) issues.push({ field: 'date', message: 'Date is required.', blocking: true })
  if (!isValidDate(t.date)) issues.push({ field: 'date', message: 'Date looks invalid.', blocking: true })
  if (t.exitDate && !isValidDate(t.exitDate)) issues.push({ field: 'exitDate', message: 'Exit date looks invalid.', blocking: true })

  if (t.quantity != null && t.quantity <= 0) {
    issues.push({ field: 'quantity', message: 'Quantity must be greater than zero.', blocking: true })
  }
  if (t.entryPrice != null && t.entryPrice < 0) issues.push({ field: 'entryPrice', message: 'Entry price cannot be negative.', blocking: true })
  if (t.exitPrice != null && t.exitPrice < 0) issues.push({ field: 'exitPrice', message: 'Exit price cannot be negative.', blocking: true })
  if (t.leverage != null && t.leverage < 0) issues.push({ field: 'leverage', message: 'Leverage cannot be negative.', blocking: true })

  if (t.status === 'Closed' && t.exitPrice == null) {
    issues.push({ field: 'exitPrice', message: 'Closed trades should have an exit price.', blocking: false })
  }

  // SL / Target relationship — warning only, never blocks.
  if (t.entryPrice != null && t.stopLoss != null && t.target != null) {
    if (t.direction === 'Long') {
      if (!(t.stopLoss < t.entryPrice && t.entryPrice < t.target)) {
        issues.push({
          field: 'stopLoss',
          message: 'Unusual for a Long: normally Stop Loss < Entry < Target.',
          blocking: false
        })
      }
    } else {
      if (!(t.target < t.entryPrice && t.entryPrice < t.stopLoss)) {
        issues.push({
          field: 'stopLoss',
          message: 'Unusual for a Short: normally Target < Entry < Stop Loss.',
          blocking: false
        })
      }
    }
  }

  return issues
}

export function isValidDate(s: string): boolean {
  if (!s) return false
  const d = new Date(s + 'T00:00:00')
  return !Number.isNaN(d.getTime())
}

export function blockingIssues(issues: FieldIssue[]): FieldIssue[] {
  return issues.filter((i) => i.blocking)
}

import type { Currency, DateFormat } from '../types'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', CUSTOM: ''
}

export function currencySymbol(currency: Currency, customSymbol: string): string {
  return currency === 'CUSTOM' ? (customSymbol || '$') : CURRENCY_SYMBOLS[currency]
}

/** Safe currency formatter. Never throws, never prints NaN/Infinity/undefined. */
export function formatMoney(value: number | null | undefined, symbol: string, opts: { signed?: boolean } = {}): string {
  if (value == null || !isFinite(value)) return '—'
  const abs = Math.abs(value)
  const sign = opts.signed ? (value > 0 ? '+' : value < 0 ? '−' : '') : value < 0 ? '−' : ''
  return `${sign}${symbol}${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (value === Number.POSITIVE_INFINITY) return '∞'
  if (value === Number.NEGATIVE_INFINITY) return '−∞'
  return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  if (value === Number.POSITIVE_INFINITY) return '∞'
  return `${value.toFixed(2)}:1`
}

export function formatR(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}R`
}

export function formatDate(isoDate: string, fmt: DateFormat): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  switch (fmt) {
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`
    case 'DD/MM/YYYY':
    default: return `${d}/${m}/${y}`
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || !isFinite(minutes) || minutes < 0) return '—'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h < 24) return `${h}h ${m}m`
  const d = Math.floor(h / 24)
  const remH = h % 24
  return `${d}d ${remH}h`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowTime(): string {
  return new Date().toTimeString().slice(0, 5)
}

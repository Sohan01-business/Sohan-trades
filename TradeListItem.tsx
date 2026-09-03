import React from 'react'
import { Link } from 'react-router-dom'
import type { Trade } from '../types'
import { netPnl, isWin } from '../utils/calculations'
import { formatMoney, formatDate, currencySymbol } from '../utils/format'
import { useApp } from '../store/AppContext'
import { DirectionBadge, PnlBadge, DemoBadge } from './ui'

export function TradeListItem({ trade }: { trade: Trade }) {
  const { settings } = useApp()
  const symbol = currencySymbol(settings.currency, settings.customCurrencySymbol)
  const net = netPnl(trade)
  const win = isWin(trade)

  return (
    <Link to={`/trades/${trade.id}`} className="block">
      <div className="bg-base-raised border border-base-border rounded-card px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink truncate">{trade.symbol || 'Untitled'}</span>
            <DirectionBadge direction={trade.direction} />
            {trade.isDemo && <DemoBadge />}
          </div>
          <div className="text-xs text-ink-muted mt-0.5 truncate">
            {formatDate(trade.date, settings.dateFormat)} · {trade.strategy || 'No strategy'}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-semibold tabular-nums ${net == null ? 'text-ink-muted' : net >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatMoney(net, symbol, { signed: true })}
          </div>
          <div className="mt-1"><PnlBadge isWin={trade.status === 'Closed' ? win : null} /></div>
        </div>
      </div>
    </Link>
  )
}

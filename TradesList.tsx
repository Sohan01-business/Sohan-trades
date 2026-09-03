import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { Trade, AssetType, Direction } from '../types'
import { ASSET_TYPES } from '../types'
import { netPnl, isWin } from '../utils/calculations'
import { PageHeader, TextInput, Select, Button, EmptyState, CollapsibleSection, Field } from '../components/ui'
import { TradeListItem } from '../components/TradeListItem'

type SortMode = 'newest' | 'oldest' | 'highestProfit' | 'highestLoss' | 'symbol' | 'strategy'

export default function TradesList() {
  const { trades, strategies } = useApp()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const [assetType, setAssetType] = useState<AssetType | ''>('')
  const [direction, setDirection] = useState<Direction | ''>('')
  const [result, setResult] = useState<'' | 'win' | 'loss'>('')
  const [strategy, setStrategy] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [broker, setBroker] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const activeFilterCount = [assetType, direction, result, strategy, timeframe, broker, dateFrom, dateTo].filter(Boolean).length

  function clearFilters() {
    setAssetType(''); setDirection(''); setResult(''); setStrategy(''); setTimeframe(''); setBroker(''); setDateFrom(''); setDateTo('')
  }

  const filtered = useMemo(() => {
    let list = trades.slice()
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((t) => t.symbol.toLowerCase().includes(q) || t.strategy.toLowerCase().includes(q) || t.broker.toLowerCase().includes(q))
    if (assetType) list = list.filter((t) => t.assetType === assetType)
    if (direction) list = list.filter((t) => t.direction === direction)
    if (result) list = list.filter((t) => (result === 'win' ? isWin(t) === true : isWin(t) === false))
    if (strategy) list = list.filter((t) => t.strategy === strategy)
    if (timeframe) list = list.filter((t) => t.timeframe.toLowerCase() === timeframe.toLowerCase())
    if (broker) list = list.filter((t) => t.broker.toLowerCase().includes(broker.toLowerCase()))
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom)
    if (dateTo) list = list.filter((t) => t.date <= dateTo)

    const byNet = (t: Trade) => netPnl(t) ?? -Infinity
    switch (sort) {
      case 'newest': list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); break
      case 'oldest': list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)); break
      case 'highestProfit': list.sort((a, b) => byNet(b) - byNet(a)); break
      case 'highestLoss': list.sort((a, b) => byNet(a) - byNet(b)); break
      case 'symbol': list.sort((a, b) => a.symbol.localeCompare(b.symbol)); break
      case 'strategy': list.sort((a, b) => a.strategy.localeCompare(b.strategy)); break
    }
    return list
  }, [trades, search, sort, assetType, direction, result, strategy, timeframe, broker, dateFrom, dateTo])

  return (
    <div>
      <PageHeader
        title="Trades"
        subtitle={`${filtered.length} of ${trades.length} trade${trades.length === 1 ? '' : 's'}`}
        action={<Link to="/add"><Button>+ Add</Button></Link>}
      />

      <div className="px-4 flex flex-col gap-3">
        <TextInput placeholder="Search symbol, strategy, broker…" value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="flex gap-2">
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className="flex-1">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highestProfit">Highest profit</option>
            <option value="highestLoss">Highest loss</option>
            <option value="symbol">Symbol</option>
            <option value="strategy">Strategy</option>
          </Select>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="px-4 py-2.5 rounded-card text-sm font-medium border border-base-border bg-base-overlay text-ink whitespace-nowrap"
          >
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>

        {showFilters && (
          <CollapsibleSection title="Filter trades" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Asset type">
                <Select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetType | '')}>
                  <option value="">Any</option>
                  {ASSET_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
              <Field label="Direction">
                <Select value={direction} onChange={(e) => setDirection(e.target.value as Direction | '')}>
                  <option value="">Any</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </Select>
              </Field>
              <Field label="Result">
                <Select value={result} onChange={(e) => setResult(e.target.value as '' | 'win' | 'loss')}>
                  <option value="">Any</option>
                  <option value="win">Winning</option>
                  <option value="loss">Losing</option>
                </Select>
              </Field>
              <Field label="Strategy">
                <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                  <option value="">Any</option>
                  {strategies.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Timeframe"><TextInput value={timeframe} onChange={(e) => setTimeframe(e.target.value)} placeholder="e.g. 15m" /></Field>
              <Field label="Broker / platform"><TextInput value={broker} onChange={(e) => setBroker(e.target.value)} /></Field>
              <Field label="From date"><TextInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field>
              <Field label="To date"><TextInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field>
            </div>
            {activeFilterCount > 0 && <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>}
          </CollapsibleSection>
        )}

        {filtered.length === 0 ? (
          trades.length === 0 ? (
            <EmptyState title="No trades recorded yet." action={<Link to="/add"><Button>+ Add your first trade</Button></Link>} />
          ) : (
            <EmptyState title="No trades match your filters." action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>} />
          )
        ) : (
          <div className="flex flex-col gap-2 pb-6">
            {filtered.map((t) => <TradeListItem key={t.id} trade={t} />)}
          </div>
        )}
      </div>
    </div>
  )
}

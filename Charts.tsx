import React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import type { EquityPoint } from '../utils/calculations'

const GRID = '#2A313C'
const AXIS = '#5A6270'
const PROFIT = '#22C55E'
const LOSS = '#EF4444'
const ACCENT = '#3B82F6'

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-base-overlay border border-base-border rounded-card px-3 py-2 text-xs">
      <div className="text-ink-muted mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-ink font-medium tabular-nums">{formatter ? formatter(p.value) : p.value}</div>
      ))}
    </div>
  )
}

export function EquityCurveChart({ data, moneyFmt }: { data: EquityPoint[]; moneyFmt: (n: number) => string }) {
  if (data.length === 0) {
    return <div className="h-52 flex items-center justify-center text-sm text-ink-muted">No closed trades yet.</div>
  }
  const last = data[data.length - 1].cumulative
  const positive = last >= 0
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? PROFIT : LOSS} stopOpacity={0.35} />
            <stop offset="100%" stopColor={positive ? PROFIT : LOSS} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 10 }} axisLine={{ stroke: GRID }} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => moneyFmt(v)} />
        <Tooltip content={<ChartTooltip formatter={moneyFmt} />} />
        <Area type="monotone" dataKey="cumulative" stroke={positive ? PROFIT : LOSS} strokeWidth={2} fill="url(#equityFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function PnlBarChart({
  data, moneyFmt
}: { data: { key: string; value: number }[]; moneyFmt: (n: number) => string }) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-ink-muted">Not enough data yet.</div>
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => moneyFmt(v)} />
        <YAxis type="category" dataKey="key" tick={{ fill: '#E6E9EF', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={<ChartTooltip formatter={moneyFmt} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.value >= 0 ? PROFIT : LOSS} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WinRateBarChart({ data }: { data: { key: string; winRate: number }[] }) {
  if (data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-sm text-ink-muted">Not enough data yet.</div>
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="key" tick={{ fill: '#E6E9EF', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)}%`} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="winRate" radius={[0, 6, 6, 0]} fill={ACCENT} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WinsLossesPie({ wins, losses }: { wins: number; losses: number }) {
  const data = [
    { name: 'Wins', value: wins, color: PROFIT },
    { name: 'Losses', value: losses, color: LOSS }
  ]
  if (wins + losses === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-ink-muted">No closed trades yet.</div>
  }
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={2} strokeWidth={0}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-profit" /> <span className="text-ink">Wins</span> <span className="text-ink-muted tabular-nums">{wins}</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-loss" /> <span className="text-ink">Losses</span> <span className="text-ink-muted tabular-nums">{losses}</span></div>
      </div>
    </div>
  )
}

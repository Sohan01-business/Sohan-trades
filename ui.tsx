import React, { useState } from 'react'

// ---------- Layout ----------

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-base-raised border border-base-border rounded-card p-4 ${className}`}>{children}</div>
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------- Stat display ----------

export function StatCard({
  label, value, tone = 'neutral', sub
}: { label: string; value: string; tone?: 'profit' | 'loss' | 'neutral' | 'warn'; sub?: string }) {
  const toneClass = tone === 'profit' ? 'text-profit' : tone === 'loss' ? 'text-loss' : tone === 'warn' ? 'text-warn' : 'text-ink'
  return (
    <Card className="flex flex-col gap-1 min-w-0">
      <span className="text-xs text-ink-muted truncate">{label}</span>
      <span className={`text-lg font-semibold tabular-nums truncate ${toneClass}`}>{value}</span>
      {sub && <span className="text-xs text-ink-faint truncate">{sub}</span>}
    </Card>
  )
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

// ---------- Badges ----------

export function PnlBadge({ isWin }: { isWin: boolean | null }) {
  if (isWin == null) return <span className="text-xs px-2 py-0.5 rounded-pill bg-base-overlay text-ink-muted">Pending</span>
  return isWin
    ? <span className="text-xs px-2 py-0.5 rounded-pill bg-profit-dim text-profit font-medium">Win</span>
    : <span className="text-xs px-2 py-0.5 rounded-pill bg-loss-dim text-loss font-medium">Loss</span>
}

export function StatusBadge({ status }: { status: 'Open' | 'Closed' | 'Cancelled' }) {
  const map = {
    Open: 'bg-accent-dim text-accent',
    Closed: 'bg-base-overlay text-ink-muted',
    Cancelled: 'bg-loss-dim text-loss'
  }
  return <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${map[status]}`}>{status}</span>
}

export function DirectionBadge({ direction }: { direction: 'Long' | 'Short' }) {
  return direction === 'Long'
    ? <span className="text-xs px-2 py-0.5 rounded-pill bg-profit-dim text-profit font-medium">Long</span>
    : <span className="text-xs px-2 py-0.5 rounded-pill bg-loss-dim text-loss font-medium">Short</span>
}

export function DemoBadge() {
  return <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-warn-dim text-warn font-medium">DEMO</span>
}

// ---------- Empty state ----------

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <p className="text-ink-muted text-sm">{title}</p>
      {action}
    </div>
  )
}

// ---------- Buttons ----------

export function Button({
  children, onClick, variant = 'primary', type = 'button', className = '', disabled
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'; className?: string; disabled?: boolean
}) {
  const base = 'px-4 py-2.5 rounded-card text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    primary: 'bg-accent text-white',
    secondary: 'bg-base-overlay text-ink border border-base-border',
    danger: 'bg-loss text-white',
    ghost: 'text-ink-muted hover:text-ink'
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ---------- Form primitives ----------

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-muted mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-faint mt-1">{hint}</span>}
    </label>
  )
}

const inputBase = 'w-full bg-base-overlay border border-base-border rounded-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ''}`} />
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} type="text" inputMode="decimal" className={`${inputBase} tabular-nums ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 3} className={`${inputBase} resize-none ${props.className ?? ''}`} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputBase} ${props.className ?? ''}`}>
      {children}
    </select>
  )
}

export function SegmentedControl<T extends string>({
  options, value, onChange
}: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex bg-base-overlay border border-base-border rounded-card p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-sm py-2 rounded-[10px] font-medium transition-colors ${
            value === opt.value ? 'bg-accent text-white' : 'text-ink-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-1"
      aria-pressed={checked}
    >
      {label && <span className="text-sm text-ink">{label}</span>}
      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors ${checked ? 'bg-accent' : 'bg-base-overlay border border-base-border'}`}>
        <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
      </span>
    </button>
  )
}

// ---------- Collapsible ----------

export function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-base-border rounded-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-ink bg-base-raised"
      >
        {title}
        <span className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && <div className="p-4 pt-0 bg-base-raised flex flex-col gap-4">{children}</div>}
    </div>
  )
}

// ---------- Confirm dialog ----------

export function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel
}: {
  open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean
  onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0" onClick={onCancel}>
      <div className="bg-base-raised border border-base-border rounded-card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-muted mb-5">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}

// ---------- Toast ----------

export function InlineWarning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-warn-dim border border-warn/30 rounded-card px-3 py-2 text-xs text-warn">
      <span>⚠</span>
      <span>{children}</span>
    </div>
  )
}

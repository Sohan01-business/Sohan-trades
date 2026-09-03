import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import type { Currency, DateFormat, ThemeMode } from '../types'
import { exportBackupFile, parseBackupJson, applyImport, InvalidBackupError, type ParsedImport, type ImportMode } from '../utils/backup'
import { tradesToCsv, downloadCsv } from '../utils/csv'
import {
  PageHeader, Card, Field, Select, TextInput, Button, SegmentedControl, ConfirmDialog
} from '../components/ui'

export default function Settings() {
  const { settings, updateSettings, trades, loadDemoData, deleteDemoData, wipeAllData, refresh } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [importState, setImportState] = useState<ParsedImport | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('merge-keep-existing')
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDeleteDemo, setConfirmDeleteDemo] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleImportFile(file: File | undefined) {
    setImportError('')
    if (!file) return
    try {
      const raw = await file.text()
      const parsed = parseBackupJson(raw)
      setImportState(parsed)
    } catch (e) {
      setImportError(e instanceof InvalidBackupError ? e.message : 'Could not read this file.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function confirmImport() {
    if (!importState) return
    setBusy(true)
    await applyImport(importState.payload, importMode)
    await refresh()
    setBusy(false)
    setImportState(null)
    setImportDone(true)
    setTimeout(() => setImportDone(false), 2500)
  }

  async function handleExportCsv() {
    const csv = tradesToCsv(trades)
    downloadCsv(csv, `tradevault-trades-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  async function handleClearAll() {
    setBusy(true)
    await wipeAllData()
    setBusy(false)
    setConfirmClear(false)
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="px-4 flex flex-col gap-5 pb-12">
        <SettingsSection title="Appearance">
          <Field label="Theme">
            <SegmentedControl<ThemeMode>
              value={settings.theme}
              onChange={(v) => updateSettings({ theme: v })}
              options={[{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }, { label: 'System', value: 'system' }]}
            />
          </Field>
        </SettingsSection>

        <SettingsSection title="Currency & format">
          <Field label="Currency">
            <Select value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value as Currency })}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CUSTOM">Custom</option>
            </Select>
          </Field>
          {settings.currency === 'CUSTOM' && (
            <Field label="Custom symbol">
              <TextInput value={settings.customCurrencySymbol} onChange={(e) => updateSettings({ customCurrencySymbol: e.target.value })} maxLength={3} />
            </Field>
          )}
          <Field label="Date format">
            <Select value={settings.dateFormat} onChange={(e) => updateSettings({ dateFormat: e.target.value as DateFormat })}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </Select>
          </Field>
        </SettingsSection>

        <SettingsSection title="More tools">
          <div className="flex flex-col gap-2">
            <Link to="/journal"><Button variant="secondary" className="w-full text-left">Daily Journal</Button></Link>
            <Link to="/rules"><Button variant="secondary" className="w-full text-left">My Trading Rules</Button></Link>
            <Link to="/risk-calculator"><Button variant="secondary" className="w-full text-left">Risk Calculator</Button></Link>
          </div>
        </SettingsSection>

        <SettingsSection title="Data management">
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => exportBackupFile()}>Export backup (JSON)</Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Import backup (JSON)</Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImportFile(e.target.files?.[0])} />
            <Button variant="secondary" onClick={handleExportCsv}>Export trades as CSV</Button>
            {importError && <span className="text-xs text-loss">{importError}</span>}
            {importDone && <span className="text-xs text-profit">Import complete.</span>}
          </div>
        </SettingsSection>

        <SettingsSection title="Demo data">
          <div className="flex flex-col gap-2">
            {settings.demoDataLoaded ? (
              <Button variant="secondary" onClick={() => setConfirmDeleteDemo(true)}>Delete demo data</Button>
            ) : (
              <Button variant="secondary" onClick={() => loadDemoData()}>Load demo data</Button>
            )}
            <span className="text-xs text-ink-faint">Demo trades are clearly tagged "DEMO" and never mixed into your real numbers unless you choose to.</span>
          </div>
        </SettingsSection>

        <SettingsSection title="Danger zone">
          <Button variant="danger" onClick={() => setConfirmClear(true)}>Clear all data</Button>
        </SettingsSection>

        <SettingsSection title="About">
          <div className="flex flex-col gap-2 text-sm text-ink-muted">
            <p className="text-ink font-medium">TradeVault — Offline Trading Journal</p>
            <p>Your trading data is stored locally on this device.</p>
            <p>TradeVault is designed to work offline. Your journal data is stored locally on your device and is not automatically uploaded to a server.</p>
            <p>No analytics or tracking of any kind.</p>
          </div>
        </SettingsSection>
      </div>

      {/* Import confirmation with merge-mode choice */}
      {importState && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-4 pb-4 sm:pb-0" onClick={() => setImportState(null)}>
          <div className="bg-base-raised border border-base-border rounded-card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-ink mb-2">Import this backup?</h3>
            <ul className="text-sm text-ink-muted mb-4 space-y-1">
              <li>{importState.summary.trades} trades</li>
              <li>{importState.summary.dailyJournal} daily journal entries</li>
              <li>{importState.summary.strategies} strategies</li>
              <li>{importState.summary.tradingRules} trading rules</li>
              <li>{importState.summary.screenshots} screenshots</li>
            </ul>
            <Field label="If a record already exists locally">
              <Select value={importMode} onChange={(e) => setImportMode(e.target.value as ImportMode)}>
                <option value="merge-keep-existing">Keep my existing data</option>
                <option value="merge-overwrite-duplicates">Overwrite with imported data</option>
              </Select>
            </Field>
            <p className="text-xs text-ink-faint my-3">This only adds to your data — nothing already on this device that's missing from the file will be deleted.</p>
            <div className="flex gap-3 mt-2">
              <Button variant="secondary" onClick={() => setImportState(null)} className="flex-1">Cancel</Button>
              <Button onClick={confirmImport} disabled={busy} className="flex-1">{busy ? 'Importing…' : 'Import'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear all data?"
        message="This permanently deletes every trade, journal entry, strategy, rule, and screenshot on this device. Export a backup first if you want to keep a copy."
        confirmLabel={busy ? 'Clearing…' : 'Clear everything'}
        danger
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmDialog
        open={confirmDeleteDemo}
        title="Delete demo data?"
        message="This removes all trades tagged DEMO. Your real trades are not affected."
        confirmLabel="Delete demo data"
        danger
        onConfirm={async () => { await deleteDemoData(); setConfirmDeleteDemo(false) }}
        onCancel={() => setConfirmDeleteDemo(false)}
      />
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  )
}

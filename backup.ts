import type { BackupPayload, Trade, DailyJournalEntry, StrategyDef, TradingRule, Settings } from '../types'
import { tradesRepo, journalRepo, strategiesRepo, rulesRepo, settingsRepo, screenshotsRepo } from '../db'

// ---------- Export ----------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [trades, dailyJournal, strategies, tradingRules, settings, screenshots] = await Promise.all([
    tradesRepo.all(), journalRepo.all(), strategiesRepo.all(), rulesRepo.all(), settingsRepo.get(), screenshotsRepo.all()
  ])

  const screenshotPayload = await Promise.all(
    screenshots.map(async (s) => ({
      id: s.id, tradeId: s.tradeId, mimeType: s.mimeType, base64: await blobToBase64(s.blob)
    }))
  )

  return {
    appName: 'TradeVault',
    exportedAt: new Date().toISOString(),
    version: 1,
    trades, dailyJournal, strategies, tradingRules, settings,
    screenshots: screenshotPayload
  }
}

export async function exportBackupFile() {
  const payload = await buildBackupPayload()
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tradevault-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------- Import ----------

export interface ImportSummary {
  trades: number
  dailyJournal: number
  strategies: number
  tradingRules: number
  screenshots: number
  hasSettings: boolean
}

export interface ParsedImport {
  payload: BackupPayload
  summary: ImportSummary
}

export class InvalidBackupError extends Error {}

export function parseBackupJson(raw: string): ParsedImport {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    throw new InvalidBackupError('This file is not valid JSON.')
  }
  if (typeof data !== 'object' || data === null) {
    throw new InvalidBackupError('This file does not look like a TradeVault backup.')
  }
  const d = data as Partial<BackupPayload>
  if (!Array.isArray(d.trades)) {
    throw new InvalidBackupError('This file is missing trade data and cannot be imported.')
  }

  const payload: BackupPayload = {
    appName: 'TradeVault',
    exportedAt: typeof d.exportedAt === 'string' ? d.exportedAt : new Date().toISOString(),
    version: 1,
    trades: (d.trades as Trade[]).filter((t) => t && typeof t.id === 'string'),
    dailyJournal: Array.isArray(d.dailyJournal) ? (d.dailyJournal as DailyJournalEntry[]).filter((j) => j && typeof j.date === 'string') : [],
    strategies: Array.isArray(d.strategies) ? (d.strategies as StrategyDef[]).filter((s) => s && typeof s.id === 'string') : [],
    tradingRules: Array.isArray(d.tradingRules) ? (d.tradingRules as TradingRule[]).filter((r) => r && typeof r.id === 'string') : [],
    settings: d.settings as Settings,
    screenshots: Array.isArray(d.screenshots) ? d.screenshots : []
  }

  return {
    payload,
    summary: {
      trades: payload.trades.length,
      dailyJournal: payload.dailyJournal.length,
      strategies: payload.strategies.length,
      tradingRules: payload.tradingRules.length,
      screenshots: payload.screenshots.length,
      hasSettings: !!payload.settings
    }
  }
}

export type ImportMode = 'merge-keep-existing' | 'merge-overwrite-duplicates'

/**
 * Applies an imported backup. Never clears anything that isn't in the
 * import file. For records whose ID already exists locally:
 *  - 'merge-keep-existing'     -> local copy wins, import is skipped for that record
 *  - 'merge-overwrite-duplicates' -> imported copy replaces the local one
 * Either way this is additive/merge — it never deletes local records
 * that are absent from the import file.
 */
export async function applyImport(payload: BackupPayload, mode: ImportMode): Promise<void> {
  const [existingTrades, existingJournal, existingStrategies, existingRules] = await Promise.all([
    tradesRepo.all(), journalRepo.all(), strategiesRepo.all(), rulesRepo.all()
  ])
  const existingTradeIds = new Set(existingTrades.map((t) => t.id))
  const existingJournalDates = new Set(existingJournal.map((j) => j.date))
  const existingStrategyIds = new Set(existingStrategies.map((s) => s.id))
  const existingRuleIds = new Set(existingRules.map((r) => r.id))

  const shouldWrite = (exists: boolean) => !exists || mode === 'merge-overwrite-duplicates'

  await Promise.all(payload.trades.filter((t) => shouldWrite(existingTradeIds.has(t.id))).map((t) => tradesRepo.put(t)))
  await Promise.all(payload.dailyJournal.filter((j) => shouldWrite(existingJournalDates.has(j.date))).map((j) => journalRepo.put(j)))
  await Promise.all(payload.strategies.filter((s) => shouldWrite(existingStrategyIds.has(s.id))).map((s) => strategiesRepo.put(s)))
  await Promise.all(payload.tradingRules.filter((r) => shouldWrite(existingRuleIds.has(r.id))).map((r) => rulesRepo.put(r)))

  for (const s of payload.screenshots) {
    try {
      const blob = base64ToBlob(s.base64, s.mimeType)
      await screenshotsRepo.put({ id: s.id, tradeId: s.tradeId, mimeType: s.mimeType, blob, createdAt: new Date().toISOString() })
    } catch {
      // Skip any screenshot that fails to decode rather than aborting the whole import.
    }
  }
  // Settings are intentionally never auto-imported over the user's
  // current preferences; Settings page offers that as an explicit
  // separate opt-in step if desired.
}

// Generates a locally-unique ID. Uses crypto.randomUUID when available
// (all modern WebViews / browsers support it) with a safe fallback.
export function newId(prefix = ''): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return prefix ? `${prefix}_${rnd}` : rnd
}

/** Short, human-friendly trade reference shown in lists (e.g. TV-4F2A91). */
export function shortTradeRef(id: string): string {
  const clean = id.replace(/-/g, '').toUpperCase()
  return `TV-${clean.slice(0, 6)}`
}

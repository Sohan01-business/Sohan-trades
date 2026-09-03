import React, { useState } from 'react'
import { useApp } from '../store/AppContext'
import { PageHeader, Card, TextInput, Button, Toggle, ConfirmDialog, EmptyState } from '../components/ui'

const SUGGESTIONS = [
  'Maximum risk per trade: 1%', 'Maximum 5 trades per day', 'Stop trading after 3 losses in a row',
  'Always use a stop loss', 'Never revenge trade', 'Never enter without confirmation'
]

export default function TradingRules() {
  const { tradingRules, addRule, updateRule, deleteRule } = useApp()
  const [text, setText] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  async function handleAdd(value?: string) {
    const t = (value ?? text).trim()
    if (!t) return
    await addRule(t)
    setText('')
  }

  return (
    <div>
      <PageHeader title="My Trading Rules" subtitle="Rules you set for yourself — TradeVault can ask if you followed them." />
      <div className="px-4 flex flex-col gap-4 pb-10">
        <Card className="flex flex-col gap-3">
          <div className="flex gap-2">
            <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Maximum risk per trade: 1%" className="flex-1" />
            <Button onClick={() => handleAdd()}>Add</Button>
          </div>
          {tradingRules.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => handleAdd(s)}
                  className="text-xs px-2.5 py-1.5 rounded-pill bg-base-overlay text-ink-muted border border-base-border">
                  + {s}
                </button>
              ))}
            </div>
          )}
        </Card>

        {tradingRules.length === 0 ? (
          <EmptyState title="No rules yet. Add the ones that matter most to your trading." />
        ) : (
          <div className="flex flex-col gap-2">
            {tradingRules.map((rule) => (
              <Card key={rule.id} className="flex items-center justify-between gap-3">
                <span className={`text-sm flex-1 ${rule.active ? 'text-ink' : 'text-ink-faint line-through'}`}>{rule.text}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <Toggle checked={rule.active} onChange={(v) => updateRule({ ...rule, active: v })} />
                  <button onClick={() => setPendingDelete(rule.id)} className="text-ink-faint text-sm">Delete</button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this rule?"
        message="This only removes the rule going forward — past trades keep their recorded answers."
        confirmLabel="Delete"
        danger
        onConfirm={async () => { if (pendingDelete) await deleteRule(pendingDelete); setPendingDelete(null) }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

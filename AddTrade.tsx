import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emptyTrade } from '../types'
import { TradeForm } from '../components/TradeForm'
import { PageHeader, SegmentedControl } from '../components/ui'

export default function AddTrade() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'full' | 'quick'>('full')

  return (
    <div>
      <PageHeader title="Add Trade" subtitle="Takes about 30–60 seconds for the basics." />
      <div className="px-4 mb-4">
        <SegmentedControl<'full' | 'quick'>
          value={mode}
          onChange={setMode}
          options={[{ label: 'Full form', value: 'full' }, { label: 'Quick Add', value: 'quick' }]}
        />
      </div>
      <div className="px-4">
        <TradeForm
          key={mode}
          initial={emptyTrade({ quickAdd: mode === 'quick' })}
          mode={mode}
          onSaved={(t) => navigate(`/trades/${t.id}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  )
}

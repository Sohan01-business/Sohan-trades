import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { TradeForm } from '../components/TradeForm'
import { PageHeader, EmptyState } from '../components/ui'

export default function EditTrade() {
  const { id } = useParams<{ id: string }>()
  const { trades } = useApp()
  const navigate = useNavigate()
  const trade = trades.find((t) => t.id === id)

  if (!trade) {
    return (
      <div>
        <PageHeader title="Edit trade" />
        <EmptyState title="This trade could not be found." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={`Edit ${trade.symbol || 'trade'}`} />
      <div className="px-4">
        <TradeForm
          initial={trade}
          mode="full"
          onSaved={(t) => navigate(`/trades/${t.id}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  )
}

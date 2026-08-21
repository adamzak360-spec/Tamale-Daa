import { formatCurrency } from '../../utils/currency'
import type { Payout } from '../../services/marketplaceService'
import { PageHeader, DataTable, StatusBadge } from '../../components/ui'

export default function SellerPayouts({ payouts }: { payouts: Payout[] }) {
  const total = payouts.reduce((a, b) => a + (b.amount || 0), 0)
  const paidTotal = payouts.filter(p => p.status === 'paid').reduce((a, b) => a + (b.amount || 0), 0)

  return (
    <div className="page-content">
      <PageHeader
        title="My Payouts"
        subtitle={`Your settled earnings. Total: ${formatCurrency(total)} — paid: ${formatCurrency(paidTotal)}`}
      />

      <DataTable<Payout>
        data={payouts}
        loading={false}
        emptyTitle="No payouts yet"
        emptyMessage="The admin records your payouts here after each settlement."
        stickyHeader
        caption={`${payouts.length} payout${payouts.length !== 1 ? 's' : ''} · total ${formatCurrency(total)} · paid ${formatCurrency(paidTotal)}`}
        rowKey={p => p.id}
        columns={[
          {
            key: 'amount', header: 'Amount', width: '120px', align: 'right',
            cell: p => <span className="dt-amount">{formatCurrency(p.amount)}</span>,
          },
          {
            key: 'method', header: 'Method', width: '150px',
            cell: p => (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{p.payment_method || '—'}</div>
                {p.payment_reference && <div style={{ fontSize: '0.76rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{p.payment_reference}</div>}
              </div>
            ),
          },
          {
            key: 'status', header: 'Status', width: '120px', align: 'center',
            cell: p => <StatusBadge status={p.status}>{p.status}</StatusBadge>,
          },
          {
            key: 'date', header: 'Created', width: '120px',
            cell: p => new Date(p.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
          },
        ]}
      />
    </div>
  )
}

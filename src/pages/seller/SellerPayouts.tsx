import { formatCurrency } from '../../utils/currency'
import type { Payout } from '../../services/marketplaceService'
import { PageHeader, EmptyState, StatusBadge } from '../../components/ui'

export default function SellerPayouts({ payouts }: { payouts: Payout[] }) {
  const total = payouts.reduce((a, b) => a + (b.amount || 0), 0)
  const paidTotal = payouts.filter(p => p.status === 'paid').reduce((a, b) => a + (b.amount || 0), 0)

  return (
    <div className="page-content">
      <PageHeader
        title="My Payouts"
        subtitle={`Your settled earnings. Total: ${formatCurrency(total)} — paid: ${formatCurrency(paidTotal)}`}
      />

      {payouts.length === 0 ? (
        <EmptyState
          title="No payouts yet"
          message="The admin records your payouts here after each settlement."
        />
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td data-label="Amount" style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  <td data-label="Amount">{p.payment_method || '—'}</td>
                  <td data-label="Reference" style={{ fontSize: '0.85rem', color: '#4b5563' }}>{p.payment_reference || '—'}</td>
                  <td data-label="Status">
                    <StatusBadge status={p.status}>{p.status}</StatusBadge>
                  </td>
                  <td data-label="Method">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

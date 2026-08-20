import { formatCurrency } from '../../utils/currency'
import type { Payout } from '../../services/marketplaceService'

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fff7ed', fg: '#c2410c' },
  processing: { bg: '#eff6ff', fg: '#1d4ed8' },
  paid: { bg: '#f0fdf4', fg: '#15803d' },
  failed: { bg: '#fef2f2', fg: '#dc2626' },
}

export default function SellerPayouts({ payouts }: { payouts: Payout[] }) {
  const total = payouts.reduce((a, b) => a + (b.amount || 0), 0)
  const paidTotal = payouts.filter(p => p.status === 'paid').reduce((a, b) => a + (b.amount || 0), 0)

  return (
    <div className="payouts-content">
      <div className="view-header-row">
        <div>
          <h3 className="section-title">My Payouts</h3>
          <p className="section-subtitle">Your settled earnings. Total: {formatCurrency(total)} — paid: {formatCurrency(paidTotal)}</p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <div className="empty-state">
          <h3>No payouts yet</h3>
          <p>The admin records your payouts here after each settlement.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                  <td>{p.payment_method || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#4b5563' }}>{p.payment_reference || '—'}</td>
                  <td>
                    <span className="status-badge" style={{ background: STATUS_STYLES[p.status]?.bg, color: STATUS_STYLES[p.status]?.fg, textTransform: 'capitalize' }}>{p.status}</span>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

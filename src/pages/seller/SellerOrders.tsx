import { formatCurrency } from '../../utils/currency'
import type { Order } from '../../types'

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fff7ed', fg: '#c2410c' },
  confirmed: { bg: '#eff6ff', fg: '#1d4ed8' },
  processing: { bg: '#eff6ff', fg: '#1d4ed8' },
  'ready-for-pickup': { bg: '#fefce8', fg: '#a16207' },
  'out-for-delivery': { bg: '#f0f9ff', fg: '#0369a1' },
  delivered: { bg: '#f0fdf4', fg: '#15803d' },
  cancelled: { bg: '#fef2f2', fg: '#dc2626' },
}

export default function SellerOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="orders-list-content">
      <div className="view-header-row">
        <div>
          <h3 className="section-title">My Orders</h3>
          <p className="section-subtitle">Orders containing your products. The admin handles fulfillment and delivery.</p>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{orders.length} order{orders.length === 1 ? '' : 's'}</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>When customers order your products, the orders appear here.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td data-label="Order ID"><code style={{ fontSize: '0.8rem' }}>{(o.id || '').slice(0, 8)}</code></td>
                  <td data-label="Status">{o.customer_name || o.customer_email || '—'}</td>
                  <td data-label="Order ID">{(o.items || []).length} item{(o.items || []).length === 1 ? '' : 's'}</td>
                  <td data-label="Order ID">{formatCurrency((o as any).total_amount)}</td>
                  <td data-label="Items">
                    <span className="status-badge" style={{ background: STATUS_STYLES[o.status]?.bg, color: STATUS_STYLES[o.status]?.fg, textTransform: 'capitalize' }}>{o.status.replace(/-/g, ' ')}</span>
                  </td>
                  <td data-label="Date">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

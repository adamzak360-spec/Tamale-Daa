import { formatCurrency } from '../../utils/currency'
import type { Order } from '../../types'
import { PageHeader, EmptyState, StatusBadge } from '../../components/ui'

export default function SellerOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="page-content">
      <PageHeader
        title="My Orders"
        subtitle={`Orders containing your products (${orders.length} total). The admin handles fulfillment and delivery.`}
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="When customers order your products, the orders appear here."
        />
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
                    <StatusBadge status={o.status as any}>{o.status.replace(/-/g, ' ')}</StatusBadge>
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

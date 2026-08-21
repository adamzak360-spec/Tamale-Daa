import { formatCurrency } from '../../utils/currency'
import type { Order } from '../../types'
import { PageHeader, DataTable, StatusBadge } from '../../components/ui'

export default function SellerOrders({ orders }: { orders: Order[] }) {
  return (
    <div className="page-content">
      <PageHeader
        title="My Orders"
        subtitle={`Orders containing your products (${orders.length} total). The admin handles fulfillment and delivery.`}
      />

      <DataTable<Order>
        data={orders}
        loading={false}
        emptyTitle="No orders yet"
        emptyMessage="When customers order your products, the orders appear here."
        stickyHeader
        caption={`${orders.length} order${orders.length !== 1 ? 's' : ''} containing your products`}
        rowKey={o => o.id || ''}
        columns={[
          {
            key: 'order-id', header: 'Order ID', width: '110px',
            cell: o => <code style={{ fontSize: '0.8rem', color: 'var(--color-navy)', fontWeight: 600 }}>{(o.id || '').slice(0, 8)}</code>,
          },
          {
            key: 'customer', header: 'Customer', minWidth: '180px',
            cell: o => o.customer_name || o.customer_email || '—',
          },
          {
            key: 'items', header: 'Items', width: '80px', align: 'center',
            cell: o => `${(o.items || []).length} item${(o.items || []).length === 1 ? '' : 's'}`,
          },
          {
            key: 'total', header: 'Total', width: '110px', align: 'right',
            cell: o => <span className="dt-amount">{formatCurrency((o as any).total_amount)}</span>,
          },
          {
            key: 'status', header: 'Status', width: '150px', align: 'center',
            cell: o => <StatusBadge status={o.status as any}>{o.status.replace(/-/g, ' ')}</StatusBadge>,
          },
          {
            key: 'date', header: 'Date', width: '115px',
            cell: o => o.created_at ? new Date(o.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          },
        ]}
      />
    </div>
  )
}

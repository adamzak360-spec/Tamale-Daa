import { useMemo, useState } from 'react'
import type { Order } from '../../types'
import { formatCurrency } from '../../utils/currency'
import {
  exportOrdersCSV,
  exportCustomersCSV,
} from '../../services/adminAnalyticsService'
import { Button, Select, StatusBadge, PageHeader, DataTable, TableToolbar, PersonCell } from '../../components/ui'
import { toast } from '../../components/ui'
import { FileDown, Users } from 'lucide-react'

interface AdminOrdersProps {
  orders: Order[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  filterStatus: string
  onFilterStatusChange: (v: string) => void
  filterSource: string
  onFilterSourceChange: (v: string) => void
  onStatusChange: (orderId: string, newStatus: Order['status']) => void
  onViewOrder: (order: Order) => void
  onExportOrders?: () => void
  onExportCustomers?: () => void
}

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default function AdminOrders({ orders, loading, searchTerm: eSearch, onSearchChange: eSetSearch, filterStatus: eFiltStatus, onFilterStatusChange: eSetFiltStatus, filterSource: eFiltSource, onFilterSourceChange: eSetFiltSource, onStatusChange, onViewOrder, onExportOrders, onExportCustomers }: AdminOrdersProps) {
  const [iSearch, setISearch] = useState('')
  const searchTerm = eSearch !== undefined ? eSearch : iSearch
  const setSearchTerm = eSetSearch || setISearch
  const [iFiltStatus, setIFiltStatus] = useState('')
  const filterStatus = eFiltStatus !== undefined ? eFiltStatus : iFiltStatus
  const setFilterStatus = eSetFiltStatus || setIFiltStatus
  const [iFiltSource, setIFiltSource] = useState('')
  const filterSource = eFiltSource !== undefined ? eFiltSource : iFiltSource
  const setFilterSource = eSetFiltSource || setIFiltSource

  const filtered = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch =
        (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.customer_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      const matchesStatus = !filterStatus || order.status === filterStatus
      const matchesSource = !filterSource || order.source === filterSource
      return matchesSearch && matchesStatus && matchesSource
    })
  }, [orders, searchTerm, filterStatus, filterSource])

  const exportOrders = async () => {
    if (onExportOrders) { await onExportOrders(); return }
    try {
      const csv = exportOrdersCSV(orders)
      downloadCSV(csv, `orders-${new Date().toISOString().split('T')[0]}.csv`)
      toast('Orders exported successfully', 'success')
    } catch (err) {
      toast('Failed to export orders', 'error')
    }
  }

  const exportCustomers = async () => {
    try {
      const csv = await exportCustomersCSV()
      downloadCSV(csv, `customers-${new Date().toISOString().split('T')[0]}.csv`)
      toast('Customers exported successfully', 'success')
    } catch (err) {
      toast('Failed to export customers', 'error')
    }
  }

  return (
    <div className="page-content">
      <PageHeader title="Orders" subtitle={`${filtered.length} of ${orders.length} orders`} actions={
        <>
          <Button variant="outline" size="sm" onClick={() => { if (onExportOrders) onExportOrders(); else exportOrders() }} icon={<FileDown size={15} />}>Export Orders</Button>
          <Button variant="outline" size="sm" onClick={() => { if (onExportCustomers) onExportCustomers(); else exportCustomers() }} icon={<Users size={15} />}>Export Customers</Button>
        </>
      } />
      <TableToolbar>
        <input
          className="form-input"
          type="text"
          placeholder="Search orders by customer or ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search orders"
          style={{ minWidth: '230px' }}
        />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter status" style={{ minWidth: '165px' }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="ready-for-pickup">Ready for Pickup</option>
          <option value="out-for-delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} aria-label="Filter source" style={{ minWidth: '130px' }}>
          <option value="">All Sources</option>
          <option value="ONLINE">Online</option>
          <option value="POS">POS</option>
        </Select>
      </TableToolbar>

      <DataTable
        data={filtered}
        loading={loading && orders.length === 0}
        emptyTitle={orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
        emptyMessage={orders.length === 0 ? 'Orders will appear here once customers place them.' : 'Try adjusting your search or filters.'}
        stickyHeader
        caption={`${filtered.length} of ${orders.length} orders`}
        rowKey={o => o.id || ''}
        columns={[
          {
            key: 'order-id', header: 'Order ID', width: '110px',
            cell: o => <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--color-navy)', fontWeight: 600 }} title={o.id}>{(o.id || '').substring(0, 8)}…</span>,
          },
          {
            key: 'customer', header: 'Customer', minWidth: '190px',
            cell: o => <PersonCell primary={o.customer_name || '—'} secondary={o.customer_email || undefined} muted={o.source === 'POS' ? 'POS sale' : 'Online'} />,
          },
          {
            key: 'source', header: 'Source', width: '90px', align: 'center',
            cell: o => <StatusBadge status={o.source === 'POS' ? 'inactive' : 'active'}>{o.source === 'POS' ? 'POS' : 'Online'}</StatusBadge>,
          },
          {
            key: 'date', header: 'Date', width: '110px',
            cell: o => o.created_at ? new Date(o.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          },
          {
            key: 'total', header: 'Amount', width: '105px', align: 'right',
            cell: o => <span className="dt-amount">{formatCurrency(o.total)}</span>,
          },
          {
            key: 'status', header: 'Status', width: '150px', align: 'center',
            cell: o => <StatusBadge status={o.status as any}>{o.status.replace('-', ' ')}</StatusBadge>,
          },
          {
            key: 'actions', header: 'Actions', width: '210px', sticky: 'right', align: 'right', wrap: true,
            cell: o => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <select
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id!, e.target.value as Order['status'])}
                  className="form-select dt-status-select"
                  aria-label="Change order status"
                  style={{ minWidth: '110px', minHeight: '32px', fontSize: '0.78rem', padding: '0 1.6rem 0 0.5rem' }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="processing">Processing</option>
                  <option value="ready-for-pickup">Ready for Pickup</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button variant="ghost" size="sm" onClick={() => onViewOrder(o)}>View</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

interface OrderModalProps {
  order: Order | null
  onClose: () => void
}

export function OrderDetailsModal({ order, onClose }: OrderModalProps) {
  if (!order) return null
  const subtotal = order.subtotal || order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0
  const grandTotal = order.total || subtotal + (order.delivery_fee || 0)
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Order Details</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="order-details-grid">
          <div className="details-section">
            <h4>Customer Information</h4>
            <div className="details-card">
              <div className="detail-item">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">{order.customer_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{order.customer_email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{order.customer_phone}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{order.delivery_address}, {order.city}, {order.region}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Customer Type:</span>
                <span className={`detail-value type-badge ${order.user_id ? 'registered' : 'guest'}`}>
                  {order.user_id ? 'Registered User' : 'Guest'}
                </span>
              </div>
              {order.notes && (
                <div className="detail-item notes">
                  <span className="detail-label">Notes:</span>
                  <p className="detail-value">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="details-section">
            <h4>Order Information</h4>
            <div className="details-card">
              <div className="detail-item">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value monospace">{order.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className={`status-badge status-${order.status}`}>
                  {order.status.replace('-', ' ')}
                </span>
              </div>
              <div className="detail-item summary-row">
                <span className="detail-label">Subtotal:</span>
                <span className="detail-value">{formatCurrency(subtotal)}</span>
              </div>
              <div className="detail-item summary-row">
                <span className="detail-label">Delivery Fee:</span>
                <span className="detail-value">{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
              <div className="detail-item summary-row grand-total">
                <span className="detail-label">Grand Total:</span>
                <span className="detail-value">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Status:</span>
                <span className={`status-badge status-${order.payment_status}`}>
                  {order.payment_status?.replace('-', ' ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {order.payment_method && (
            <div className="details-section">
              <h4>Payment Information</h4>
              <div className="details-card">
                <div className="detail-item">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{order.payment_method}</span>
                </div>
                {order.paystack_reference && (
                  <div className="detail-item">
                    <span className="detail-label">Paystack Reference:</span>
                    <span className="detail-value monospace">{order.paystack_reference}</span>
                  </div>
                )}
                {order.amount_paid && (
                  <div className="detail-item">
                    <span className="detail-label">Amount Paid:</span>
                    <span className="detail-value">{formatCurrency(order.amount_paid)}</span>
                  </div>
                )}
                {order.payment_date && (
                  <div className="detail-item">
                    <span className="detail-label">Payment Date:</span>
                    <span className="detail-value">
                      {new Date(order.payment_date).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="details-section products-section">
          <h4>Products Ordered</h4>
          <div className="order-items-list">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td data-label="Date" className="product-image-cell">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="product-thumb" />
                      ) : (
                        <div className="product-thumb-placeholder">No image</div>
                      )}
                    </td>
                    <td data-label="Order ID">
                      <div className="product-name">{item.name}</div>
                      {item.selected_size && (
                        <div className="product-variant-small">Size: <strong>{item.selected_size}</strong></div>
                      )}
                      <div className="product-id-small">{item.id}</div>
                    </td>
                    <td data-label="Date">{item.quantity}</td>
                    <td data-label="Image">{formatCurrency(item.price)}</td>
                    <td data-label="Product">{formatCurrency(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

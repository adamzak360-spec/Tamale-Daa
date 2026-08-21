import { useMemo, useState } from 'react'
import type { Order } from '../../types'
import { formatCurrency } from '../../utils/currency'
import {
  exportOrdersCSV,
  exportCustomersCSV,
} from '../../services/adminAnalyticsService'

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
  const [exportNotice, setExportNotice] = useState('')

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
      setExportNotice('Orders exported successfully')
    } catch (err) {
      setExportNotice('Failed to export orders')
    }
    setTimeout(() => setExportNotice(''), 3000)
  }

  const exportCustomers = async () => {
    try {
      const csv = await exportCustomersCSV()
      downloadCSV(csv, `customers-${new Date().toISOString().split('T')[0]}.csv`)
      setExportNotice('Customers exported successfully')
    } catch (err) {
      setExportNotice('Failed to export customers')
    }
    setTimeout(() => setExportNotice(''), 3000)
  }

  return (
    <div className="orders-list-content">
      {exportNotice && (
        <div className={`notification ${exportNotice.includes('Failed') ? 'error' : 'success'}`}>
          <span>{exportNotice}</span>
        </div>
      )}
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search orders by customer or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="ready-for-pickup">Ready for Pickup</option>
          <option value="out-for-delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="filter-select"
        >
          <option value="">All Sources</option>
          <option value="ONLINE">Online</option>
          <option value="POS">POS</option>
        </select>
        <button onClick={() => { if (onExportOrders) onExportOrders(); else exportOrders() }} className="btn-export" title="Export orders as CSV">Export Orders</button>
        <button onClick={() => { if (onExportCustomers) onExportCustomers(); else exportCustomers() }} className="btn-export" title="Export customers as CSV">Export Customers</button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="empty-state"><h3>Loading orders...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{orders.length === 0 ? 'No orders yet' : 'No orders match your search'}</h3>
          <p>{orders.length === 0 ? 'Orders will appear here once customers place them.' : 'Try adjusting your search or filters.'}</p>
        </div>
      ) : (
        <div className="orders-table">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td data-label="Order ID" className="order-id-cell">
                    <span className="order-id" title={order.id}>
                      {order.id?.substring(0, 8)}...
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="customer-info">
                      <div className="customer-name">{order.customer_name}</div>
                      <div className="customer-email">{order.customer_email}</div>
                    </div>
                  </td>
                  <td data-label="Status">{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td data-label="Quantity">{formatCurrency(order.total)}</td>
                  <td data-label="Date">
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td data-label="Status" className="actions-cell">
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id!, e.target.value as Order['status'])}
                      className="status-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="processing">Processing</option>
                      <option value="ready-for-pickup">Ready for Pickup</option>
                      <option value="out-for-delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button onClick={() => onViewOrder(order)} className="btn-view" title="View order details">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

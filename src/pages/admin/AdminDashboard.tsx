import { useState, useEffect, useMemo } from 'react'
import type { Product, DashboardStats, Order } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { useAuth } from '../../context/AuthContext'
import { getSellers } from '../../services/marketplaceService'
import { KpiCard, SkeletonTable, StatusBadge, Button, EmptyState } from '../../components/ui'
import { ShoppingBag, Package, Wallet, Store, Users as UsersIcon } from 'lucide-react'

interface AdminDashboardProps {
  stats: DashboardStats
  products: Product[]
  orders?: Order[]
  loading: boolean
  onAddProduct: () => void
}

function greetingForHour(h: number): string {
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Welcome back'
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const { stats, products, loading, onAddProduct } = props
  const propsOrders = props.orders
  const { user } = useAuth()
  const [sellerCount, setSellerCount] = useState(0)
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const sellersData = await getSellers()
        if (cancelled) return
        setSellerCount(sellersData?.length || 0)
        setDataReady(true)
      } catch {
        if (cancelled) return
        setDataReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])
  const orders = propsOrders || []

  const revenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (Number(o.amount_paid) || o.total || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const customers = useMemo(() => new Set(orders.map(o => o.user_id || o.customer_email).filter(Boolean)).size, [orders])

  const recentOrders = orders.slice(0, 5)
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'

  return (
    <div className="dashboard-content">
      <div className="dashboard-greeting">
        <h2 className="greeting-title">{greetingForHour(new Date().getHours())}, {name} 👋</h2>
        <p className="greeting-sub">Here's what's happening with your marketplace today.</p>
      </div>

      <div className="kpi-grid">
        {!dataReady ? (
          <SkeletonTable rows={2} cols={4} />
        ) : (
          <>
            <KpiCard icon={<Package size={20} />} iconBg="var(--color-navy-light)" label="Total Products" value={stats.total} sub={`${stats.active} active`} />
            <KpiCard icon={<ShoppingBag size={20} />} iconBg="var(--color-teal-light)" label="Total Orders" value={orders.length} sub={`${pendingOrders} pending`} />
            <KpiCard icon={<Wallet size={20} />} iconBg="var(--color-navy-light)" label="Revenue (Paid)" value={formatCurrency(revenue)} />
            <KpiCard icon={<Store size={20} />} iconBg="var(--color-teal-light)" label="Registered Sellers" value={sellerCount} />
            <KpiCard icon={<UsersIcon size={20} />} iconBg="var(--color-navy-light)" label="Customers" value={customers} />
            <KpiCard icon={<Package size={20} />} iconBg="var(--color-warning-bg)" label="Out of Stock" value={stats.outOfStock} />
          </>
        )}
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h3>Recent Orders</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{orders.length} total</span>
        </div>
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="Orders from your store will appear here once customers start buying."
            action={{ label: 'Add a Product', onClick: onAddProduct }}
          />
        ) : (
          <div className="recent-orders">
            {recentOrders.map(o => (
              <div key={o.id} className="recent-order-card">
                <div>
                  <div className="recent-order-name">{o.customer_name}</div>
                  <div className="recent-order-meta">{o.items?.length || 0} item(s) · {o.city || ''} {o.region || ''}</div>
                </div>
                <div className="recent-order-right">
                  <div className="recent-order-total">{formatCurrency(o.total)}</div>
                  <StatusBadge status={o.status}>{o.status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="recent-products">
        <h3>Recent Products</h3>
        {loading || products.length === 0 ? (
          <div className="empty-state">
            <h3>No products yet</h3>
            <p>Start by adding your first product.</p>
            <Button variant="primary" onClick={onAddProduct}>Add Product</Button>
          </div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map(product => (
                  <tr key={product.id}>
                    <td className="product-image-cell">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="product-thumb" />
                      ) : (
                        <div className="product-thumb-placeholder">No image</div>
                      )}
                    </td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock_quantity}</td>
                    <td>
                      <StatusBadge status={product.status}>
                        {product.status === 'active' ? 'Active' : product.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

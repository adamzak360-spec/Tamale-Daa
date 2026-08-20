import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { lazy, Suspense } from 'react'
import AdminShell, { SidebarSection } from '../components/AdminShell'
import AdminDashboard from './admin/AdminDashboard'
import AdminVisibility from './admin/AdminVisibility'
import {
  getMyStore,
  getPayouts,
  getSellerProductIds,
  type Seller,
  type Payout,
} from '../services/marketplaceService'
import { getAllProducts, getDashboardStats } from '../services/productService'
import { getAllOrders } from '../services/orderService'
import type { Product, Order, DashboardStats } from '../types'

const SellerOrders = lazy(() => import('./seller/SellerOrders'))
const SellerPayouts = lazy(() => import('./seller/SellerPayouts'))
const SellerStoreSettings = lazy(() => import('./seller/SellerStoreSettings'))

type SellerView = 'dashboard' | 'products' | 'add' | 'edit' | 'orders' | 'visibility' | 'payouts' | 'storeSettings'

export default function SellerDashboard() {
  const { user } = useAuth()
  const [view, setView] = useState<SellerView>('dashboard')
  const [store, setStore] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DashboardStats>({ total: 0, active: 0, outOfStock: 0 })
  const [payouts, setPayouts] = useState<Payout[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = useCallback(async () => {
    setLoading(true)
    if (!user) return
    const myStore = await getMyStore(user.id)
    if (!myStore) { setLoading(false); return }
    setStore(myStore)

    if (myStore.status === 'approved') {
      const [allProducts, ids, ordersData, statsData, payoutData] = await Promise.all([
        getAllProducts(),
        getSellerProductIds(myStore.id),
        getAllOrders(),
        getDashboardStats(),
        getPayouts(),
      ])
      // Seller only sees products they are linked to (their products live in the shared catalog)
      const linked = allProducts.filter(p => ids.includes(p.id))
      setProducts(linked)
            // Seller orders = orders containing at least one of their linked products
      const myOrders = ordersData.filter(o =>
        (o.items || []).some((item: any) => ids.includes(item.product_id || item.productId))
      )
      setOrders(myOrders)
      setStats({ ...statsData, total: linked.length, active: linked.filter(p => p.status === 'active').length, outOfStock: linked.filter(p => p.status === 'out-of-stock').length })
      setPayouts(payoutData.filter(p => p.seller_id === myStore.id))
    }
    setLoading(false)
  }, [user])

  const reload = () => load()

  const sellerStats = useMemo(() => ({
    ...stats,
    totalOrders: orders.length,
    totalPayouts: payouts.reduce((a, b) => a + (b.amount || 0), 0),
  }), [stats, orders, payouts])

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your store...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="admin-page" style={{ padding: 60, textAlign: 'center' }}>
        <h2>No store found</h2>
        <p>Your seller application hasn't been approved yet. You'll be notified once the admin approves your store.</p>
        <p style={{ marginTop: 12 }}>
          <a href="/stores" style={{ color: '#2563eb' }}>Browse the Stores Directory</a>
        </p>
      </div>
    )
  }

  if (store.status === 'pending') {
    return (
      <div className="admin-page" style={{ padding: 60, textAlign: 'center' }}>
        <h2>Store application pending</h2>
        <p>Your application for "{store.business_name}" is being reviewed by the admin. You'll gain access to your seller dashboard once it's approved.</p>
      </div>
    )
  }

  if (store.status !== 'approved') {
    return (
      <div className="admin-page" style={{ padding: 60, textAlign: 'center' }}>
        <h2>Store not available</h2>
        <p>Your store status is currently "{store.status}". Please contact the marketplace admin.</p>
      </div>
    )
  }

  const sections: SidebarSection[] = [
    {
      title: 'My Store',
      items: [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'products', label: 'My Products', badge: products.length },
        { key: 'add', label: '+ Add Product' },
        { key: 'visibility', label: 'Product Visibility' },
      ],
    },
    {
      title: 'Sales',
      items: [
        { key: 'orders', label: 'My Orders', badge: orders.length },
        { key: 'payouts', label: 'My Payouts' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { key: 'storeSettings', label: 'Store Settings' },
      ],
    },
  ]

  return (
    <AdminShell
      title="Seller Dashboard"
      sections={sections}
      active={view}
      onSelect={(k) => setView(k as SellerView)}
      userLabel={store.owner_email ?? ''}
    >
      <Suspense fallback={<div className="admin-loading">Loading view...</div>}>
        {view === 'dashboard' && <AdminDashboard stats={sellerStats} products={products} loading={loading} onAddProduct={() => setView('add')} />}
        {view === 'products' && (
          <div className="products-list-content">
            <div className="view-header-row">
              <div>
                <h3 className="section-title">My Products</h3>
                <p className="section-subtitle">Products in your store. Add new ones or contact the admin to manage visibility.</p>
              </div>
              <button onClick={() => setView('add')} className="btn-primary">+ Add Product</button>
            </div>
            {products.length === 0 ? (
              <div className="empty-state">
                <h3>No products yet</h3>
                <p>Add your first product to start selling.</p>
              </div>
            ) : (
              <div className="products-table">
                <table>
                  <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{p.image_url && <img src={p.image_url} alt={p.name} className="product-thumb" />}<span style={{ fontWeight: 600 }}>{p.name}</span></div></td>
                        <td>{p.category}</td>
                        <td>GH₵{p.price}</td>
                        <td>{p.stock_quantity}</td>
                        <td><span className={`status-badge ${p.status}`}>{p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {view === 'add' && (
          <div className="products-list-content">
            <div className="view-header-row">
              <div>
                <h3 className="section-title">Add Product to Your Store</h3>
                <p className="section-subtitle">Submit your product — the admin will review and publish it to the marketplace.</p>
              </div>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              To keep the catalog consistent, new products are submitted for admin approval. After you add a product here, contact the admin via chat or request it be linked to your store.
            </p>
            {/* Seller add form reuses the product form in read-only submit mode with a notice */}
            <div className="empty-state" style={{ marginTop: 16 }}>
              <h3>Product submission</h3>
              <p style={{ maxWidth: 520, margin: '8px auto' }}>
                Use the marketplace "Add Product" flow — for now, send your product details (name, photos, price, stock, description) to the admin through the site chat, and they'll add it to your store.
              </p>
            </div>
          </div>
        )}
        {view === 'visibility' && <AdminVisibility products={products} />}
        {view === 'orders' && <SellerOrders orders={orders} />}
        {view === 'payouts' && <SellerPayouts payouts={payouts} />}
        {view === 'storeSettings' && <SellerStoreSettings store={store} onSaved={reload} />}
      </Suspense>
    </AdminShell>
  )
}

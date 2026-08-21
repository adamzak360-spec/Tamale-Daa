import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { lazy, Suspense } from 'react'
import AdminShell, { SidebarSection } from '../components/AdminShell'
import AdminVisibility from './admin/AdminVisibility'
import { Button, KpiCard, StatusBadge, SkeletonTable, EmptyState, DataTable } from '../components/ui'
import { formatCurrency } from '../utils/currency'
import { Package, ShoppingBag, Wallet, BellRing, Pencil, Trash2 } from 'lucide-react'
import {
  getMyStore,
  getPayouts,
  getSellerProductIds,
  linkSellerProduct,
  type Seller,
  type Payout,
} from '../services/marketplaceService'
import {
  getAllProducts,
  getDashboardStats,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadProductVideo,
  syncProductVariants,
  getProductVariants,
} from '../services/productService'
import { getAllOrders } from '../services/orderService'
import type { Product, Order, DashboardStats, ProductVariant } from '../types'
import AdminProductForm, { defaultFormState, type ProductFormState, type ProductFormErrors } from './admin/AdminProductForm'
import { toast, ConfirmDialog } from '../components/ui'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductFormState>(defaultFormState)
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    if (!user) return
    try {
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
        // Seller only sees products they are linked to
        const linked = allProducts.filter(p => ids.includes(p.id))
        setProducts(linked)
        
        const myOrders = ordersData.filter(o =>
          (o.items || []).some((item: any) => ids.includes(item.product_id || item.productId))
        )
        setOrders(myOrders)
        setStats({ 
          ...statsData, 
          total: linked.length, 
          active: linked.filter(p => p.status === 'active').length, 
          outOfStock: linked.filter(p => p.status === 'out-of-stock').length 
        })
        setPayouts(payoutData.filter(p => p.seller_id === myStore.id))
      }
    } catch (err) {
      console.error('Load failed:', err)
      toast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const reload = () => load()

  const validateForm = (): boolean => {
    const errors: ProductFormErrors = {}
    if (!formData.name.trim()) errors.name = 'Product name is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Valid price is required'
    if (!formData.category.trim()) errors.category = 'Category is required'
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) errors.stock_quantity = 'Valid stock quantity is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !store) return

    setIsSubmitting(true)
    try {
      let imageUrl = formData.existingImageUrl
      if (formData.image) {
        imageUrl = await uploadProductImage(formData.image)
      }

      const newGalleryUrls = await Promise.all(
        formData.galleryImages.map(file => uploadProductImage(file))
      )
      const gallery_urls = [...formData.existingGalleryUrls, ...newGalleryUrls]

      const newVideoUrls = await Promise.all(
        formData.videos.map(file => uploadProductVideo(file))
      )
      const video_urls = [...formData.existingVideoUrls, ...newVideoUrls]

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category.trim(),
        stock_quantity: parseInt(formData.stock_quantity),
        status: formData.status,
        image_url: imageUrl,
        gallery_urls,
        video_urls,
        has_sizes: formData.has_sizes,
        delivery_fee_tamale: formData.delivery_fee_tamale ? parseFloat(formData.delivery_fee_tamale) : 0,
        delivery_fee_greater_accra: formData.delivery_fee_greater_accra ? parseFloat(formData.delivery_fee_greater_accra) : 0,
        delivery_fee_lesser_accra: formData.delivery_fee_lesser_accra ? parseFloat(formData.delivery_fee_lesser_accra) : 0,
        delivery_fee_dhl: formData.delivery_fee_dhl ? parseFloat(formData.delivery_fee_dhl) : 0,
        delivery_fee_ups: formData.delivery_fee_ups ? parseFloat(formData.delivery_fee_ups) : 0,
        delivery_fee_fedex: formData.delivery_fee_fedex ? parseFloat(formData.delivery_fee_fedex) : 0,
        specifications: formData.specifications,
      }

      let savedProduct: Product
      if (view === 'edit' && editProduct) {
        savedProduct = await updateProduct(editProduct.id, productData)
        if (formData.has_sizes) {
          await syncProductVariants(editProduct.id, formData.variants)
        }
        toast('Product updated successfully!', 'success')
      } else {
        savedProduct = await createProduct(productData)
        // Link to seller
        await linkSellerProduct(store.id, savedProduct.id)
        if (formData.has_sizes) {
          await syncProductVariants(savedProduct.id, formData.variants)
        }
        toast('Product added successfully!', 'success')
      }

      setFormData(defaultFormState)
      setView('products')
      setEditProduct(null)
      await reload()
    } catch (err) {
      console.error('Submit failed:', err)
      toast(err instanceof Error ? err.message : 'Operation failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (product: Product) => {
    setEditProduct(product)
    let variants: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>[] = []
    if (product.has_sizes) {
      try {
        const variantData = await getProductVariants(product.id)
        variants = variantData.map(v => ({
          product_id: v.product_id,
          variant_type: v.variant_type,
          variant_value: v.variant_value,
          stock_quantity: v.stock_quantity,
          active: v.active
        }))
      } catch (err) {
        console.error('Failed to load variants:', err)
      }
    }

    setFormData({
      ...defaultFormState,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      status: product.status,
      existingImageUrl: product.image_url,
      existingGalleryUrls: product.gallery_urls || [],
      existingVideoUrls: product.video_urls || [],
      has_sizes: product.has_sizes || false,
      variants,
      delivery_fee_tamale: (product.delivery_fee_tamale || 0).toString(),
      delivery_fee_greater_accra: (product.delivery_fee_greater_accra || 0).toString(),
      delivery_fee_lesser_accra: (product.delivery_fee_lesser_accra || 0).toString(),
      delivery_fee_dhl: (product.delivery_fee_dhl || 0).toString(),
      delivery_fee_ups: (product.delivery_fee_ups || 0).toString(),
      delivery_fee_fedex: (product.delivery_fee_fedex || 0).toString(),
      specifications: typeof product.specifications === 'string'
        ? (() => { try { return JSON.parse(product.specifications); } catch { return {}; } })()
        : (product.specifications || {}),
    })
    setView('edit')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteProduct(deleteTarget.id)
      toast(`"${deleteTarget.name}" has been deleted.`, 'success')
      await reload()
      setDeleteTarget(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

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
      title: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard' },
      ],
    },
    {
      title: 'My Store',
      items: [
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

  const myOrders = orders
  const pendingOrders = myOrders.filter(o => o.status === 'pending').length
  const totalRevenue = myOrders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + (Number(o.amount_paid) || o.total || 0), 0)
  const awaitingConfirmation = myOrders.filter(o => o.status === 'delivered' && o.payment_status !== 'paid').length
  const storeSlug = store?.slug || store?.id

  const metrics = [
    { label: 'My Products', value: String(products.length), sub: `${products.filter(p => p.status === 'active').length} active` },
    { label: 'My Orders', value: String(myOrders.length), sub: `${pendingOrders} pending` },
    { label: 'Revenue (Paid)', value: formatCurrency(totalRevenue) },
    { label: 'Awaiting Confirmation', value: String(awaitingConfirmation), sub: awaitingConfirmation > 0 ? 'Customer must confirm delivery to settle' : 'All settled' },
    { label: 'Payouts Issued', value: formatCurrency(sellerStats.totalPayouts) },
  ]

  return (
    <AdminShell
      title="Seller Dashboard"
      sections={sections}
      active={view}
      onSelect={(k) => setView(k as SellerView)}
      userLabel={store.owner_email ?? ''}
    >
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will remove it from your store permanently.`}
        confirmLabel="Delete Product"
        danger
        busy={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Suspense fallback={<div className="admin-loading">Loading view...</div>}>
        {view === 'dashboard' && (
          <div className="dashboard-content">
            <div className="dashboard-greeting">
              <h2 className="greeting-title">Welcome back, {store.business_name} 👋</h2>
              <p className="greeting-sub">Here's an overview of your store.</p>
            </div>
            <div style={{ marginBottom: 18 }}>
              <Button variant="outline" onClick={() => window.open(`/store/${storeSlug}`, '_blank')} icon={<Package size={16} />}>Visit My Store</Button>
            </div>
            <div className="kpi-grid">
              {loading ? <SkeletonTable rows={2} cols={4} /> : metrics.map((m, i) => (
                <KpiCard key={m.label} icon={[<Package size={20} />, <ShoppingBag size={20} />, <Wallet size={20} />, <BellRing size={20} />][i]} iconBg={i % 2 === 0 ? 'var(--color-navy-light)' : 'var(--color-teal-light)'} label={m.label} value={m.value} sub={m.sub} />
              ))}
            </div>
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>My Products</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{products.length} total</span>
              </div>
              {products.length === 0 ? (
                <EmptyState title="No products yet" message="Add your first product to start selling on Tamale Daa." action={{ label: '+ Add Product', onClick: () => setView('add') }} />
              ) : (
                <div className="recent-orders">
                  {products.slice(0, 4).map(p => (
                    <div key={p.id} className="recent-order-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.image_url && <img src={p.image_url} alt={p.name} className="product-thumb" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} />}
                        <div>
                          <div className="recent-order-name">{p.name}</div>
                          <div className="recent-order-meta">{p.category} · Stock: {p.stock_quantity}</div>
                        </div>
                      </div>
                      <div className="recent-order-right">
                        <div className="recent-order-total">GH₵{Number(p.price).toLocaleString()}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <StatusBadge status={p.status}>{p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}</StatusBadge>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} icon={<Pencil size={14} />} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {view === 'products' && (
          <div className="products-list-content">
            <div className="view-header-row">
              <div>
                <h3 className="section-title">My Products</h3>
                <p className="section-subtitle">Products in your store. Add new ones or contact the admin to manage visibility.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setView('add')}>+ Add Product</Button>
            </div>
            <DataTable<Product>
              data={products}
              loading={false}
              emptyTitle="No products yet"
              emptyMessage="Add your first product to start selling."
              stickyHeader
              caption={`${products.length} product${products.length !== 1 ? 's' : ''} in your store`}
              rowKey={p => p.id}
              columns={[
                {
                  key: 'product', header: 'Product', minWidth: '220px',
                  cell: p => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.image_url && <img src={p.image_url} alt={p.name} className="product-thumb" />}
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  ),
                },
                { key: 'category', header: 'Category', minWidth: '140px', cell: p => p.category },
                { key: 'price', header: 'Price', width: '110px', align: 'right', cell: p => <span className="dt-amount">{formatCurrency(p.price)}</span> },
                { key: 'stock', header: 'Stock', width: '90px', align: 'center', cell: p => p.stock_quantity },
                {
                  key: 'status', header: 'Status', width: '120px', align: 'center',
                  cell: p => <StatusBadge status={p.status}>{p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}</StatusBadge>,
                },
                {
                  key: 'actions', header: 'Actions', width: '110px', sticky: 'right', align: 'right',
                  cell: p => (
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => handleEdit(p)}>Edit</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteTarget(p)} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
        {(view === 'add' || view === 'edit') && (
          <div className="products-list-content">
            <AdminProductForm
              mode={view}
              editProduct={editProduct}
              formData={formData}
              formErrors={formErrors}
              isSubmitting={isSubmitting}
              categories={[...new Set(products.map(p => p.category))]}
              onSubmit={handleSubmit}
              onFormChange={setFormData}
              onCancel={() => { setView('products'); setEditProduct(null); setFormData(defaultFormState) }}
            />
          </div>
        )}
        {view === 'visibility' && <AdminVisibility products={products} onToggle={reload} />}
        {view === 'orders' && <SellerOrders orders={orders} />}
        {view === 'payouts' && <SellerPayouts payouts={payouts} />}
        {view === 'storeSettings' && <SellerStoreSettings store={store} onSaved={reload} />}
      </Suspense>
    </AdminShell>
  )
}

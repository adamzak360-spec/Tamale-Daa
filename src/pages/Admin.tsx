import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadProductVideo,
  getDashboardStats,
  getProductVariants,
  syncProductVariants,
} from '../services/productService'
import {
  getAllOrders,
  updateOrderStatus,
} from '../services/orderService'
import {
  getAllReviews,
  updateReviewStatus,
  deleteReview,
} from '../services/reviewService'
import {
  exportOrdersCSV,
  exportProductsCSV,
  exportCustomersCSV,
} from '../services/adminAnalyticsService'
import { testEmailSending } from '../api/emailNotificationHandler'
import type { Product, DashboardStats, Order, Review, ProductVariant } from '../types'
import { formatCurrency } from '../utils/currency'
import { lazy, Suspense } from 'react'
import AdminShell, { SidebarSection } from '../components/AdminShell'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminOrders, { OrderDetailsModal } from './admin/AdminOrders'
import AdminReviews from './admin/AdminReviews'
import AdminProductForm, { defaultFormState, ProductFormState, ProductFormErrors } from './admin/AdminProductForm'
import './Admin.css'

// Lazy load admin sub-components for better performance
const InventoryManagement = lazy(() => import('../components/InventoryManagement'))
const AdminAnalytics = lazy(() => import('../components/AdminAnalytics'))
const FinancialReports = lazy(() => import('../components/FinancialReports'))
const SupplierManagement = lazy(() => import('../components/SupplierManagement'))
const POS = lazy(() => import('./POS'))


type AdminView = 'dashboard' | 'products' | 'add' | 'edit' | 'orders' | 'inventory' | 'analytics' | 'reports' | 'suppliers' | 'reviews' | 'pos'

export default function Admin() {
  const { user } = useAuth()
  const [view, setView] = useState<AdminView>('dashboard')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<DashboardStats>({ total: 0, active: 0, outOfStock: 0 })
  const [searchTerm, setSearchTerm] = useState('') // used by extracted AdminProducts
  const [orderSearchTerm, setOrderSearchTerm] = useState('') // used by extracted AdminOrders
  const [reviewSearchTerm, setReviewSearchTerm] = useState('') // used by extracted AdminReviews
  const [orderFilterStatus, setOrderFilterStatus] = useState('') // used by extracted AdminOrders
  const [orderFilterSource, setOrderFilterSource] = useState('') // used by extracted AdminOrders
  const [reviewFilterProduct, setReviewFilterProduct] = useState('') // used by extracted AdminReviews
  const [filterCategory, setFilterCategory] = useState('') // used by extracted AdminProducts
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ProductFormState>(defaultFormState)
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [ordersError, setOrdersError] = useState('')
  const [reviewsError, setReviewsError] = useState('')

  console.log('Loading states:', { productsLoading, ordersLoading, reviewsLoading })
  console.log('Error states:', { ordersError, reviewsError })

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    // Load products and stats independently
    setProductsLoading(true)
    setProductsError('')
    try {
      const [allProducts, statsData] = await Promise.all([
        getAllProducts(),
        getDashboardStats()
      ])
      setProducts(allProducts)
      setStats(statsData)
      setProductsError('')
    } catch (err) {
      console.error('Error loading products/stats:', err)
      setProductsError('Failed to load products')
      setProducts([])
      setStats({ total: 0, active: 0, outOfStock: 0 })
    } finally {
      setProductsLoading(false)
    }

    // Load orders independently
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
      setOrdersError('')
    } catch (err) {
      console.error('Error loading orders:', err)
      setOrdersError('Failed to load orders')
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }

    // Load reviews independently
    setReviewsLoading(true)
    setReviewsError('')
    try {
      const reviewsData = await getAllReviews()
      setReviews(reviewsData)
      setReviewsError('')
    } catch (err) {
      console.error('Error loading reviews:', err)
      setReviewsError('Failed to load reviews')
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    if (!validateForm()) return

    setIsSubmitting(true)
    setError('')

    try {
      let imageUrl = formData.existingImageUrl
      if (formData.image) {
        imageUrl = await uploadProductImage(formData.image)
      }

      // Upload gallery images
      const newGalleryUrls = await Promise.all(
        formData.galleryImages.map(file => uploadProductImage(file))
      )

      const gallery_urls = [...formData.existingGalleryUrls, ...newGalleryUrls]

      // Upload product videos
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
        gallery_urls: gallery_urls,
        video_urls: video_urls,
        has_sizes: formData.has_sizes,
        // Delivery Fees (must match database column names)
        // Tamale, STC (greater_accra), VIP (lesser_accra), OA (dhl), VVIP (ups), FedEx
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
        showNotification('Product updated successfully!')
      } else {
        savedProduct = await createProduct(productData)
        if (formData.has_sizes) {
          await syncProductVariants(savedProduct.id, formData.variants)
        }
        showNotification('Product added successfully!')
      }

      setFormData(defaultFormState)
      setView('products')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await deleteProduct(id)
      showNotification(`"${name}" has been deleted.`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
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
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      status: product.status,
      image: null,
      existingImageUrl: product.image_url,
      galleryImages: [],
      existingGalleryUrls: product.gallery_urls || [],
      videos: [],
      existingVideoUrls: product.video_urls || [],
      videoUploadErrors: {},
      has_sizes: product.has_sizes || false,
      variants: variants,
      delivery_fee_tamale: (product.delivery_fee_tamale || 0).toString(),
      delivery_fee_greater_accra: (product.delivery_fee_greater_accra || 0).toString(),
      delivery_fee_lesser_accra: (product.delivery_fee_lesser_accra || 0).toString(),
      delivery_fee_dhl: (product.delivery_fee_dhl || 0).toString(),
      delivery_fee_ups: (product.delivery_fee_ups || 0).toString(),
      delivery_fee_fedex: (product.delivery_fee_fedex || 0).toString(),
      specifications: typeof product.specifications === 'string'
        ? (() => { try { return JSON.parse(product.specifications); } catch { return {}; } })()
        : (product.specifications || {}),
      newSpecKey: '',
      newSpecValue: '',
    })
    setView('edit')
  }

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        setError('Order not found')
        return
      }
      await updateOrderStatus(orderId, newStatus)
      showNotification('Order status updated successfully!')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleReviewStatusUpdate = async (reviewId: string, status: 'approved' | 'hidden') => {
    try {
      await updateReviewStatus(reviewId, status)
      showNotification(`Review ${status} successfully!`)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review status')
    }
  }

  const handleReviewDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    try {
      await deleteReview(reviewId)
      showNotification('Review deleted successfully!')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    }
  }

  const handleTestEmail = async () => {
    if (!user?.email) return
    setIsTestingEmail(true)
    try {
      const result = await testEmailSending(user.email)
      if (result.success) {
        showNotification(result.message, 'success')
      } else {
        setError(result.error || result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send test email')
    } finally {
      setIsTestingEmail(false)
    }
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

  const handleExportOrders = async () => {
    try {
      const csv = exportOrdersCSV(orders)
      downloadCSV(csv, `orders-${new Date().toISOString().split('T')[0]}.csv`)
      showNotification('Orders exported successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export orders')
    }
  }

  const handleExportProducts = async () => {
    try {
      const csv = await exportProductsCSV(products)
      downloadCSV(csv, `products-${new Date().toISOString().split('T')[0]}.csv`)
      showNotification('Products exported successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export products')
    }
  }

  const handleExportCustomers = async () => {
    try {
      const csv = await exportCustomersCSV()
      downloadCSV(csv, `customers-${new Date().toISOString().split('T')[0]}.csv`)
      showNotification('Customers exported successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export customers')
    }
  }

  // Export handlers passed to extracted sub-components
  const exportHandlers = { handleExportOrders, handleExportProducts, handleExportCustomers }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const switchView = (key: string) => {
    setView(key as AdminView)
    if (key === 'add') {
      setFormData(defaultFormState)
      setFormErrors({})
      setEditProduct(null)
    }
    if (key !== 'edit') setEditProduct(null)
  }

  const sections: SidebarSection[] = [
    {
      title: 'Overview',
      items: [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'orders', label: 'Orders', badge: orders.length },
        { key: 'pos', label: 'POS' },
      ],
    },
    {
      title: 'Catalog',
      items: [
        { key: 'products', label: 'Products', badge: products.length },
        { key: 'add', label: '+ Add Product' },
        { key: 'inventory', label: 'Inventory' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { key: 'reviews', label: 'Reviews', badge: reviews.length },
        { key: 'analytics', label: 'Analytics' },
        { key: 'reports', label: 'Reports' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { key: 'suppliers', label: 'Suppliers' },
      ],
    },
  ]

  if (isLoading && products.length === 0) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const body = (
    <>
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}
      {(error || productsError) && (
        <div className="error-banner">
          <span>{error || productsError}</span>
          <button onClick={() => { setError(''); setProductsError(''); }}>&times;</button>
        </div>
      )}

      <div className="admin-header animate-fade-in">
        <div className="header-title-group">
          <h2>Admin Dashboard</h2>
          <p className="admin-subtitle">Manage your marketplace operations</p>
        </div>
        <div className="admin-user-info">
          <div className="user-badge">
            <span className="user-email">{user?.email}</span>
            <span className="badge badge-primary">Admin</span>
          </div>
          <button
            onClick={handleTestEmail}
            className="btn-secondary btn-sm"
            disabled={isTestingEmail}
          >
            {isTestingEmail ? 'Testing...' : 'Test Email'}
          </button>
        </div>
      </div>

      <Suspense fallback={<div className="admin-loading">Loading view...</div>}>
        {view === 'dashboard' && (
          <AdminDashboard stats={stats} products={products} loading={productsLoading} onAddProduct={() => switchView('add')} />
        )}
        {view === 'products' && (
          <AdminProducts
            products={products}
            loading={productsLoading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterCategory={filterCategory}
            onFilterCategoryChange={setFilterCategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddProduct={() => switchView('add')}
            onExport={exportHandlers.handleExportProducts}
          />
        )}
        {view === 'orders' && (
          <AdminOrders
            orders={orders}
            loading={ordersLoading}
            searchTerm={orderSearchTerm}
            onSearchChange={setOrderSearchTerm}
            filterStatus={orderFilterStatus}
            onFilterStatusChange={setOrderFilterStatus}
            filterSource={orderFilterSource}
            onFilterSourceChange={setOrderFilterSource}
            onStatusChange={handleStatusChange}
            onViewOrder={handleViewOrder}
            onExportOrders={exportHandlers.handleExportOrders}
            onExportCustomers={exportHandlers.handleExportCustomers}
          />
        )}
        {view === 'reviews' && (
          <AdminReviews
            reviews={reviews}
            products={products}
            loading={reviewsLoading}
            searchTerm={reviewSearchTerm}
            onSearchChange={setReviewSearchTerm}
            filterProduct={reviewFilterProduct}
            onFilterProductChange={setReviewFilterProduct}
            onStatusUpdate={handleReviewStatusUpdate}
            onDelete={handleReviewDelete}
          />
        )}
        {(view === 'add' || view === 'edit') && (
          <AdminProductForm
            mode={view}
            editProduct={editProduct}
            formData={formData}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
            categories={[...new Set(products.map(p => p.category))]}
            onSubmit={handleSubmit}
            onFormChange={setFormData}
            onCancel={() => { setView('products'); setEditProduct(null) }}
          />
        )}
        {view === 'inventory' && <InventoryManagement />}
        {view === 'analytics' && <AdminAnalytics />}
        {view === 'reports' && <FinancialReports />}
        {view === 'suppliers' && <SupplierManagement />}
        {view === 'pos' && <POS />}
      </Suspense>

      {showOrderModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setShowOrderModal(false)} />
      )}
    </>
  )

  return (
    <AdminShell
      title="TAMALE DAA"
      sections={sections}
      active={view}
      onSelect={switchView}
      userLabel="Admin"
    >
      {body}
    </AdminShell>
  )
}

// Export format helpers used outside (kept for compatibility)
export { formatCurrency }

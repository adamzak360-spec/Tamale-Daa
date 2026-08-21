import { useMemo, useState } from 'react'
import type { Product, Review } from '../../types'
import { Button, Select, PageHeader, SkeletonTable, EmptyState } from '../../components/ui'
import { Search, Check, EyeOff, Trash2 } from 'lucide-react'

interface AdminReviewsProps {
  reviews: Review[]
  products: Product[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  filterProduct: string
  onFilterProductChange: (v: string) => void
  onStatusUpdate: (reviewId: string, status: 'approved' | 'hidden') => void
  onDelete: (reviewId: string) => void
}

export default function AdminReviews({ reviews, products, loading, searchTerm: eSearch, onSearchChange: eSetSearch, filterProduct: eFiltProduct, onFilterProductChange: eSetFiltProduct, onStatusUpdate, onDelete }: AdminReviewsProps) {
  const [iSearch, setISearch] = useState('')
  const searchTerm = eSearch !== undefined ? eSearch : iSearch
  const setSearchTerm = eSetSearch || setISearch
  const [iFiltProduct, setIFiltProduct] = useState('')
  const filterProduct = eFiltProduct !== undefined ? eFiltProduct : iFiltProduct
  const setFilterProduct = eSetFiltProduct || setIFiltProduct
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return reviews.filter(review => {
      const product = products.find(p => p.id === review.product_id)
      const productName = product ? product.name.toLowerCase() : ''
      const matchesSearch =
        review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productName.includes(searchTerm.toLowerCase())
      const matchesProduct = !filterProduct || review.product_id === filterProduct
      return matchesSearch && matchesProduct
    })
  }, [reviews, products, searchTerm, filterProduct])

  return (
    <div className="page-content">
      <PageHeader title="Reviews" subtitle={`${filtered.length} of ${reviews.length} reviews`} />
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search reviews by customer, message or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <Select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)} aria-label="Filter product">
          <option value="">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </Select>
      </div>

      {loading && reviews.length === 0 ? (
        <SkeletonTable rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={reviews.length === 0 ? 'No reviews yet' : 'No reviews match your search'}
          message={reviews.length === 0 ? 'Reviews will appear here once customers submit them.' : 'Try adjusting your search or filters.'}
        />
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(review => {
                const product = products.find(p => p.id === review.product_id)
                return (
                  <tr key={review.id}>
                    <td>{product ? product.name : 'Unknown Product'}</td>
                    <td>{review.customer_name}</td>
                    <td>
                      <div style={{ color: '#fbbf24' }}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '300px' }}>
                        {review.title && <div style={{ fontWeight: 600 }}>{review.title}</div>}
                        <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{review.message}</div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${review.status}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      {review.status !== 'approved' && (
                        <Button variant="ghost" size="sm" icon={<Check size={14} />} onClick={() => onStatusUpdate(review.id, 'approved')}>Approve</Button>
                      )}
                      {review.status !== 'hidden' && (
                        <Button variant="ghost" size="sm" icon={<EyeOff size={14} />} onClick={() => onStatusUpdate(review.id, 'hidden')}>Hide</Button>
                      )}
                      <button onClick={() => setDeleteId(review.id)} className="btn-delete" title="Delete review"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="modal-overlay"
        style={{ display: deleteId ? 'flex' : 'none' }}
        onClick={() => setDeleteId(null)}
      >
        <div className="modal-panel" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Delete Review</h3>
            <button className="btn-icon" onClick={() => setDeleteId(null)} aria-label="Close">✕</button>
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>Permanently delete this review? This cannot be undone.</p>
          <div className="modal-actions">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null) }}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

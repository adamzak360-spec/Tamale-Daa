import { useMemo, useState } from 'react'
import type { Product, Review } from '../../types'

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
    <div className="reviews-list-content">
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search reviews by customer, message or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="filter-select"
        >
          <option value="">All Products</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="empty-state"><h3>Loading reviews...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{reviews.length === 0 ? 'No reviews yet' : 'No reviews match your search'}</h3>
          <p>{reviews.length === 0 ? 'Reviews will appear here once customers submit them.' : 'Try adjusting your search or filters.'}</p>
        </div>
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
                        <button
                          onClick={() => onStatusUpdate(review.id, 'approved')}
                          className="btn-edit"
                          style={{ backgroundColor: '#16a34a' }}
                        >
                          Approve
                        </button>
                      )}
                      {review.status !== 'hidden' && (
                        <button
                          onClick={() => onStatusUpdate(review.id, 'hidden')}
                          className="btn-edit"
                          style={{ backgroundColor: '#6b7280' }}
                        >
                          Hide
                        </button>
                      )}
                      <button onClick={() => onDelete(review.id)} className="btn-delete">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

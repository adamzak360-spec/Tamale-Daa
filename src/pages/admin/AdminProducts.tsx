import { useMemo, useState } from 'react'
import type { Product } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { Button, Select, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal } from '../../components/ui'
import { Search, Pencil, Trash2 } from 'lucide-react'

interface AdminProductsProps {
  products: Product[]
  loading: boolean
  searchTerm: string
  onSearchChange: (v: string) => void
  filterCategory: string
  onFilterCategoryChange: (v: string) => void
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
  onAddProduct: () => void
  onExport?: () => void
}

export default function AdminProducts({ products, loading, searchTerm: externalSearch, onSearchChange: externalSetSearch, filterCategory: externalFilter, onFilterCategoryChange: externalSetFilter, onEdit, onDelete, onAddProduct, onExport }: AdminProductsProps) {
  const [internalSearch, setInternalSearch] = useState('')
  const searchTerm = externalSearch !== undefined ? externalSearch : internalSearch
  const setSearchTerm = externalSetSearch || setInternalSearch
  const [internalFilter, setInternalFilter] = useState('')
  const filterCategory = externalFilter !== undefined ? externalFilter : internalFilter
  const setFilterCategory = externalSetFilter || setInternalFilter
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null)

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !filterCategory || p.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, filterCategory])

  return (
    <div className="page-content">
      <PageHeader title="Products" subtitle={`${filtered.length} of ${products.length} products`} actions={
        <>
          {onExport && <Button variant="outline" size="sm" onClick={onExport}>Export CSV</Button>}
          <Button variant="primary" size="sm" onClick={onAddProduct} icon={<Search size={15} />}>+ Add Product</Button>
        </>
      } />
      <div className="search-filter-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} aria-label="Filter category">
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Select>
      </div>

      {loading && products.length === 0 ? (
        <SkeletonTable rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={products.length === 0 ? 'No products yet' : 'No products match your search'}
          message={products.length === 0 ? 'Start by adding your first product to the marketplace.' : 'Try adjusting your search or filters.'}
        />
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id}>
                  <td data-label="Image" className="product-image-cell">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="product-thumb" />
                    ) : (
                      <div className="product-thumb-placeholder">No image</div>
                    )}
                  </td>
                  <td data-label="Name"><span style={{ fontWeight: 600 }}>{product.name}</span></td>
                  <td data-label="Category">{product.category}</td>
                  <td data-label="Price">{formatCurrency(product.price)}</td>
                  <td data-label="Stock">{product.stock_quantity}</td>
                  <td data-label="Status">
                    <StatusBadge status={product.status}>
                      {product.status === 'active' ? 'Active' : product.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <button onClick={() => onEdit(product)} className="btn-edit" title="Edit product"><Pencil size={14} /></button>
                    <button onClick={() => setConfirmTarget({ id: product.id, name: product.name })} className="btn-delete" title="Delete product"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        title="Delete Product"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={() => { if (confirmTarget) onDelete(confirmTarget.id, confirmTarget.name); setConfirmTarget(null) }}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Are you sure you want to delete <strong>"{confirmTarget?.name}"</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

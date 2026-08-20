import { useMemo, useState } from 'react'
import type { Product } from '../../types'
import { formatCurrency } from '../../utils/currency'

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
    <div className="products-list-content">
      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {onExport && (
          <button onClick={onExport} className="btn-export" title="Export products as CSV">Export Products</button>
        )}
        <button onClick={onAddProduct} className="btn-primary">
          + Add Product
        </button>
      </div>

      {loading && products.length === 0 ? (
        <div className="empty-state"><h3>Loading products...</h3></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{products.length === 0 ? 'No products yet' : 'No products match your search'}</h3>
          <p>{products.length === 0 ? 'Start by adding your first product.' : 'Try adjusting your search or filters.'}</p>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
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
                    <span className={`status-badge ${product.status}`}>
                      {product.status === 'active' ? 'Active' : product.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => onEdit(product)} className="btn-edit" title="Edit product">Edit</button>
                    <button onClick={() => onDelete(product.id, product.name)} className="btn-delete" title="Delete product">Delete</button>
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

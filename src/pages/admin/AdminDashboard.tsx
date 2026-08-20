import type { Product, DashboardStats } from '../../types'
import { formatCurrency } from '../../utils/currency'

interface AdminDashboardProps {
  stats: DashboardStats
  products: Product[]
  loading: boolean
  onAddProduct: () => void
}

export default function AdminDashboard({ stats, products, loading, onAddProduct }: AdminDashboardProps) {
  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">&#128230;</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">&#9989;</div>
          <div className="stat-info">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active Products</span>
          </div>
        </div>
        <div className="stat-card stat-out-of-stock">
          <div className="stat-icon">&#9888;</div>
          <div className="stat-info">
            <span className="stat-value">{stats.outOfStock}</span>
            <span className="stat-label">Out of Stock</span>
          </div>
        </div>
      </div>

      <div className="recent-products">
        <h3>Recent Products</h3>
        {loading || products.length === 0 ? (
          <div className="empty-state">
            <h3>No products yet</h3>
            <p>Start by adding your first product.</p>
            <button onClick={onAddProduct} className="btn-primary">
              Add Product
            </button>
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
                      <span className={`status-badge ${product.status}`}>
                        {product.status === 'active' ? 'Active' : product.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                      </span>
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

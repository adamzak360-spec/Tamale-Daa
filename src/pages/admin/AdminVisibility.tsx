import { useMemo, useState } from 'react'
import type { Product } from '../../types'
import { updateProduct } from '../../services/productService'
import { formatCurrency } from '../../utils/currency'

interface Props {
  products: Product[]
  onToggle?: (product: Product, newStatus: Product['status']) => void
}

export default function AdminVisibility({ products, onToggle }: Props) {
  const [notice, setNotice] = useState('')

  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products])

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const toggle = async (product: Product) => {
    const newStatus: Product['status'] = product.status === 'active' ? 'inactive' : 'active'
    const ok = await updateProduct(product.id, { status: newStatus })
    if (ok) {
      if (onToggle) onToggle(product, newStatus)
      showNotice(`${product.name} ${newStatus === 'active' ? 'made visible' : 'hidden'} on the site.`)
    } else showNotice('Could not update visibility.')
  }

  return (
    <div className="visibility-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}
      <div className="view-header-row">
        <div>
          <h3 className="section-title">Product Visibility</h3>
          <p className="section-subtitle">Quickly show or hide products on the store without deleting them.</p>
        </div>
      </div>

      <div className="products-table">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Visibility</th></tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.image_url && <img src={p.image_url} alt={p.name} className="product-thumb" />}
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                </td>
                <td>{p.category}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>
                  <span className={`status-badge ${p.status}`}>
                    {p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toggle(p)}
                    className="btn-edit"
                    style={{ backgroundColor: p.status === 'active' ? '#dc2626' : '#16a34a' }}
                  >
                    {p.status === 'active' ? 'Hide' : 'Show'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

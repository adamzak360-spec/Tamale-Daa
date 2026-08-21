import { useMemo } from 'react'
import type { Product } from '../../types'
import { updateProduct } from '../../services/productService'
import { formatCurrency } from '../../utils/currency'
import { Button, StatusBadge, PageHeader, EmptyState } from '../../components/ui'
import { toast } from '../../components/ui'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  products: Product[]
  onToggle?: (product: Product, newStatus: Product['status']) => void
}

export default function AdminVisibility({ products, onToggle }: Props) {
  const sorted = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name)), [products])

  const toggle = async (product: Product) => {
    const newStatus: Product['status'] = product.status === 'active' ? 'inactive' : 'active'
    const ok = await updateProduct(product.id, { status: newStatus })
    if (ok) {
      if (onToggle) onToggle(product, newStatus)
      toast(`${product.name} ${newStatus === 'active' ? 'made visible' : 'hidden'} on the site.`, 'success')
    } else toast('Could not update visibility.', 'error')
  }

  return (
    <div className="page-content">
      <PageHeader title="Product Visibility"
        subtitle={`Quickly show or hide products on the store without deleting them. ${products.length} products.`}
      />
      {products.length === 0 && <EmptyState title="No products" message="Add products to manage their visibility." />}

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
                  <StatusBadge status={p.status}>
                    {p.status === 'active' ? 'Active' : p.status === 'out-of-stock' ? 'Out of Stock' : 'Inactive'}
                  </StatusBadge>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={p.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    onClick={() => toggle(p)}
                  >
                    {p.status === 'active' ? 'Hide' : 'Show'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

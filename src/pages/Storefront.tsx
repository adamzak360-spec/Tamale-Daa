import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSellers, getSellerProductIds } from '../services/marketplaceService'
import type { Seller } from '../services/marketplaceService'
import { getAllProducts } from '../services/productService'
import type { Product } from '../types'
import { formatCurrency } from '../utils/currency'

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>()
  const [store, setStore] = useState<Seller | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const all = await getSellers()
      const found = all.find(s => s.slug === slug && s.status === 'approved') || null
      setStore(found)
      if (found) {
        const ids = await getSellerProductIds(found.id)
        const allProducts = await getAllProducts()
        setProducts(allProducts.filter(p => ids.includes(p.id) && p.status === 'active'))
      }
      setLoading(false)
    })()
  }, [slug])

  if (loading) return <div className="loading-container" style={{ padding: 80 }}><div className="spinner" /></div>
  if (!store) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Store not found</h2>
        <p style={{ color: '#6b7280' }}>This store doesn't exist or isn't approved yet.</p>
        <Link to="/stores" style={{ color: '#2563eb' }}>Back to Stores Directory</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 60px' }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginBottom: 24, background: '#fff' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.business_name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'linear-gradient(135deg,#1e3a8a,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.6rem', flexShrink: 0 }}>
              {store.business_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>{store.business_name}</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>
              {store.category || 'General store'}{store.location ? ` · ${store.location}` : ''}
            </p>
            {store.description && <p style={{ marginTop: 8, fontSize: '0.9rem', color: '#4b5563', lineHeight: 1.5 }}>{store.description}</p>}
            {store.owner_phone && <p style={{ marginTop: 4, fontSize: '0.85rem', color: '#6b7280' }}>Contact: {store.owner_phone}</p>}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Products from this store</h3>
      {products.length === 0 ? (
        <div className="empty-state">
          <h3>No products yet</h3>
          <p>This store hasn't listed products yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.map(p => (
            <Link key={p.id} to={`/product/${p.id}`} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', textDecoration: 'none', color: 'inherit' }}>
              {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />}
              <div style={{ padding: 10 }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: 4 }}>{p.name}</h4>
                <div style={{ fontWeight: 700, color: '#0d9488' }}>{formatCurrency(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWishlistProductIds, removeFromWishlist } from '../services/wishlistService'
import { getProductById } from '../services/productService'
import type { Product } from '../types'
import { formatCurrency } from '../utils/currency'
import { Heart, MessageCircle, ShoppingBag, Trash2 } from 'lucide-react'
import { Button, EmptyState, PageHeader, SkeletonCard, toast } from '../components/ui'
import './CustomerWishlist.css'

export default function CustomerWishlist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<(Product & { wishedAt: string })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadWishlist = async () => {
      try {
        setIsLoading(true)
        const ids = await getWishlistProductIds(user.id)
        const loaded = await Promise.all(
          ids.map(async (pid) => {
            try {
              const p = await getProductById(pid)
              if (p) return { ...p, wishedAt: '' }
            } catch { /* skip missing products */ }
            return null
          })
        )
        setProducts(loaded.filter((p): p is Product & { wishedAt: string } => p !== null))
      } finally {
        setIsLoading(false)
      }
    }

    loadWishlist()
  }, [user, navigate])

  const handleRemove = async (productId: string) => {
    if (!user) return
    const ok = await removeFromWishlist(user.id, productId)
    if (ok) {
      setProducts(prev => prev.filter(p => p.id !== productId))
      // Instantly update the header badge number
      window.dispatchEvent(new CustomEvent('wishlist-changed', { detail: { added: false } }))
      toast('Removed from wishlist.', 'success')
    } else {
      toast('Could not remove item from wishlist.', 'error')
    }
  }

  return (
    <div className="wishlist-page container">
      <div className="wishlist-header">
        <PageHeader
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Heart size={24} className="text-teal" /> My Wishlist</span>}
          subtitle={`${products.length} ${products.length === 1 ? 'item saved' : 'items saved'} — ready when you are.`}
        />
      </div>

      {isLoading ? (
        <div className="wishlist-grid">
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Tap the Save button on any product to keep it here for later."
          action={{ label: 'Browse Products', onClick: () => navigate('/products') }}
        />
      ) : (
        <div className="wishlist-grid">
          {products.map(p => (
            <div className="wishlist-card" key={p.id}>
              <div className="wishlist-card-image" onClick={() => navigate(`/product/${p.id}`)}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} loading="lazy" />
                ) : (
                  <div className="wishlist-placeholder"><ShoppingBag size={28} /></div>
                )}
              </div>
              <div className="wishlist-card-info">
                <h3 onClick={() => navigate(`/product/${p.id}`)}>{p.name}</h3>
                <p className="wishlist-price">{formatCurrency(p.price)}</p>
                <div className="wishlist-card-actions">
                  <Button className="wl-chat-btn" variant="secondary" size="sm" icon={<MessageCircle size={14} />} onClick={() => navigate(`/chat?productId=${p.id}`)}>Chat with Seller</Button>
                  <Button className="wl-remove-btn" variant="danger-solid" size="sm" icon={<Trash2 size={14} />} onClick={() => handleRemove(p.id)}>Remove</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

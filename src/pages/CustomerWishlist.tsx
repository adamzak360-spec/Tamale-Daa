import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWishlistProductIds, removeFromWishlist } from '../services/wishlistService'
import { getProductById } from '../services/productService'
import type { Product } from '../types'
import { formatCurrency } from '../utils/currency'
import { Heart, MessageCircle, ShoppingBag, Trash2 } from 'lucide-react'
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
    if (ok) setProducts(prev => prev.filter(p => p.id !== productId))
  }

  return (
    <div className="wishlist-page container">
      <div className="wishlist-header">
        <h1 className="wishlist-title"><Heart size={26} /> My Wishlist</h1>
        <p className="wishlist-subtitle">
          {products.length} {products.length === 1 ? 'item saved' : 'items saved'} — ready when you are.
        </p>
      </div>

      {isLoading ? (
        <div className="wishlist-loading">Loading your saved items...</div>
      ) : products.length === 0 ? (
        <div className="wishlist-empty">
          <Heart size={40} className="empty-icon" />
          <h2>Your wishlist is empty</h2>
          <p>Tap the <strong>Save</strong> button on any product to keep it here for later.</p>
          <button className="wishlist-browse-btn" onClick={() => navigate('/products')}>
            <ShoppingBag size={18} /> Browse Products
          </button>
        </div>
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
                  <button className="wl-chat-btn" onClick={() => navigate(`/chat?productId=${p.id}`)}>
                    <MessageCircle size={16} /> Chat with Seller
                  </button>
                  <button className="wl-remove-btn" onClick={() => handleRemove(p.id)} title="Remove from wishlist">
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

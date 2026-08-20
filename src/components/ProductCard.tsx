import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/currency'
import { addToWishlist, removeFromWishlist } from '../services/wishlistService'
import StockStatus from './StockStatus'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
  showStock?: boolean
  wishlistIds?: string[] // pass down to avoid per-card fetches
  onWishlistChange?: (productId: string, added: boolean) => void
}

export default function ProductCard({ product, showStock = true, wishlistIds, onWishlistChange }: ProductCardProps) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isInWishlist = wishlistIds?.includes(product.id) ?? false
  const [saving, setSaving] = useState(false)

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (saving || !user) return
    setSaving(true)
    try {
      const ok = isInWishlist
        ? await removeFromWishlist(user.id, product.id)
        : await addToWishlist(user.id, product.id)
      if (ok) onWishlistChange?.(product.id, !isInWishlist)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        <div className="product-image-container">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="product-image" 
              loading="lazy"
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.parentElement?.querySelector('.product-image-placeholder')
                if (placeholder) {
                  placeholder.classList.add('visible')
                }
              }}
            />
          ) : null}
          {user && (
            <button
              className={`card-wishlist-btn ${isInWishlist ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              disabled={saving}
              title={isInWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
              aria-label={isInWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
            >
              <Heart size={18} fill={isInWishlist ? 'currentColor' : 'none'} />
            </button>
          )}
          <div className={`product-image-placeholder ${!product.image_url ? 'visible' : ''}`}>
            <span>No image</span>
          </div>
        </div>
      </Link>
      
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        
        <Link to={`/product/${product.id}`} className="product-name-link">
          <h4 className="product-name">{product.name}</h4>
        </Link>
        
        <p className="product-description">
          {product.description}
        </p>
        
        <div className="product-price-stock">
          <span className="product-price">{formatCurrency(product.price)}</span>
          {showStock && (
            <div className="stock-badge-wrapper">
              <StockStatus stock={product.stock_quantity} size="medium" />
            </div>
          )}
        </div>
        
        <div className="product-actions">
          <Link to={`/product/${product.id}`} className="view-details-btn">
            View Details
          </Link>
          <button 
            className="add-to-cart-btn"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            disabled={product.stock_quantity === 0 || product.status === 'inactive'}
          >
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

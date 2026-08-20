import { useState, useEffect, useRef } from 'react'
import { getAllProducts } from '../services/productService'
import type { Product } from '../types'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import CallToOrderBanner from '../components/CallToOrderBanner'
import { Search, X, ArrowRight, Package } from 'lucide-react'
import './Home.css'

const CATEGORY_ICONS: Record<string, string> = {
  'New Cars Collection': '🚗',
  'Motorcycle': '🏍️',
  'Fruits': '🍎',
  'Fruit': '🍌',
  'Sponge': '🧽',
  'Flask': '🧪',
  'Software Developer/Engineer': '💻',
  'Groceries': '🌾',
  'Electronics': '💻',
  'Fashion': '👗',
  'Home & Garden': '🏡',
  'Sports': '⚽',
  'Health & Beauty': '💄',
}

function getCategoryIcon(name: string): string {
  if (CATEGORY_ICONS[name]) return CATEGORY_ICONS[name]
  const lower = name.toLowerCase()
  if (lower.includes('fruit') || lower.includes('food')) return '🍎'
  if (lower.includes('car') || lower.includes('vehicle') || lower.includes('bike') || lower.includes('motor')) return '🚗'
  if (lower.includes('electronics') || lower.includes('tech') || lower.includes('soft')) return '💻'
  if (lower.includes('fashion') || lower.includes('cloth')) return '👗'
  if (lower.includes('home') || lower.includes('garden')) return '🏡'
  if (lower.includes('sport')) return '⚽'
  if (lower.includes('health') || lower.includes('beauty')) return '💄'
  return '🌟'
}

// Matches the search logic on the Products page (name/description/category, plus brand)
function matchesSearch(product: Product, term: string): boolean {
  const lower = term.toLowerCase()
  return (
    product.name.toLowerCase().includes(lower) ||
    product.description.toLowerCase().includes(lower) ||
    product.category.toLowerCase().includes(lower) ||
    (product.brand ?? '').toLowerCase().includes(lower)
  )
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllProducts()
        setAllProducts(data)
      } catch (err) {
        console.error('Failed to load products:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeProducts = allProducts.filter(p => p.status === 'active')

  const clearSearch = () => {
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const goToSearchResults = () => {
    const term = searchTerm.trim()
    if (!term) return
    setShowSuggestions(false)
    // Reuse recent searches storage, same as the Products page
    if (!recentSearches.includes(term)) {
      const updated = [term, ...recentSearches.slice(0, 4)]
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }
    navigate(`/products?search=${encodeURIComponent(term)}`)
  }

  const handleSuggestion = (value: string) => {
    setSearchTerm(value)
    setShowSuggestions(false)
    navigate(`/products?search=${encodeURIComponent(value)}`)
  }

  // Search suggestions while typing on the homepage
  const suggestions = (() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []
    const results: { value: string; label: string; icon: string }[] = []
    const seen = new Set<string>()
    activeProducts
      .filter(p => matchesSearch(p, term))
      .slice(0, 4)
      .forEach(p => {
        if (!seen.has(p.name)) {
          seen.add(p.name)
          results.push({ value: p.name, label: p.name, icon: '📦' })
        }
      })
    // Matching categories
    const cats = new Set(
      activeProducts
        .filter(p => p.category.toLowerCase().includes(term))
        .map(p => p.category)
    )
    cats.forEach(cat => results.push({ value: cat, label: `Browse ${cat}`, icon: '📁' }))
    return results.slice(0, 6)
  })()

  // Real-time search results on homepage (up to 6 shown)
  const liveResults = (() => {
    const term = searchTerm.trim()
    if (!term) return []
    return activeProducts.filter(p => matchesSearch(p, term)).slice(0, 6)
  })()

  // Two presentation areas using real products
  const featuredProducts = activeProducts.slice(0, 12)
  const discoverProducts = activeProducts.length > 0
    ? [...activeProducts.slice(0, 8), ...activeProducts.slice(8, 16)]
    : []

  const categoryCounts: Record<string, number> = {}
  activeProducts.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
  })
  const dynamicCategories = Object.entries(categoryCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name,
      icon: getCategoryIcon(name),
      count,
    }))

  return (
    <div className="home-page">
      {/* --- Call To Order Banner --- */}
      <CallToOrderBanner />

      {/* --- Homepage Search Bar --- */}
      <section className="section home-search-section">
        <div className="container">
          <div className="home-search-wrapper" ref={searchRef}>
            <div className="search-container">
              <Search size={20} className="search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search products, brands, categories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goToSearchResults()
                }}
                onFocus={() => setShowSuggestions(true)}
                className="search-input"
                aria-label="Search products"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="clear-btn"
                  type="button"
                  aria-label="Clear search"
                >
                  <X size={18} />
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions" role="listbox" aria-label="Search suggestions">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className={`suggestion-item suggestion-${suggestion.icon === '📁' ? 'category' : 'product'}`}
                      onClick={() => handleSuggestion(suggestion.value)}
                      role="option"
                      type="button"
                    >
                      <span className="suggestion-icon">{suggestion.icon}</span>
                      <span className="suggestion-text">{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- Category Row --- */}
      <section className="section home-category-section">
        <div className="container">
          <div className="category-chip-row">
            <Link to="/products" className="category-chip">
              <span className="chip-icon">🛍️</span>
              <span>All Products</span>
            </Link>
            {dynamicCategories.map(category => (
              <Link
                key={category.name}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="category-chip"
              >
                <span className="chip-icon">{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- Live Search Results (when typing) --- */}
      {searchTerm.trim() && (
        <section className="section product-horizontal-section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <Search size={20} />
                <h3 className="section-title">
                  {liveResults.length > 0
                    ? `Results for "${searchTerm.trim()}"`
                    : `No products found for "${searchTerm.trim()}"`}
                </h3>
              </div>
              {liveResults.length > 0 && (
                <Link to={`/products?search=${encodeURIComponent(searchTerm.trim())}`} className="view-all-link">
                  View all <ArrowRight size={16} />
                </Link>
              )}
            </div>
            {liveResults.length === 0 ? (
              <div className="empty-state">
                <Package size={40} />
                <h4>No products match your search</h4>
                <p>Try different keywords, or browse all products instead.</p>
              </div>
            ) : (
              <div className="featured-grid">
                {liveResults.map(product => (
                  <div key={product.id} className="grid-product-wrapper">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- Section 1: Featured Products (normal responsive grid) --- */}
      {!searchTerm.trim() && (
        <section className="section product-horizontal-section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <Package size={20} />
                <h3 className="section-title">Featured Products</h3>
              </div>
              <Link to="/products" className="view-all-link">
                View All <ArrowRight size={16} />
              </Link>
            </div>

            {isLoading ? (
              <div className="featured-grid">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="product-card-skeleton grid" />
                ))}
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="empty-state">
                <Package size={40} />
                <h4>Products will appear here soon</h4>
                <p>Our marketplace is being prepared with great products. Check back shortly to start shopping.</p>
              </div>
            ) : (
              <div className="featured-grid">
                {featuredProducts.map(product => (
                  <div key={product.id} className="grid-product-wrapper">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- Section 2: Discover More (smooth moving product row) --- */}
      {!searchTerm.trim() && (
        <section className="section discover-section" aria-label="Discover more products">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <ArrowRight size={20} />
                <h3 className="section-title">Discover More</h3>
              </div>
              <Link to="/products" className="view-all-link">
                Browse All <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div
            className={`marquee-track ${discoverProducts.length < 8 ? 'few-products' : ''}`}
            aria-label="Scrolling product carousel"
          >
            <div className="marquee-content">
              {/* Two copies for a seamless continuous loop */}
              {isLoading
                ? [...Array(10)].map((_, i) => <div key={`sk-${i}`} className="marquee-skeleton" />)
                : discoverProducts.length > 0
                  ? [0, 1].map(copy => (
                      <div className="marquee-copy" key={copy} aria-hidden={copy === 1}>
                        {discoverProducts.map(product => (
                          <Link
                            key={`${product.id}-${copy}`}
                            to={`/product/${product.id}`}
                            className="marquee-card"
                            tabIndex={copy === 1 ? -1 : 0}
                          >
                            <div className="marquee-card-image">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} loading="lazy" />
                              ) : (
                                <span className="marquee-no-image">No image</span>
                              )}
                            </div>
                            <div className="marquee-card-info">
                              <span className="marquee-card-name">{product.name}</span>
                              <span className="marquee-card-price">{product.price != null ? `${product.price.toLocaleString()}` : ''}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ))
                  : null}
            </div>
          </div>
        </section>
      )}

      {/* --- Call to Order Section --- */}
      {!searchTerm.trim() && (
        <section className="section call-to-order-section">
          <div className="container">
            <div className="call-to-order-card">
              <h3>Need Help Placing an Order?</h3>
              <p>Our customer support team is ready to assist you</p>
              <a href="tel:+233538557781" className="call-to-order-link">
                📞 Call us: +233 53 855 7781
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

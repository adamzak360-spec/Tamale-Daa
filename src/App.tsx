import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { getWishlistProductIds } from './services/wishlistService'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LogoutButton } from './components/Logout'
import { useCart } from './context/CartContext'
import { CartSidebar } from './components/CartSidebar'
import { 
  Menu, 
  Search, 
  User, 
	  Heart, 
	  ShoppingCart, 
	  X,
  Home as HomeIcon,
  Package,
  Tag,
  Settings,
  HelpCircle,
  Phone,
  Info,
  Store
} from 'lucide-react'
import './App.css'
import { lazy, Suspense, useLayoutEffect } from 'react'
import Footer from './components/Footer'
import NotificationBell from './components/NotificationBell'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 })

// Lazy load pages for faster initial load
const Home = lazy(() => import('./pages/Home'))
const Admin = lazy(() => import('./pages/Admin'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Products = lazy(() => import('./pages/Products'))
const Checkout = lazy(() => import('./pages/Checkout'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Delivery = lazy(() => import('./pages/Delivery'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const Terms = lazy(() => import('./pages/Terms'))
const Returns = lazy(() => import('./pages/Returns'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'))
const CustomerOrders = lazy(() => import('./pages/CustomerOrders'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))
const CustomerSettings = lazy(() => import('./pages/CustomerSettings'))
const CustomerWishlist = lazy(() => import('./pages/CustomerWishlist'))
const Chat = lazy(() => import('./pages/Chat'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const StoresDirectory = lazy(() => import('./pages/StoresDirectory'))
const Storefront = lazy(() => import('./pages/Storefront'))
const SellerRegistration = lazy(() => import('./pages/SellerRegistration'))
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'))

// Prefetch functions for near-instant transitions
const prefetchHome = () => import('./pages/Home')
const prefetchAdmin = () => import('./pages/Admin')
const prefetchProducts = () => import('./pages/Products')
const prefetchAbout = () => import('./pages/About')
const prefetchContact = () => import('./pages/Contact')
const prefetchFAQ = () => import('./pages/FAQ')
const prefetchLogin = () => import('./pages/Login')
import TermsPopup from './components/TermsPopup'
import WhatsAppButton from './components/WhatsAppButton'

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

function AppShell() {
  const { user, isAdmin, isSeller } = useAuth()
  const { cartCount, setIsCartOpen } = useCart()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [wishlistCount, setWishlistCount] = useState(0)

  // Header wishlist badge: count of saved products (logged-in customers only)
  // Updates INSTANTLY via wishlist-changed events dispatched by every save/remove
  // (optimistic update), then re-verified from the DB for accuracy.
  useEffect(() => {
    let cancelled = false
    const loadCount = async () => {
      if (!user) return
      try {
        const ids = await getWishlistProductIds(user.id)
        if (!cancelled) setWishlistCount(ids.length)
      } catch (e) {
        console.error('wishlist badge fetch failed', e)
      }
    }
    if (user) {
      loadCount()
      // Instant sync: any card/product page save/remove fires this event
      const onWishlistChanged = (e: Event) => {
        const detail = (e as CustomEvent).detail as { added: boolean }
        if (!cancelled) {
          setWishlistCount(prev => Math.max(0, prev + (detail?.added ? 1 : -1)))
          // Re-verify from DB shortly after to correct any double-toggle races
          setTimeout(loadCount, 1500)
        }
      }
      // Refresh periodically so the badge stays in sync after saves/removes from other tabs
      const timer = setInterval(loadCount, 15000)
      window.addEventListener('wishlist-changed', onWishlistChanged)
      return () => { cancelled = true; clearInterval(timer); window.removeEventListener('wishlist-changed', onWishlistChanged) }
    } else {
      if (!cancelled) setWishlistCount(0)
    }
    return () => { cancelled = true }
  }, [user])

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller')
  const isCustomerRoute = location.pathname.startsWith('/customer')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route change and show progress bar
  useLayoutEffect(() => {
    setIsMenuOpen(false)
    NProgress.start()
    
    // Small delay to ensure the progress bar is visible during fast transitions
    const timer = setTimeout(() => {
      NProgress.done()
    }, 100)
    
    return () => {
      clearTimeout(timer)
      NProgress.done()
    }
  }, [location.pathname])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <div className={`app-container ${isMenuOpen ? 'menu-open' : ''}`}>
      {/* --- Sticky Header --- */}
      <header className={`app-header ${isScrolled ? 'scrolled' : ''}`} style={isAdminRoute ? { display: 'none' } : undefined}>
        <div className="header-container container">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="brand-logo">
              <span className="logo-text">TAMALE DAA</span>
            </Link>
          </div>

          <div className="header-center">
            <div className="search-container">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                placeholder="Search products, categories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <Link to={user ? "/customer" : "/login"} className="nav-icon-link" title="Account">
              <User size={22} />
            </Link>
            <Link to={user ? "/customer/wishlist" : "/login"} className="nav-icon-link nav-icon-link-badge" title="Wishlist">
              <Heart size={22} />
              {wishlistCount > 0 && <span className="wishlist-badge">{wishlistCount}</span>}
            </Link>
	            <NotificationBell />
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- Side Drawer Menu --- */}
      <aside className={`side-drawer ${isMenuOpen ? 'open' : ''}`} style={isAdminRoute ? { display: 'none' } : undefined}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <span>TAMALE DAA</span>
          </div>
          <button onClick={toggleMenu}><X size={24} /></button>
        </div>
        <nav className="drawer-nav">
          <Link to="/" className="drawer-item" onMouseEnter={prefetchHome}><HomeIcon size={20} /> Home</Link>
          <Link to="/products" className="drawer-item" onMouseEnter={prefetchProducts}><Package size={20} /> Categories</Link>
          <Link to="/products?filter=deals" className="drawer-item" onMouseEnter={prefetchProducts}><Tag size={20} /> Deals</Link>
          {user && (
            <>
              {isAdmin && (
                <Link to="/admin" className="drawer-item admin-item" onMouseEnter={prefetchAdmin} style={{ color: '#0066cc', fontWeight: 'bold' }}>
                  <Settings size={20} /> Admin Dashboard
                </Link>
              )}
              {isSeller && (
                <Link to="/seller" className="drawer-item" style={{ color: '#0d9488', fontWeight: 'bold' }}>
                  <Store size={20} /> Seller Dashboard
                </Link>
              )}
              <Link to="/customer/orders" className="drawer-item"><Package size={20} /> Orders</Link>
              <Link to="/customer/wishlist" className="drawer-item"><Heart size={20} /> Wishlist</Link>
              <Link to="/customer" className="drawer-item"><User size={20} /> Account</Link>
            </>
          )}
          <Link to="/stores" className="drawer-item"><Store size={20} /> Stores</Link>
          <Link to="/seller-register" className="drawer-item"><Store size={20} /> Become a Seller</Link>
          <div className="drawer-divider"></div>
          <Link to="/about" className="drawer-item" onMouseEnter={prefetchAbout}><Info size={20} /> About</Link>
          <Link to="/contact" className="drawer-item" onMouseEnter={prefetchContact}><Phone size={20} /> Contact</Link>
          <Link to="/faq" className="drawer-item" onMouseEnter={prefetchFAQ}><HelpCircle size={20} /> Support</Link>
          <Link to="/customer/settings" className="drawer-item"><Settings size={20} /> Settings</Link>
          {user ? (
            <div className="drawer-footer">
              <LogoutButton />
            </div>
          ) : (
            <Link to="/login" className="drawer-item login-item" onMouseEnter={prefetchLogin}><User size={20} /> Login / Register</Link>
          )}
        </nav>
      </aside>
      <div className={`drawer-overlay ${isMenuOpen ? 'show' : ''}`} onClick={toggleMenu}></div>

      <TermsPopup />
      <main className="app-main">
        <Suspense fallback={<div className="loading-screen">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/returns" element={<Returns />} />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer"
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/orders"
              element={
                <ProtectedRoute>
                  <CustomerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/orders/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/settings"
              element={
                <ProtectedRoute>
                  <CustomerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/wishlist"
              element={
                <ProtectedRoute>
                  <CustomerWishlist />
                </ProtectedRoute>
              }
            />
                        <Route path="/stores" element={<StoresDirectory />} />
            <Route path="/store/:slug" element={<Storefront />} />
            <Route path="/seller-register" element={<SellerRegistration />} />
            <Route
              path="/seller"
              element={
                <ProtectedRoute sellerOnly>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <CartSidebar />
      {!isAdminRoute && !isCustomerRoute && <Footer />}
      <WhatsAppButton />
    </div>
  )
}

export default App

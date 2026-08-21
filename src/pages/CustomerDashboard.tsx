import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCustomerOrders } from '../services/customerOrderService'
import { supabase } from '../supabaseClient'
import { getCustomerProfile } from '../services/customerProfileService'
import { Order, CustomerProfile } from '../types'
import { formatCurrency } from '../utils/currency'
import { KpiCard, SkeletonCard, StatusBadge, Button } from '../components/ui'
import { toast } from '../components/ui'
import { ShieldCheck, User, Package, Settings, ShoppingBag, LogOut, ArrowRight, ClipboardList, CircleCheck, XCircle, ListOrdered } from 'lucide-react'
import './CustomerDashboard.css'

export default function CustomerDashboard() {
  const { user, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load customer profile
        const profileData = await getCustomerProfile(user.id)
        setProfile(profileData)

        // Load customer orders
        const ordersData = await getCustomerOrders(user.id)
        setOrders(ordersData)
      } catch (err: any) {
        console.error('Error loading dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Subscribe to real-time order updates
    if (!supabase) return

    const subscription = supabase
      .channel('dashboard-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order change received on dashboard:', payload)
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            ))
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      if (supabase && subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [user, navigate])

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      toast('Failed to logout: ' + error.message, 'error')
    } else {
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="customer-dashboard">
        <div className="page-container">
          <div className="dashboard-stats">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="dashboard-grid" style={{ marginTop: 16 }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'approved' || o.status === 'processing' || o.status === 'ready-for-pickup' || o.status === 'out-for-delivery')
  const completedOrders = orders.filter(o => o.status === 'delivered')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  return (
    <div className="customer-dashboard">
      <div className="page-container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'Customer'}!</h1>
            <p className="tagline">Manage your account and orders</p>
          </div>
          <Button variant="outline" size="sm" icon={<LogOut size={14} />} onClick={handleLogout}>Logout</Button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          <div className="dashboard-card account-overview">
            <h2>Account Overview</h2>
            <div className="overview-content">
              <div className="overview-item">
                <span className="label">Email</span>
                <span className="value">{user?.email}</span>
              </div>
              <div className="overview-item">
                <span className="label">Full Name</span>
                <span className="value">{profile?.full_name || 'Not set'}</span>
              </div>
              <div className="overview-item">
                <span className="label">Phone</span>
                <span className="value">{profile?.phone_number || 'Not set'}</span>
              </div>
              <div className="overview-item">
                <span className="label">Default Address</span>
                <span className="value">{profile?.delivery_address || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-list">
              {isAdmin && (
                <Button
                  className="action-btn admin-btn"
                  variant="navy"
                  icon={<ShieldCheck size={16} />}
                  onClick={() => navigate('/admin')}
                >
                  Admin Dashboard
                </Button>
              )}
              <Button className="action-btn" variant="secondary" icon={<User size={16} />} onClick={() => navigate('/customer/profile')}>Edit Profile</Button>
              <Button className="action-btn" variant="secondary" icon={<Package size={16} />} onClick={() => navigate('/customer/orders')}>My Orders</Button>
              <Button className="action-btn" variant="secondary" icon={<Settings size={16} />} onClick={() => navigate('/customer/settings')}>Account Settings</Button>
              <Button className="action-btn" variant="secondary" icon={<ShoppingBag size={16} />} onClick={() => navigate('/products')}>Continue Shopping</Button>
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <KpiCard icon={<ClipboardList size={20} />} iconBg="rgba(255, 121, 63, 0.12)" label="Active Orders" value={pendingOrders.length} />
          <KpiCard icon={<CircleCheck size={20} />} iconBg="rgba(0, 184, 169, 0.12)" label="Completed Orders" value={completedOrders.length} />
          <KpiCard icon={<XCircle size={20} />} iconBg="rgba(220, 38, 38, 0.10)" label="Cancelled Orders" value={cancelledOrders.length} />
          <KpiCard icon={<ListOrdered size={20} />} iconBg="rgba(11, 47, 99, 0.10)" label="Total Orders" value={orders.length} />
        </div>

        {pendingOrders.length > 0 && (
          <div className="dashboard-card recent-orders">
            <h2>Active Orders</h2>
            <div className="orders-preview">
              {pendingOrders.slice(0, 3).map(order => (
                <div key={order.id} className="order-preview-item">
                  <div className="order-info">
                    <div className="order-id">Order #{order.id?.slice(0, 8)}</div>
                    <div className="order-date">{new Date(order.created_at || '').toLocaleDateString()}</div>
                  </div>
                  <div className="order-status">
                    <StatusBadge status={order.status as any}>{order.status.replace(/-/g, ' ')}</StatusBadge>
                  </div>
                  <div className="order-total">{formatCurrency(order.total)}</div>
                  <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />} onClick={() => navigate(`/customer/orders/${order.id}`)}>View</Button>
                </div>
              ))}
            </div>
            {pendingOrders.length > 3 && (
              <Button className="view-all-btn" variant="outline" size="sm" onClick={() => navigate('/customer/orders')} icon={<ArrowRight size={13} />}>View All Orders</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

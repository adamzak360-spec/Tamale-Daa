import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCustomerOrders } from '../services/customerOrderService'
import { supabase } from '../supabaseClient'
import { Order } from '../types'
import { formatCurrency } from '../utils/currency'
import { Button, EmptyState, PageHeader, Select, SkeletonCard, StatusBadge } from '../components/ui'
import { ArrowLeft, Package, Eye, ShoppingCart } from 'lucide-react'
import './CustomerOrders.css'

export default function CustomerOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const ordersData = await getCustomerOrders(user.id)
        setOrders(ordersData)
      } catch (err: any) {
        console.error('Error loading orders:', err)
        setError(err.message || 'Failed to load orders')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()

    // Subscribe to real-time order updates
    if (!supabase) return

    const subscription = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order change received:', payload)
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

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true
    return order.status === filterStatus
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB
  })

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready-for-pickup', label: 'Ready for Pickup' },
    { value: 'out-for-delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  if (isLoading) {
    return (
      <div className="customer-orders">
        <div className="page-container">
          <div className="orders-list">
            {[1, 2, 3].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="customer-orders">
      <div className="page-container">
        <div className="orders-header">
          <PageHeader
            title="My Orders"
            actions={<Button variant="outline" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/customer')}>Back to Dashboard</Button>}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="orders-controls">
          <div className="control-group">
            <Select label="Filter by Status:" id="filter-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>

          <div className="control-group">
            <Select label="Sort by:" id="sort-by" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </Select>
          </div>
        </div>

        {sortedOrders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            message="You haven't placed any orders yet."
            icon={<Package size={40} style={{ color: 'var(--color-text-tertiary, #9ca3af)' }} />}
            action={{ label: 'Start Shopping', onClick: () => navigate('/products') }}
          />
        ) : (
          <div className="orders-list">
            {sortedOrders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-id-section">
                    <h3>Order #{order.id?.slice(0, 8)}</h3>
                    <span className="order-date">
                      {new Date(order.created_at || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="order-status-section">
                    <StatusBadge status={order.status as any}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/-/g, ' ')}
                    </StatusBadge>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-info">
                    <div className="info-item">
                      <span className="label">Items</span>
                      <span className="value">{order.items?.length || 0} item(s)</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Subtotal</span>
                      <span className="value">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Delivery</span>
                      <span className="value">{formatCurrency(order.delivery_fee)}</span>
                    </div>
                  </div>

                  <div className="order-total">
                    <span className="label">Total</span>
                    <span className="amount">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => navigate(`/customer/orders/${order.id}`)}>View Details</Button>
                  {order.status === 'delivered' && (
                    <Button variant="primary" size="sm" icon={<ShoppingCart size={14} />} onClick={() => navigate(`/customer/orders/${order.id}/reorder`)}>Reorder</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

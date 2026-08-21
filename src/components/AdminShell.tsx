import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, Bell, Package, ShoppingBag, Star, Boxes, TrendingUp, FileBarChart, UserPlus, Receipt, Wallet, Megaphone, Target, Eye, Newspaper, Megaphone as AdIcon, Truck, Store, Settings, BookOpen, BellRing, UserCircle, LogOut, ExternalLink, LayoutGrid } from 'lucide-react'
import { getNotifications, type NotificationItem } from '../services/marketplaceService'
import { useAuth } from '../context/AuthContext'
import './AdminShell.css'

export const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutGrid size={18} />, products: <Package size={18} />, orders: <ShoppingBag size={18} />,
  reviews: <Star size={18} />, inventory: <Boxes size={18} />, suppliers: <UserPlus size={18} />,
  sellers: <Store size={18} />, payouts: <Wallet size={18} />, analytics: <TrendingUp size={18} />,
  reports: <FileBarChart size={18} />, promotions: <Megaphone size={18} />, ads: <AdIcon size={18} />,
  visibility: <Eye size={18} />, news: <Newspaper size={18} />, advertise: <Target size={18} />,
  manual: <BookOpen size={18} />, deliverySettings: <Truck size={18} />, storeSettings: <Store size={18} />,
  marketplaceSettings: <Settings size={18} />, notifications: <BellRing size={18} />,
  pos: <Receipt size={18} />, add: <Package size={18} />, edit: <Package size={18} />,
  profile: <UserCircle size={18} />, signout: <LogOut size={18} />, publicSite: <ExternalLink size={18} />,
}

export interface SidebarSection {
  title: string
  items: SidebarItem[]
}

export interface SidebarItem {
  key: string
  label: string
  icon?: string
  badge?: number
  children?: SidebarItem[]
}

interface AdminShellProps {
  title: string
  sections: SidebarSection[]
  active: string
  onSelect: (key: string) => void
  children: React.ReactNode
  userLabel?: string
  extraActions?: React.ReactNode
}

export default function AdminShell({ title, sections, active, onSelect, children, userLabel, extraActions }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()
  
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const load = async () => {
      const data = await getNotifications(user.id!)
      if (cancelled) return
      setNotifs(data)
      setUnread(data.filter(n => !n.is_read).length)
    }
    load()
    const t = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(t) }
  }, [user?.id])

  const findLabel = (key: string): string => {
    for (const s of sections) {
      for (const it of s.items) {
        if (it.key === key) return it.label
        if (it.children) {
          const c = it.children.find(x => x.key === key)
          if (c) return c.label
        }
      }
    }
    return key
  }

  const go = (key: string) => {
    onSelect(key)
    setMobileOpen(false)
  }

  const sidebar = (
    <div className={`admin-shell-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-text">{title}</span>
        <button className="sidebar-collapse-btn desktop-only" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
        <button className="sidebar-collapse-btn mobile-only" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div className="sidebar-section" key={section.title}>
            {!collapsed && <div className="sidebar-section-title">{section.title}</div>}
            {section.items.map(item => (
              <div key={item.key}>
                <button
                  className={`sidebar-item ${active === item.key ? 'active' : ''}`}
                  onClick={() => go(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-item-icon" aria-hidden="true">{ICONS[item.key]}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </button>
                {active === item.key && item.children?.map(c => (
                  <button
                    key={c.key}
                    className={`sidebar-item child ${active === c.key ? 'active' : ''}`}
                    onClick={() => go(c.key)}
                  >
                    <span className="sidebar-item-label">{c.label}</span>
                    {c.badge != null && c.badge > 0 && <span className="sidebar-badge">{c.badge}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={() => navigate('/')}>
          <span className="sidebar-item-icon" aria-hidden="true">{ICONS.publicSite}</span>
          <span className="sidebar-item-label">View Public Site</span>
        </button>
        <button className="sidebar-item signout" onClick={() => { signOut(); navigate('/') }}>
          <span className="sidebar-item-icon" aria-hidden="true">{ICONS.signout}</span>
          <span className="sidebar-item-label">Sign Out ({userLabel || user?.email || ''})</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="admin-shell">
      {sidebar}
      <div className="admin-shell-main">
        <header className="shell-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <h2 className="shell-title">{findLabel(active)}</h2>
          <div className="shell-topbar-actions">
            {extraActions}
            <div className="notif-wrap">
              <button className={`notif-bell ${unread > 0 ? 'has-unread' : ''}`} onClick={() => setShowNotifs(!showNotifs)}>
                <Bell size={20} />
                {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <strong>Notifications</strong>
                    {unread > 0 && <span className="notif-unread-hint">{unread} unread</span>}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifs.slice(0, 10).map(n => (
                      <button
                        key={n.id}
                        className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                        onClick={() => {
                          setShowNotifs(false)
                          if (n.link) navigate(n.link)
                        }}
                      >
                        <span className="notif-item-title">{n.title}</span>
                        <span className="notif-item-msg">{n.message}</span>
                        <span className="notif-item-time">{new Date(n.created_at).toLocaleString()}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="shell-body">{children}</main>
      </div>
    </div>
  )
}

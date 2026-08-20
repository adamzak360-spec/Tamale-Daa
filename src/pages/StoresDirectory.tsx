import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApprovedSellers } from '../services/marketplaceService'
import type { Seller } from '../services/marketplaceService'

export default function StoresDirectory() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApprovedSellers().then(s => { setSellers(s); setLoading(false) })
  }, [])

  return (
    <div className="stores-directory-page" style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Stores Directory</h2>
          <p style={{ color: '#6b7280' }}>Every registered seller on Tamale Daa.</p>
        </div>
        <Link to="/seller-register" className="btn-primary">Become a Seller</Link>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : sellers.length === 0 ? (
        <div className="empty-state">
          <h3>No stores yet</h3>
          <p>Be the first to open a store on Tamale Daa!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {sellers.map(s => (
            <Link key={s.id} to={`/store/${s.slug}`} className="store-card">
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.business_name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a8a,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
                  {s.business_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: 2 }}>{s.business_name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
                  {s.category || 'General store'}{s.location ? ` · ${s.location}` : ''}
                </p>
                {s.description && (
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '6px 0 0', lineHeight: 1.4 }}>
                    {s.description.slice(0, 110)}{s.description.length > 110 ? '…' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

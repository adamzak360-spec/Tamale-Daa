import { useEffect, useState } from 'react'

import { getSellers, approveSeller, rejectSeller, type Seller } from '../../services/marketplaceService'

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fff7ed', fg: '#c2410c' },
  approved: { bg: '#f0fdf4', fg: '#15803d' },
  rejected: { bg: '#fef2f2', fg: '#dc2626' },
  suspended: { bg: '#f3f4f6', fg: '#4b5563' },
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setSellers(await getSellers())
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const handleApprove = async (s: Seller) => {
    const ok = await approveSeller(s.id)
    if (ok) {
      showNotice(`${s.business_name} approved — they now have seller access.`)
      await load()
    } else showNotice('Could not approve seller.')
  }

  const handleReject = async (s: Seller) => {
    const note = window.prompt(`Reject ${s.business_name} (optional reason shown to seller):`)
    if (note === null) return
    const ok = await rejectSeller(s.id, note || undefined)
    if (ok) {
      showNotice(`${s.business_name} rejected.`)
      await load()
    } else showNotice('Could not reject seller.')
  }

  return (
    <div className="sellers-list-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}

      <div className="view-header-row">
        <h3 className="section-title">Registered Sellers</h3>
        <p className="section-subtitle">Review applications, approve sellers, and manage payouts eligibility.</p>
      </div>

      {loading ? (
        <div className="empty-state"><h3>Loading sellers...</h3></div>
      ) : sellers.length === 0 ? (
        <div className="empty-state">
          <h3>No sellers yet</h3>
          <p>Seller applications will appear here for your review.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s.id}>
                  <td data-label="Store">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.logo_url && <img src={s.logo_url} alt={s.business_name} className="product-thumb" />}
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.business_name}</div>
                        {s.description && <div style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 260 }}>{s.description.slice(0, 80)}</div>}
                      </div>
                    </div>
                  </td>
                  <td data-label="Status">
                    <div>{s.owner_name || '—'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.owner_email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.owner_phone}</div>
                  </td>
                  <td data-label="Applied">{s.location || '—'}</td>
                  <td data-label="Payment">
                    <div style={{ textTransform: 'capitalize' }}>{s.payment_method || '—'}</div>
                    {s.payment_reference ? (() => {
                      try {
                        const details = JSON.parse(s.payment_reference)
                        if (details && typeof details === 'object' && !Array.isArray(details)) {
                          return Object.entries(details).map(([k, v]) => (
                            <div key={k} style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}:</span> {String(v)}
                            </div>
                          ))
                        }
                        return <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.payment_reference}</div>
                      } catch {
                        return <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{s.payment_reference}</div>
                      }
                    })() : null}
                  </td>
                  <td data-label="Owner">
                    <span className="status-badge" style={{ background: STATUS_STYLES[s.status]?.bg, color: STATUS_STYLES[s.status]?.fg, textTransform: 'capitalize' }}>
                      {s.status}
                    </span>
                  </td>
                  <td data-label="Location">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(s)} className="btn-edit" style={{ backgroundColor: '#16a34a' }}>Approve</button>
                        <button onClick={() => handleReject(s)} className="btn-delete">Reject</button>
                      </>
                    )}
                    {s.status === 'approved' && (
                      <button onClick={() => handleReject(s)} className="btn-delete">Suspend</button>
                    )}
                    {s.status === 'rejected' && (
                      <button onClick={() => handleApprove(s)} className="btn-edit" style={{ backgroundColor: '#16a34a' }}>Approve</button>
                    )}
                    {s.admin_note && <div title={s.admin_note} style={{ fontSize: '0.75rem', color: '#dc2626' }}>Note set</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

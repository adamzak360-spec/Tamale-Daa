import { formatCurrency } from '../../utils/currency'
import { useEffect, useMemo, useState } from "react"
import {
  getPayouts, createPayout, updatePayout, deletePayout,
  getSellers, type Payout, type Seller
} from '../../services/marketplaceService'

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#fff7ed', fg: '#c2410c' },
  processing: { bg: '#eff6ff', fg: '#1d4ed8' },
  paid: { bg: '#f0fdf4', fg: '#15803d' },
  failed: { bg: '#fef2f2', fg: '#dc2626' },
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Payout | null>(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<Partial<Payout>>({ amount: 0, currency: 'GHS', status: 'pending', payment_method: '', payment_reference: '', seller_id: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [p, s] = await Promise.all([getPayouts(), getSellers()])
    setPayouts(p)
    setSellers(s)
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const sellerName = (id: string) => sellers.find(s => s.id === id)?.business_name || 'Unknown seller'
  const pendingDelivered = useMemo(() => payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((a, b) => a + (b.amount || 0), 0), [payouts])

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ amount: 0, currency: 'GHS', status: 'pending', payment_method: '', payment_reference: '', seller_id: '' }) }
  const openEdit = (p: Payout) => { setEditing(p); setShowForm(true); setForm(p) }

  const save = async () => {
    if (!form.seller_id || !form.amount || form.amount <= 0) {
      showNotice('Please pick a seller and enter a valid amount.')
      return
    }
    const ok = editing
      ? await updatePayout(editing.id, form)
      : await createPayout(form)
    if (ok) { showNotice(editing ? 'Payout updated.' : 'Payout created.'); setShowForm(false); load() }
    else showNotice('Could not save payout.')
  }

  const markPaid = async (p: Payout) => {
    const ok = await updatePayout(p.id, { status: 'paid', paid_at: new Date().toISOString() })
    if (ok) { showNotice('Payout marked as paid.'); load() }
    else showNotice('Could not update payout.')
  }

  const remove = async (p: Payout) => {
    if (!window.confirm(`Delete payout of ${formatCurrency(p.amount)} to ${sellerName(p.seller_id)}?`)) return
    const ok = await deletePayout(p.id)
    if (ok) { showNotice('Payout deleted.'); load() }
    else showNotice('Could not delete payout.')
  }

  return (
    <div className="payouts-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}

      <div className="view-header-row">
        <div>
          <h3 className="section-title">Seller Payouts</h3>
          <p className="section-subtitle">Track amounts owed and paid to sellers. Pending: {formatCurrency(pendingDelivered)}</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New Payout</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Payout' : 'New Payout'}</h3>
              <button className="close-modal" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="form-grid" style={{ display: 'grid', gap: 12, padding: '4px 4px 8px' }}>
              <div>
                <label>Seller</label>
                <select value={form.seller_id || ''} onChange={e => setForm({ ...form, seller_id: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}>
                  <option value="">Select seller</option>
                  {sellers.filter(s => s.status === 'approved').map(s => (
                    <option key={s.id} value={s.id}>{s.business_name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <label>Amount (GHS)</label>
                  <input type="number" step="0.01" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
                </div>
                <div>
                  <label>Status</label>
                  <select value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value as Payout['status'] })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Payment method</label>
                <input type="text" value={form.payment_method || ''} placeholder="e.g. Mobile Money, Bank Transfer" onChange={e => setForm({ ...form, payment_method: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div>
                <label>Payment reference</label>
                <input type="text" value={form.payment_reference || ''} placeholder="Transaction / receipt number" onChange={e => setForm({ ...form, payment_reference: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <button onClick={save} className="btn-primary" style={{ marginTop: 4 }}>Save Payout</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><h3>Loading payouts...</h3></div>
      ) : payouts.length === 0 ? (
        <div className="empty-state">
          <h3>No payouts recorded</h3>
          <p>Create a payout when you settle a seller's earnings.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Seller</th><th>Amount</th><th>Method</th><th>Reference</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td data-label="Seller" style={{ fontWeight: 600 }}>{sellerName(p.seller_id)}</td>
                  <td data-label="Status">{formatCurrency(p.amount)}</td>
                  <td data-label="Amount">{p.payment_method || '—'}</td>
                  <td data-label="Actions" style={{ fontSize: '0.85rem', color: '#4b5563' }}>{p.payment_reference || '—'}</td>
                  <td data-label="Reference">
                    <span className="status-badge" style={{ background: STATUS_STYLES[p.status]?.bg, color: STATUS_STYLES[p.status]?.fg, textTransform: 'capitalize' }}>{p.status}</span>
                  </td>
                  <td data-label="Status">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {p.status !== 'paid' && <button onClick={() => markPaid(p)} className="btn-edit" style={{ backgroundColor: '#16a34a' }}>Mark Paid</button>}
                    <button onClick={() => openEdit(p)} className="btn-edit">Edit</button>
                    <button onClick={() => remove(p)} className="btn-delete">Delete</button>
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

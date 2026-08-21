import { useEffect, useState } from 'react'
import { getPromotions, createPromotion, updatePromotion, deletePromotion, type Promotion } from '../../services/marketplaceService'

export default function AdminPromotions() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<Partial<Promotion>>({ title: '', description: '', promo_code: '', discount_type: 'percent', discount_value: 0, is_active: true })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setPromos(await getPromotions())
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', description: '', promo_code: '', discount_type: 'percent', discount_value: 0, is_active: true }) }
  const openEdit = (p: Promotion) => { setEditing(p); setShowForm(true); setForm(p) }

  const save = async () => {
    if (!form.title?.trim()) { showNotice('Please enter a title.'); return }
    if (!form.discount_value || form.discount_value <= 0) { showNotice('Please enter a valid discount value.'); return }
    const ok = editing ? await updatePromotion(editing.id, form) : await createPromotion(form)
    if (ok) { showNotice(editing ? 'Promotion updated.' : 'Promotion created.'); setShowForm(false); load() }
    else showNotice('Could not save promotion.')
  }

  const remove = async (p: Promotion) => {
    if (!window.confirm(`Delete promotion "${p.title}"?`)) return
    const ok = await deletePromotion(p.id)
    if (ok) { showNotice('Promotion deleted.'); load() }
    else showNotice('Could not delete promotion.')
  }

  const toggleActive = async (p: Promotion) => {
    const ok = await updatePromotion(p.id, { is_active: !p.is_active })
    if (ok) showNotice(p.is_active ? 'Promotion deactivated.' : 'Promotion activated.'); load()
  }

  return (
    <div className="promotions-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}

      <div className="view-header-row">
        <div>
          <h3 className="section-title">Promotions</h3>
          <p className="section-subtitle">Discount codes and campaigns customers can use at checkout.</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New Promotion</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button className="close-modal" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="form-grid" style={{ display: 'grid', gap: 12, padding: '4px 4px 8px' }}>
              <div>
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Weekend Sale" style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div>
                <label>Description</label>
                <textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Promo code</label>
                  <input type="text" value={form.promo_code || ''} onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE10" style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
                </div>
                <div>
                  <label>Discount type</label>
                  <select value={form.discount_type || 'percent'} onChange={e => setForm({ ...form, discount_type: e.target.value as Promotion['discount_type'] })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed (GHS)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Discount value</label>
                  <input type="number" step="0.01" value={form.discount_value || ''} onChange={e => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Start date (optional)</label>
                  <input type="date" value={form.start_at ? form.start_at.slice(0, 10) : ''} onChange={e => setForm({ ...form, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
                </div>
                <div>
                  <label>End date (optional)</label>
                  <input type="date" value={form.end_at ? form.end_at.slice(0, 10) : ''} onChange={e => setForm({ ...form, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
                </div>
              </div>
              <button onClick={save} className="btn-primary" style={{ marginTop: 4 }}>Save Promotion</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><h3>Loading promotions...</h3></div>
      ) : promos.length === 0 ? (
        <div className="empty-state">
          <h3>No promotions yet</h3>
          <p>Create discount codes and campaigns to boost sales.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Title</th><th>Code</th><th>Discount</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id}>
                  <td data-label="Title">
                    <div style={{ fontWeight: 600 }}>{p.title}</div>
                    {p.description && <div style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 280 }}>{p.description.slice(0, 80)}</div>}
                  </td>
                  <td data-label="Actions"><code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 6 }}>{p.promo_code || '—'}</code></td>
                  <td data-label="Active">{p.discount_type === 'percent' ? `${p.discount_value}%` : `GH₵${p.discount_value}`}</td>
                  <td data-label="Code">
                    <span className="status-badge" style={{ background: p.is_active ? '#f0fdf4' : '#f3f4f6', color: p.is_active ? '#15803d' : '#4b5563' }}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Discount" className="actions-cell">
                    <button onClick={() => toggleActive(p)} className="btn-edit">{p.is_active ? 'Deactivate' : 'Activate'}</button>
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

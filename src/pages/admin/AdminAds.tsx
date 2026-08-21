import { useEffect, useState } from 'react'
import { getAds, createAd, updateAd, deleteAd, type AdBanner } from '../../services/marketplaceService'

export default function AdminAds() {
  const [ads, setAds] = useState<AdBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdBanner | null>(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<Partial<AdBanner>>({ title: '', image_url: '', link_url: '', position: 'homepage', is_active: true })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setAds(await getAds())
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', image_url: '', link_url: '', position: 'homepage', is_active: true }) }
  const openEdit = (a: AdBanner) => { setEditing(a); setShowForm(true); setForm(a) }

  const save = async () => {
    if (!form.title?.trim()) { showNotice('Please enter a title.'); return }
    if (!form.image_url?.trim()) { showNotice('Please enter an image URL.'); return }
    const ok = editing ? await updateAd(editing.id, form) : await createAd(form)
    if (ok) { showNotice(editing ? 'Ad updated.' : 'Ad created.'); setShowForm(false); load() }
    else showNotice('Could not save ad.')
  }

  const remove = async (a: AdBanner) => {
    if (!window.confirm(`Delete ad "${a.title}"?`)) return
    const ok = await deleteAd(a.id)
    if (ok) { showNotice('Ad deleted.'); load() }
    else showNotice('Could not delete ad.')
  }

  const toggleActive = async (a: AdBanner) => {
    const ok = await updateAd(a.id, { is_active: !a.is_active })
    if (ok) showNotice(a.is_active ? 'Ad deactivated.' : 'Ad activated.'); load()
  }

  return (
    <div className="ads-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}

      <div className="view-header-row">
        <div>
          <h3 className="section-title">Ads & Banners</h3>
          <p className="section-subtitle">Manage promotional banners shown across the site.</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New Banner</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Banner' : 'New Banner'}</h3>
              <button className="close-modal" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="form-grid" style={{ display: 'grid', gap: 12, padding: '4px 4px 8px' }}>
              <div>
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div>
                <label>Image URL</label>
                <input type="text" value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div>
                <label>Click-through link (optional)</label>
                <input type="text" value={form.link_url || ''} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label>Position</label>
                  <select value={form.position || 'homepage'} onChange={e => setForm({ ...form, position: e.target.value as AdBanner['position'] })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}>
                    <option value="homepage">Homepage</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="product">Product Pages</option>
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end' }}>
                  <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <button onClick={save} className="btn-primary" style={{ marginTop: 4 }}>Save Banner</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><h3>Loading banners...</h3></div>
      ) : ads.length === 0 ? (
        <div className="empty-state">
          <h3>No banners yet</h3>
          <p>Add promotional banners to feature across the site.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Banner</th><th>Position</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {ads.map(a => (
                <tr key={a.id}>
                  <td data-label="Banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={a.image_url} alt={a.title} style={{ width: 90, height: 45, objectFit: 'cover', borderRadius: 6 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        {a.link_url && <div style={{ fontSize: '0.8rem', color: '#0284c7' }}>{a.link_url}</div>}
                      </div>
                    </div>
                  </td>
                  <td data-label="Actions" style={{ textTransform: 'capitalize' }}>{a.position}</td>
                  <td data-label="Actions">
                    <span className="status-badge" style={{ background: a.is_active ? '#f0fdf4' : '#f3f4f6', color: a.is_active ? '#15803d' : '#4b5563' }}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <button onClick={() => toggleActive(a)} className="btn-edit">{a.is_active ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => openEdit(a)} className="btn-edit">Edit</button>
                    <button onClick={() => remove(a)} className="btn-delete">Delete</button>
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

import { useEffect, useState } from 'react'
import { getNews, createNews, updateNews, deleteNews, type NewsUpdate } from '../../services/marketplaceService'

export default function AdminNews() {
  const [news, setNews] = useState<NewsUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<NewsUpdate | null>(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<Partial<NewsUpdate>>({ title: '', body: '', is_published: true })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setNews(await getNews())
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', body: '', is_published: true }) }
  const openEdit = (n: NewsUpdate) => { setEditing(n); setShowForm(true); setForm(n) }

  const save = async () => {
    if (!form.title?.trim()) { showNotice('Please enter a title.'); return }
    const ok = editing ? await updateNews(editing.id, form) : await createNews(form)
    if (ok) { showNotice(editing ? 'News updated.' : 'News published.'); setShowForm(false); load() }
    else showNotice('Could not save news.')
  }

  const remove = async (n: NewsUpdate) => {
    if (!window.confirm(`Delete "${n.title}"?`)) return
    const ok = await deleteNews(n.id)
    if (ok) { showNotice('News deleted.'); load() }
    else showNotice('Could not delete news.')
  }

  const togglePublished = async (n: NewsUpdate) => {
    const ok = await updateNews(n.id, { is_published: !n.is_published })
    if (ok) showNotice(n.is_published ? 'News unpublished.' : 'News published.'); load()
  }

  return (
    <div className="news-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}

      <div className="view-header-row">
        <div>
          <h3 className="section-title">News & Updates</h3>
          <p className="section-subtitle">Announcements shown to visitors and customers.</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ New Update</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Update' : 'New Update'}</h3>
              <button className="close-modal" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="form-grid" style={{ display: 'grid', gap: 12, padding: '4px 4px 8px' }}>
              <div>
                <label>Title</label>
                <input type="text" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <div>
                <label>Body</label>
                <textarea rows={5} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8, resize: 'vertical' }} />
              </div>
              <div>
                <label>Image URL (optional)</label>
                <input type="text" value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
                Published (visible to everyone)
              </label>
              <button onClick={save} className="btn-primary" style={{ marginTop: 4 }}>Save Update</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><h3>Loading updates...</h3></div>
      ) : news.length === 0 ? (
        <div className="empty-state">
          <h3>No news updates yet</h3>
          <p>Share announcements, restocks, and events with your customers.</p>
        </div>
      ) : (
        <div className="products-table">
          <table>
            <thead>
              <tr><th>Title</th><th>Preview</th><th>Published</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {news.map(n => (
                <tr key={n.id}>
                  <td data-label="Title" style={{ fontWeight: 600, maxWidth: 200 }}>{n.title}</td>
                  <td data-label="Published" style={{ fontSize: '0.85rem', color: '#4b5563', maxWidth: 320 }}>{(n.body || '').slice(0, 120)}{(n.body || '').length > 120 ? '...' : ''}</td>
                  <td data-label="Published">
                    <span className="status-badge" style={{ background: n.is_published ? '#f0fdf4' : '#f3f4f6', color: n.is_published ? '#15803d' : '#4b5563' }}>
                      {n.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td data-label="Published">{new Date(n.created_at).toLocaleDateString()}</td>
                  <td data-label="Published" className="actions-cell">
                    <button onClick={() => togglePublished(n)} className="btn-edit">{n.is_published ? 'Unpublish' : 'Publish'}</button>
                    <button onClick={() => openEdit(n)} className="btn-edit">Edit</button>
                    <button onClick={() => remove(n)} className="btn-delete">Delete</button>
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

import { useEffect, useState } from 'react'
import { getNews, createNews, updateNews, deleteNews, type NewsUpdate } from '../../services/marketplaceService'
import { Button, Input, Textarea, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal } from '../../components/ui'
import { toast } from '../../components/ui'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

export default function AdminNews() {
  const [news, setNews] = useState<NewsUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<NewsUpdate | null>(null)
  const [form, setForm] = useState<Partial<NewsUpdate>>({ title: '', body: '', is_published: true })
  const [deleteTarget, setDeleteTarget] = useState<NewsUpdate | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setNews(await getNews())
    setLoading(false)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', body: '', is_published: true }) }
  const openEdit = (n: NewsUpdate) => { setEditing(n); setShowForm(true); setForm(n) }

  const save = async () => {
    if (!form.title?.trim()) { toast('Please enter a title.', 'error'); return }
    const ok = editing ? await updateNews(editing.id, form) : await createNews(form)
    if (ok) { toast(editing ? 'News updated.' : 'News published.', 'success'); setShowForm(false); load() }
    else toast('Could not save news.', 'error')
  }

  const remove = async () => {
    if (!deleteTarget) return
    const ok = await deleteNews(deleteTarget.id)
    if (ok) { toast('News deleted.', 'success'); setDeleteTarget(null); load() }
    else toast('Could not delete news.', 'error')
  }

  const togglePublished = async (n: NewsUpdate) => {
    const ok = await updateNews(n.id, { is_published: !n.is_published })
    if (ok) toast(n.is_published ? 'News unpublished.' : 'News published.', 'success'); load()
  }

  return (
    <div className="page-content">
      <PageHeader
        title="News & Updates"
        subtitle="Announcements shown to visitors and customers."
        actions={<Button variant="primary" size="sm" onClick={openNew} icon={<Plus size={15} />}>+ New Update</Button>}
      />

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Edit Update' : 'New Update'}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={save}>Save Update</Button>
            </>
          }
        >
          <div className="form-grid">
            <Input label="Title" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Body" rows={5} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} />
            <Input label="Image URL (optional)" value={form.image_url || ''} placeholder="https://..." onChange={e => setForm({ ...form, image_url: e.target.value })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
              <input type="checkbox" checked={!!form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
              Published (visible to everyone)
            </label>
          </div>
        </Modal>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : news.length === 0 ? (
        <EmptyState
          title="No news updates yet"
          message="Share announcements, restocks, and events with your customers."
          action={{ label: '+ New Update', onClick: openNew }}
        />
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
                    <StatusBadge status={n.is_published ? 'delivered' : 'pending'}>
                      {n.is_published ? 'Published' : 'Draft'}
                    </StatusBadge>
                  </td>
                  <td data-label="Published">{new Date(n.created_at).toLocaleDateString()}</td>
                  <td data-label="Published" className="actions-cell">
                    <Button variant="ghost" size="sm" icon={n.is_published ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => togglePublished(n)}>{n.is_published ? 'Unpublish' : 'Publish'}</Button>
                    <button onClick={() => openEdit(n)} className="btn-edit" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(n)} className="btn-delete" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Update"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Delete "{deleteTarget?.title}"? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

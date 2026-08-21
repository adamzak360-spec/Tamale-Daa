import { useEffect, useState } from 'react'
import { getAds, createAd, updateAd, deleteAd, type AdBanner } from '../../services/marketplaceService'
import { Button, Input, Select, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal } from '../../components/ui'
import { toast } from '../../components/ui'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

export default function AdminAds() {
  const [ads, setAds] = useState<AdBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdBanner | null>(null)
  const [form, setForm] = useState<Partial<AdBanner>>({ title: '', image_url: '', link_url: '', position: 'homepage', is_active: true })
  const [deleteTarget, setDeleteTarget] = useState<AdBanner | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setAds(await getAds())
    setLoading(false)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', image_url: '', link_url: '', position: 'homepage', is_active: true }) }
  const openEdit = (a: AdBanner) => { setEditing(a); setShowForm(true); setForm(a) }

  const save = async () => {
    if (!form.title?.trim()) { toast('Please enter a title.', 'error'); return }
    if (!form.image_url?.trim()) { toast('Please enter an image URL.', 'error'); return }
    const ok = editing ? await updateAd(editing.id, form) : await createAd(form)
    if (ok) { toast(editing ? 'Ad updated.' : 'Ad created.', 'success'); setShowForm(false); load() }
    else toast('Could not save ad.', 'error')
  }

  const remove = async () => {
    if (!deleteTarget) return
    const ok = await deleteAd(deleteTarget.id)
    if (ok) { toast('Ad deleted.', 'success'); setDeleteTarget(null); load() }
    else toast('Could not delete ad.', 'error')
  }

  const toggleActive = async (a: AdBanner) => {
    const ok = await updateAd(a.id, { is_active: !a.is_active })
    if (ok) toast(a.is_active ? 'Ad deactivated.' : 'Ad activated.', 'success'); load()
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Ads & Banners"
        subtitle="Manage promotional banners shown across the site."
        actions={<Button variant="primary" size="sm" onClick={openNew} icon={<Plus size={15} />}>+ New Banner</Button>}
      />

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Edit Banner' : 'New Banner'}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={save}>Save Banner</Button>
            </>
          }
        >
          <div className="form-grid">
            <Input label="Title" required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input label="Image URL" required value={form.image_url || ''} placeholder="https://..." onChange={e => setForm({ ...form, image_url: e.target.value })} />
            <Input label="Click-through link (optional)" value={form.link_url || ''} placeholder="https://..." onChange={e => setForm({ ...form, link_url: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select
                label="Position"
                value={form.position || 'homepage'}
                onChange={e => setForm({ ...form, position: e.target.value as AdBanner['position'] })}
              >
                <option value="homepage">Homepage</option>
                <option value="sidebar">Sidebar</option>
                <option value="product">Product Pages</option>
              </Select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
        </Modal>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : ads.length === 0 ? (
        <EmptyState
          title="No banners yet"
          message="Add promotional banners to feature across the site."
          action={{ label: '+ New Banner', onClick: openNew }}
        />
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
                  <td data-label="Active">
                    <StatusBadge status={a.is_active ? 'active' : 'inactive'}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <Button variant="ghost" size="sm" icon={a.is_active ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => toggleActive(a)}>{a.is_active ? 'Deactivate' : 'Activate'}</Button>
                    <button onClick={() => openEdit(a)} className="btn-edit" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(a)} className="btn-delete" title="Delete"><Trash2 size={14} /></button>
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
        title="Delete Banner"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Delete ad "{deleteTarget?.title}"? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

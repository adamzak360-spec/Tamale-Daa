import { useEffect, useState } from 'react'
import { getPromotions, createPromotion, updatePromotion, deletePromotion, type Promotion } from '../../services/marketplaceService'
import { Button, Input, Textarea, Select, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal } from '../../components/ui'
import { toast } from '../../components/ui'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'

export default function AdminPromotions() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState<Partial<Promotion>>({ title: '', description: '', promo_code: '', discount_type: 'percent', discount_value: 0, is_active: true })
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setPromos(await getPromotions())
    setLoading(false)
  }

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ title: '', description: '', promo_code: '', discount_type: 'percent', discount_value: 0, is_active: true }) }
  const openEdit = (p: Promotion) => { setEditing(p); setShowForm(true); setForm(p) }

  const save = async () => {
    if (!form.title?.trim()) { toast('Please enter a title.', 'error'); return }
    if (!form.discount_value || form.discount_value <= 0) { toast('Please enter a valid discount value.', 'error'); return }
    const ok = editing ? await updatePromotion(editing.id, form) : await createPromotion(form)
    if (ok) { toast(editing ? 'Promotion updated.' : 'Promotion created.', 'success'); setShowForm(false); load() }
    else toast('Could not save promotion.', 'error')
  }

  const remove = async () => {
    if (!deleteTarget) return
    const ok = await deletePromotion(deleteTarget.id)
    if (ok) { toast('Promotion deleted.', 'success'); setDeleteTarget(null); load() }
    else toast('Could not delete promotion.', 'error')
  }

  const toggleActive = async (p: Promotion) => {
    const ok = await updatePromotion(p.id, { is_active: !p.is_active })
    if (ok) toast(p.is_active ? 'Promotion deactivated.' : 'Promotion activated.', 'success'); load()
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Promotions"
        subtitle="Discount codes and campaigns customers can use at checkout."
        actions={<Button variant="primary" size="sm" onClick={openNew} icon={<Plus size={15} />}>+ New Promotion</Button>}
      />

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Edit Promotion' : 'New Promotion'}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={save}>Save Promotion</Button>
            </>
          }
        >
          <div className="form-grid">
            <Input label="Title" required value={form.title || ''} placeholder="e.g. Weekend Sale" onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea label="Description" rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Promo code" value={form.promo_code || ''} placeholder="e.g. SAVE10" onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })} />
              <Select
                label="Discount type"
                value={form.discount_type || 'percent'}
                onChange={e => setForm({ ...form, discount_type: e.target.value as Promotion['discount_type'] })}
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (GHS)</option>
              </Select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Discount value" type="number" step="0.01" value={form.discount_value || ''} onChange={e => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Start date (optional)" type="date" value={form.start_at ? form.start_at.slice(0, 10) : ''} onChange={e => setForm({ ...form, start_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              <Input label="End date (optional)" type="date" value={form.end_at ? form.end_at.slice(0, 10) : ''} onChange={e => setForm({ ...form, end_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>
        </Modal>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : promos.length === 0 ? (
        <EmptyState
          title="No promotions yet"
          message="Create discount codes and campaigns to boost sales."
          action={{ label: '+ New Promotion', onClick: openNew }}
        />
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
                  <td data-label="Active">
                    <StatusBadge status={p.is_active ? 'active' : 'inactive'}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <Button variant="ghost" size="sm" icon={p.is_active ? <EyeOff size={14} /> : <Eye size={14} />} onClick={() => toggleActive(p)}>{p.is_active ? 'Deactivate' : 'Activate'}</Button>
                    <button onClick={() => openEdit(p)} className="btn-edit" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(p)} className="btn-delete" title="Delete"><Trash2 size={14} /></button>
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
        title="Delete Promotion"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Delete promotion "{deleteTarget?.title}"? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

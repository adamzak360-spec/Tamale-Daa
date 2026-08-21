import { formatCurrency } from '../../utils/currency'
import { useEffect, useMemo, useState } from "react"
import {
  getPayouts, createPayout, updatePayout, deletePayout,
  getSellers, type Payout, type Seller
} from '../../services/marketplaceService'
import { Button, Select, Input, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal } from '../../components/ui'
import { toast } from '../../components/ui'
import { Wallet, Plus, Check, Pencil, Trash2 } from 'lucide-react'

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Payout | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Payout | null>(null)
  const [form, setForm] = useState<Partial<Payout>>({ amount: 0, currency: 'GHS', status: 'pending', payment_method: '', payment_reference: '', seller_id: '' })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [p, s] = await Promise.all([getPayouts(), getSellers()])
    setPayouts(p)
    setSellers(s)
    setLoading(false)
  }

  const sellerName = (id: string) => sellers.find(s => s.id === id)?.business_name || 'Unknown seller'
  const pendingDelivered = useMemo(() => payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((a, b) => a + (b.amount || 0), 0), [payouts])

  const openNew = () => { setEditing(null); setShowForm(true); setForm({ amount: 0, currency: 'GHS', status: 'pending', payment_method: '', payment_reference: '', seller_id: '' }) }
  const openEdit = (p: Payout) => { setEditing(p); setShowForm(true); setForm(p) }

  const save = async () => {
    if (!form.seller_id || !form.amount || form.amount <= 0) {
      toast('Please pick a seller and enter a valid amount.', 'error')
      return
    }
    const ok = editing
      ? await updatePayout(editing.id, form)
      : await createPayout(form)
    if (ok) { toast(editing ? 'Payout updated.' : 'Payout created.', 'success'); setShowForm(false); load() }
    else toast('Could not save payout.', 'error')
  }

  const markPaid = async (p: Payout) => {
    const ok = await updatePayout(p.id, { status: 'paid', paid_at: new Date().toISOString() })
    if (ok) { toast('Payout marked as paid.', 'success'); load() }
    else toast('Could not update payout.', 'error')
  }

  const remove = async () => {
    if (!deleteTarget) return
    const ok = await deletePayout(deleteTarget.id)
    if (ok) { toast('Payout deleted.', 'success'); setDeleteTarget(null); load() }
    else toast('Could not delete payout.', 'error')
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Seller Payouts"
        subtitle={`Track amounts owed and paid to sellers. Pending: ${formatCurrency(pendingDelivered)}`}
        actions={<Button variant="primary" size="sm" onClick={openNew} icon={<Plus size={15} />}>+ New Payout</Button>}
      />

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Edit Payout' : 'New Payout'}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" icon={<Wallet size={15} />} onClick={save}>Save Payout</Button>
            </>
          }
        >
          <div className="form-grid">
            <Select label="Seller" required value={form.seller_id || ''} onChange={e => setForm({ ...form, seller_id: e.target.value })}>
              <option value="">Select seller</option>
              {sellers.filter(s => s.status === 'approved').map(s => (
                <option key={s.id} value={s.id}>{s.business_name}</option>
              ))}
            </Select>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <Input label="Amount (GHS)" type="number" step="0.01" required value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
              <Select label="Status" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value as Payout['status'] })}>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
            <Input label="Payment method" value={form.payment_method || ''} placeholder="e.g. Mobile Money, Bank Transfer" onChange={e => setForm({ ...form, payment_method: e.target.value })} />
            <Input label="Payment reference" value={form.payment_reference || ''} placeholder="Transaction / receipt number" onChange={e => setForm({ ...form, payment_reference: e.target.value })} />
          </div>
        </Modal>
      )}

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : payouts.length === 0 ? (
        <EmptyState
          title="No payouts recorded"
          message="Create a payout when you settle a seller's earnings."
          action={{ label: '+ New Payout', onClick: openNew }}
        />
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
                  <td data-label="Status">
                    <StatusBadge status={p.status}>{p.status}</StatusBadge>
                  </td>
                  <td data-label="Status">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {p.status !== 'paid' && <Button variant="ghost" size="sm" icon={<Check size={14} />} onClick={() => markPaid(p)}>Mark Paid</Button>}
                    <button onClick={() => openEdit(p)} className="btn-edit" title="Edit payout"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteTarget(p)} className="btn-delete" title="Delete payout"><Trash2 size={14} /></button>
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
        title="Delete Payout"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={remove}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Delete payout of <strong>{formatCurrency(deleteTarget?.amount || 0)}</strong> to <strong>{deleteTarget ? sellerName(deleteTarget.seller_id) : ''}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}

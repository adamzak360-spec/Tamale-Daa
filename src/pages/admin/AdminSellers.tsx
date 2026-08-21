import { useEffect, useState } from 'react'

import { getSellers, approveSeller, rejectSeller, type Seller } from '../../services/marketplaceService'
import { Button, StatusBadge, PageHeader, SkeletonTable, EmptyState, Modal, Input } from '../../components/ui'
import { toast } from '../../components/ui'
import { Check, X } from 'lucide-react'

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<Seller | null>(null)
  const [approveTarget, setApproveTarget] = useState<Seller | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setSellers(await getSellers())
    setLoading(false)
  }

  const handleApprove = async (s: Seller) => {
    setBusy(true)
    const ok = await approveSeller(s.id)
    setBusy(false)
    if (ok) {
      toast(`${s.business_name} approved — they now have seller access.`, 'success')
      await load()
    } else toast('Could not approve seller.', 'error')
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    const note = rejectReason.trim() || undefined
    setBusy(true)
    const ok = await rejectSeller(rejectTarget.id, note)
    setBusy(false)
    if (ok) {
      toast(`${rejectTarget.business_name} rejected.`, 'success')
      setRejectTarget(null)
      setRejectReason('')
      await load()
    } else toast('Could not reject seller.', 'error')
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Registered Sellers"
        subtitle={`Review applications, approve sellers, and manage payouts eligibility. ${sellers.length} registered.`}
      />

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : sellers.length === 0 ? (
        <EmptyState
          title="No sellers yet"
          message="Seller applications will appear here for your review."
        />
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
                  <td data-label="Status">
                    <StatusBadge status={s.status}>{s.status}</StatusBadge>
                  </td>
                  <td data-label="Location">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td data-label="Actions" className="actions-cell">
                    {s.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="sm" icon={<Check size={14} />} onClick={() => setApproveTarget(s)}>Approve</Button>
                        <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => { setRejectTarget(s); setRejectReason('') }}>Reject</Button>
                      </>
                    )}
                    {s.status === 'approved' && (
                      <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => { setRejectTarget(s); setRejectReason('') }}>Suspend</Button>
                    )}
                    {s.status === 'rejected' && (
                      <Button variant="ghost" size="sm" icon={<Check size={14} />} onClick={() => setApproveTarget(s)}>Approve</Button>
                    )}
                    {s.admin_note && <div title={s.admin_note} style={{ fontSize: '0.75rem', color: '#dc2626' }}>Note set</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason('') }}
        title={rejectTarget?.status === 'approved' ? `Suspend ${rejectTarget?.business_name}` : `Reject ${rejectTarget?.business_name}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setRejectTarget(null); setRejectReason('') }}>Cancel</Button>
            <Button variant="danger-solid" size="sm" onClick={handleReject} disabled={busy}>{busy ? 'Please wait…' : (rejectTarget?.status === 'approved' ? 'Suspend' : 'Reject')}</Button>
          </>
        }
      >
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          {rejectTarget?.status === 'approved'
            ? `Suspending will revoke this seller's dashboard access.`
            : `The reason you enter will be shown to the seller.`}
        </p>
        <Input
          label="Reason (optional)"
          placeholder="e.g. Incomplete verification documents"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title={`Approve ${approveTarget?.business_name}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setApproveTarget(null)}>Cancel</Button>
            <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={() => { if (approveTarget) handleApprove(approveTarget); setApproveTarget(null) }} disabled={busy}>{busy ? 'Please wait…' : 'Approve Seller'}</Button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
          Approving grants this seller access to their dashboard, orders, and payout eligibility.
        </p>
      </Modal>
    </div>
  )
}

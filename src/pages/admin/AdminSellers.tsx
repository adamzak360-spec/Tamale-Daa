import { useEffect, useMemo, useState } from 'react'

import { getSellers, approveSeller, rejectSeller, type Seller } from '../../services/marketplaceService'
import { Button, StatusBadge, PageHeader, DataTable, TableToolbar, PersonCell, RowActions, Modal, Input } from '../../components/ui'
import type { DataTableColumn } from '../../components/ui'
import { toast } from '../../components/ui'
import { Check, X, Store } from 'lucide-react'

type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<Seller | null>(null)
  const [approveTarget, setApproveTarget] = useState<Seller | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setSellers(await getSellers())
    setLoading(false)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sellers.filter(s => {
      if (statusFilter && s.status !== statusFilter) return false
      if (!q) return true
      return (
        s.business_name.toLowerCase().includes(q) ||
        (s.owner_name || '').toLowerCase().includes(q) ||
        (s.owner_email || '').toLowerCase().includes(q) ||
        (s.owner_phone || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q)
      )
    })
  }, [sellers, search, statusFilter])

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


  const columns: DataTableColumn<Seller>[] = [
    {
      key: 'seller', header: 'Seller', minWidth: '210px',
      cell: s => (
        <div className="dt-product">
          <span className="dt-avatar">
            {s.logo_url ? <img src={s.logo_url} alt={s.business_name} /> : <Store size={15} />}
          </span>
          <PersonCell
            primary={s.business_name}
            secondary={s.description ? s.description.slice(0, 60) : undefined}
          />
        </div>
      ),
    },
    {
      key: 'contact', header: 'Contact', minWidth: '180px',
      cell: s => (
        <PersonCell
          primary={s.owner_name || '—'}
          secondary={s.owner_email || undefined}
          muted={s.owner_phone || undefined}
        />
      ),
    },
    {
      key: 'location', header: 'Location', width: '140px',
      cell: s => s.location || '—',
    },
    {
      key: 'payout', header: 'Payout', minWidth: '150px',
      cell: s => (
        <div>
          <div style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.85rem' }}>{s.payment_method || '—'}</div>
          {s.payment_reference ? (() => {
            try {
              const details = JSON.parse(s.payment_reference)
              if (details && typeof details === 'object' && !Array.isArray(details)) {
                const first = Object.values(details)[0]
                return first ? <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{String(first)}</div> : null
              }
              return <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{s.payment_reference}</div>
            } catch {
              return <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{s.payment_reference}</div>
            }
          })() : null}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', width: '115px', align: 'center',
      cell: s => <StatusBadge status={s.status as SellerStatus}>{s.status}</StatusBadge>,
    },
    {
      key: 'registered', header: 'Registered', width: '110px',
      cell: s => new Date(s.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions', header: 'Actions', width: '150px', sticky: 'right', align: 'right',
      cell: s => (
        <RowActions>
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
          {s.admin_note && <span title={s.admin_note} style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginLeft: '0.3rem' }}>Note</span>}
        </RowActions>
      ),
    },
  ]

  return (
    <div className="page-content">
      <PageHeader
        title="Registered Sellers"
        subtitle={`Review applications, approve sellers, and manage payouts eligibility. ${sellers.length} registered.`}
      />

      <TableToolbar>
        <input
          className="form-input"
          placeholder="Search sellers, emails, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search sellers"
          style={{ minWidth: '220px' }}
        />
        <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" style={{ minWidth: '150px' }}>
          {STATUS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </TableToolbar>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        emptyTitle={search || statusFilter ? 'No matching sellers' : 'No sellers yet'}
        emptyMessage={search || statusFilter ? 'Try adjusting your search or filters.' : 'Seller applications will appear here for your review.'}
        stickyHeader
        caption={`${filtered.length} of ${sellers.length} sellers`}
        rowKey={s => s.id}
      />

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

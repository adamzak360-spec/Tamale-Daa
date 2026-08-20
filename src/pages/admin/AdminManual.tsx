import { useEffect, useState } from 'react'
import { getSiteSettings, upsertSiteSetting } from '../../services/marketplaceService'

export default function AdminManual() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const settings = await getSiteSettings()
    setText((settings.operations_manual as string) || DEFAULT_MANUAL)
  }

  const DEFAULT_MANUAL = `Tamale Daa Operations Manual

1. Order flow: Customer places an order → order appears in Orders with status Pending → Admin approves → status moves through Processing, Ready for Pickup / Out for Delivery, Delivered.
2. Payment: Orders are paid online via Paystack (cards and mobile money) before confirmation. No cash on delivery.
3. Delivery: Fees are set in Delivery Settings per zone. The customer pays delivery at checkout.
4. Payouts: Seller earnings are settled manually and recorded under Seller Payouts.
5. Reviews: Customer reviews are held for approval; approve good reviews, hide inappropriate ones.
6. Sellers: New seller applications appear under Registered Sellers. Review their business info and payment details before approving.
7. News: Post announcements under News & Updates to keep customers informed.
8. Inventory: Keep stock quantities current so customers see accurate availability.`

  const save = async () => {
    setSaving(true)
    const ok = await upsertSiteSetting('operations_manual', text)
    setSaving(false)
    setNotice(ok ? 'Operations manual saved.' : 'Could not save.')
    setTimeout(() => setNotice(''), 3000)
  }

  return (
    <div className="manual-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}
      <div className="view-header-row">
        <div>
          <h3 className="section-title">Operations Manual</h3>
          <p className="section-subtitle">Document your store procedures so every operator follows the same process.</p>
        </div>
        <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Manual'}</button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={24}
        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem' }}
      />
      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 8 }}>Tip: keep procedures short and numbered so they are easy to follow.</p>
    </div>
  )
}

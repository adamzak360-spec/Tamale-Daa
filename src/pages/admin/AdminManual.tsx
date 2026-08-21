import { useEffect, useState } from 'react'
import { getSiteSettings, upsertSiteSetting } from '../../services/marketplaceService'
import { Button, Textarea, PageHeader } from '../../components/ui'
import { toast } from '../../components/ui'
import { Save } from 'lucide-react'

export default function AdminManual() {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

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
    toast(ok ? 'Operations manual saved.' : 'Could not save.', ok ? 'success' : 'error')
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Operations Manual"
        subtitle="Document your store procedures so every operator follows the same process."
        actions={<Button variant="primary" size="sm" onClick={save} icon={<Save size={15} />} disabled={saving}>{saving ? 'Saving...' : 'Save Manual'}</Button>}
      />
      <Textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={24}
        style={{ fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: 1.6 }}
      />
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary, #6b7280)', marginTop: 8 }}>Tip: keep procedures short and numbered so they are easy to follow.</p>
    </div>
  )
}

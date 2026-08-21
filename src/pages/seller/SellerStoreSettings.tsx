import { useState } from 'react'
import { updateSeller, type Seller } from '../../services/marketplaceService'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Textarea, PageHeader, SectionCard } from '../../components/ui'
import { toast } from '../../components/ui'
import { Save } from 'lucide-react'

interface Props {
  store: Seller
  onSaved: () => void
}

export default function SellerStoreSettings({ store, onSaved }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    business_name: store.business_name || '',
    description: store.description || '',
    location: store.location || '',
    category: store.category || '',
    owner_phone: store.owner_phone || '',
    payment_method: store.payment_method || '',
    payment_reference: store.payment_reference || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      const ok = await updateSeller(store.id, {
        business_name: form.business_name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        category: form.category.trim(),
        owner_phone: form.owner_phone.trim(),
        payment_method: form.payment_method.trim(),
        payment_reference: form.payment_reference.trim(),
      })
      if (!ok) throw new Error('Could not save settings.')
      toast('Store settings saved successfully!', 'success')
      onSaved()
    } catch (err: any) {
      toast(err.message || 'Could not save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Store Settings"
        subtitle="Update your store details and payout information."
      />

      <SectionCard title="">
        <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 760 }}>
          <Input label="Business Name" required value={form.business_name} onChange={e => set('business_name', e.target.value)} />
          <Input label="Store Category" value={form.category} placeholder="e.g. Fashion, Electronics" onChange={e => set('category', e.target.value)} />
          <Input label="Location" value={form.location} placeholder="e.g. Tamale, Ghana" onChange={e => set('location', e.target.value)} />
          <Input label="Owner Phone" type="tel" value={form.owner_phone} placeholder="For payout contact" onChange={e => set('owner_phone', e.target.value)} />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea label="Description" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <Button type="submit" variant="primary" icon={<Save size={15} />} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Payout details tell the admin how to settle your earnings.</span>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}

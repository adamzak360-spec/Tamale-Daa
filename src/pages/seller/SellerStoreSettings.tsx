import { useState } from 'react'
import { updateSeller, type Seller } from '../../services/marketplaceService'
import { useAuth } from '../../context/AuthContext'

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
  const [notice, setNotice] = useState('')

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
      if (!ok) throw new Error("Could not save settings.")
      setNotice('Store settings saved successfully!')
      onSaved()
    } catch (err: any) {
      setNotice(err.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, name: keyof typeof form, type = 'text', placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{label}</label>
      <input
        type={type}
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        style={{ padding: 9, border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}
      />
    </div>
  )

  return (
    <div className="store-settings-content">
      <div className="view-header-row">
        <div>
          <h3 className="section-title">Store Settings</h3>
          <p className="section-subtitle">Update your store details and payout information.</p>
        </div>
      </div>

      {notice && (
        <div className={`notification ${notice.includes('successfully') ? 'success' : 'error'}`}>
          <span>{notice}</span>
          <button onClick={() => setNotice('')}>&times;</button>
        </div>
      )}

      <form onSubmit={save} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 760 }}>
        {field('Business Name', 'business_name')}
        {field('Store Category', 'category', 'text', 'e.g. Fashion, Electronics')}
        {field('Location', 'location', 'text', 'e.g. Tamale, Ghana')}
        {field('Owner Phone', 'owner_phone', 'tel', 'For payout contact')}
        {field('Description', 'description')}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Payout details tell the admin how to settle your earnings.</span>
        </div>
      </form>
    </div>
  )
}

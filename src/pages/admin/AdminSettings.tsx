import { useEffect, useState } from 'react'
import { getSiteSettings, upsertSiteSetting } from '../../services/marketplaceService'

type Tab = 'marketplace' | 'store' | 'delivery'

const KEYS = {
  marketplace_name: '',
  currency: '',
  supported_countries: '',
  about_text: '',
  contact_email: '',
  contact_phone: '',
  social_whatsapp: '',
  social_instagram: '',
  social_facebook: '',
  delivery_info: '',
  delivery_fee_tamale: '',
  delivery_fee_greater_accra: '',
  delivery_fee_lesser_accra: '',
  delivery_fee_dhl: '',
  delivery_fee_ups: '',
  delivery_fee_fedex: '',
}

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('marketplace')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setSettings({ ...KEYS, ...(await getSiteSettings()) })
    setLoading(false)
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 3000)
  }

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const save = async (key: string) => {
    setSaving(true)
    const ok = await upsertSiteSetting(key, settings[key])
    setSaving(false)
    showNotice(ok ? `${key.replace(/_/g, ' ')} saved.` : 'Could not save.')
  }

  const input = (key: string, placeholder: string, type = 'text') => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <input
        type={type}
        value={settings[key] || ''}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 8 }}
      />
      <button onClick={() => save(key)} className="btn-edit" disabled={saving} style={{ backgroundColor: '#2563eb' }}>Save</button>
    </div>
  )

  const textarea = (key: string, placeholder: string) => (
    <div>
      <textarea
        rows={4}
        value={settings[key] || ''}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={{ width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 8, resize: 'vertical' }}
      />
      <button onClick={() => save(key)} className="btn-edit" disabled={saving} style={{ backgroundColor: '#2563eb', marginTop: 8 }}>Save</button>
    </div>
  )

  const section = (title: string, items: React.ReactNode) => (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ marginBottom: 10 }}>{title}</h4>
      <div style={{ display: 'grid', gap: 12 }}>{items}</div>
    </div>
  )

  return (
    <div className="settings-content">
      {notice && <div className={`notification ${notice.includes('Could not') ? 'error' : 'success'}`}><span>{notice}</span></div>}
      <div className="view-header-row">
        <h3 className="section-title">Marketplace Settings</h3>
        <p className="section-subtitle">Control your store's identity, contact details, and delivery fees.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['marketplace', 'Marketplace'], ['store', 'Store & Contact'], ['delivery', 'Delivery']] as [Tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="btn-edit" style={{ backgroundColor: tab === key ? '#1e3a8a' : '#f3f4f6', color: tab === key ? '#fff' : '#111827' }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><h3>Loading settings...</h3></div>
      ) : (
        <>
          {tab === 'marketplace' && (
            <>
              {section('Identity', <>
                {input('marketplace_name', 'e.g. Tamale Daa')}
                {input('currency', 'e.g. GHS')}
                {input('supported_countries', 'e.g. Ghana, Nigeria, Togo, Benin')}
              </>) }
              {section('About the Marketplace', textarea('about_text', 'A short description of what Tamale Daa is and what you sell.'))}
            </>
          )}
          {tab === 'store' && (
            <>
              {section('Contact Details', <>
                {input('contact_email', 'e.g. info@tamaledaa.com', 'email')}
                {input('contact_phone', 'e.g. +233 53 855 7781')}
              </>) }
              {section('Social Links', <>
                {input('social_whatsapp', 'e.g. https://wa.me/233203355542')}
                {input('social_instagram', 'e.g. https://instagram.com/tamaledaa')}
                {input('social_facebook', 'e.g. https://facebook.com/tamaledaa')}
              </>) }
            </>
          )}
          {tab === 'delivery' && (
            <>
              {section('Delivery Information (shown to customers)', textarea('delivery_info', 'Explain how delivery works, timelines, and coverage.'))}
              {section('Delivery Fees (GHS)', <>
                {input('delivery_fee_tamale', 'Tamale zone fee', 'number')}
                {input('delivery_fee_greater_accra', 'Greater Accra fee', 'number')}
                {input('delivery_fee_lesser_accra', 'Lesser Accra fee', 'number')}
                {input('delivery_fee_dhl', 'DHL fee', 'number')}
                {input('delivery_fee_ups', 'UPS fee', 'number')}
                {input('delivery_fee_fedex', 'FedEx fee', 'number')}
              </>) }
            </>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getSiteSettings, upsertSiteSetting } from '../../services/marketplaceService'
import { Button, Input, Textarea, PageHeader, SkeletonTable } from '../../components/ui'
import { toast } from '../../components/ui'

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
  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    setSettings({ ...KEYS, ...(await getSiteSettings()) })
    setLoading(false)
  }

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const save = async (key: string) => {
    setSaving(true)
    const ok = await upsertSiteSetting(key, settings[key])
    setSaving(false)
    toast(ok ? `${key.replace(/_/g, ' ')} saved.` : 'Could not save.', ok ? 'success' : 'error')
  }

  const input = (key: string, placeholder: string, type = 'text') => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Input
        type={type}
        value={settings[key] || ''}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={{ flex: 1 }}
      />
      <Button variant="primary" size="sm" onClick={() => save(key)} disabled={saving} style={{ height: 44 }}>{saving ? 'Saving…' : 'Save'}</Button>
    </div>
  )

  const textarea = (key: string, placeholder: string) => (
    <div>
      <Textarea
        rows={4}
        value={settings[key] || ''}
        placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
      />
      <Button variant="primary" size="sm" onClick={() => save(key)} disabled={saving} style={{ marginTop: 8 }}>{saving ? 'Saving…' : 'Save'}</Button>
    </div>
  )

  const section = (title: string, items: React.ReactNode) => (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ marginBottom: 10 }}>{title}</h4>
      <div style={{ display: 'grid', gap: 12 }}>{items}</div>
    </div>
  )

  return (
    <div className="page-content">
      <PageHeader
        title="Marketplace Settings"
        subtitle="Control your store's identity, contact details, and delivery fees."
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {([['marketplace', 'Marketplace'], ['store', 'Store & Contact'], ['delivery', 'Delivery']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="btn"
            style={{
              backgroundColor: tab === key ? 'var(--color-navy)' : '#fff',
              color: tab === key ? '#fff' : 'var(--color-navy)',
              borderColor: tab === key ? 'var(--color-navy)' : 'var(--color-border)',
              fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={3} />
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

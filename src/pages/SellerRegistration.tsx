import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createSeller } from '../services/marketplaceService'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export default function SellerRegistration() {
  const { user, isLoading: authLoading } = useAuth()
    const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    owner_phone: '',
    description: '',
    location: '',
    category: '',
    payment_method: '',
    payment_reference: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  if (authLoading) return null

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!user || !isSupabaseConfigured) {
      setError('Please log in first, then come back to apply as a seller.')
      return
    }
    if (!form.business_name.trim()) { setError('Business name is required.'); return }
    if (!form.owner_name.trim()) { setError('Your name is required.'); return }

    setSubmitting(true)
    try {
      const existing = await createSeller({
        user_id: user.id,
        business_name: form.business_name.trim(),
        slug: slugify(form.business_name.trim()) + '-' + Date.now().toString(36),
        owner_name: form.owner_name.trim(),
        owner_email: user.email,
        owner_phone: form.owner_phone.trim() || null,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        payment_method: form.payment_method.trim() || null,
        payment_reference: form.payment_reference.trim() || null,
        status: 'pending',
      })
      if (!existing) throw new Error('Could not submit application.')

      // Set metadata so the app can recognize the user as a seller
      await (supabase as NonNullable<typeof supabase>).auth.updateUser({ data: { seller_status: 'pending', business_name: form.business_name.trim() } })

      setDone('Application submitted! The admin will review it and you will be notified once your store is approved.')
    } catch (err: any) {
      setError(err.message || 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (label: string, name: keyof typeof form, required = false, placeholder = '') => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input
        value={form[name]}
        onChange={e => set(name, e.target.value)}
        placeholder={placeholder}
        style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}
      />
    </div>
  )

  return (
    <div className="seller-register-page" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: 4 }}>Become a Seller on Tamale Daa</h2>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Open your own store and reach customers across the marketplace. Submit your details below — the admin reviews every application and notifies you once approved.
      </p>

      {!user && (
        <div className="notification error" style={{ marginBottom: 16 }}>
          <span>You must be logged in to apply. </span>
          <Link to="/login" style={{ color: '#fff', fontWeight: 600 }}>Log in</Link>
          <span> or </span>
          <Link to="/register" style={{ color: '#fff', fontWeight: 600 }}>create an account</Link>
          <span>, then return here.</span>
        </div>
      )}

      {done ? (
        <div className="notification success" style={{ marginBottom: 16 }}>
          <span>{done}</span>
        </div>
      ) : null}
      {error && (
        <div className="notification error" style={{ marginBottom: 16 }}>
          <span>{error}</span>
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, background: '#fff' }}>
        {field('Business / Store Name', 'business_name', true, 'e.g. Adama\'s Boutique')}
        {field('Category', 'category', false, 'e.g. Fashion, Electronics, Home & Kitchen')}
        {field('Your Full Name', 'owner_name', true)}
        {field('Phone Number', 'owner_phone', false, 'For payout contact')}
        <div style={{ gridColumn: '1 / -1' }}>{field('Location', 'location', false, 'e.g. Tamale, Northern Region')}</div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>About Your Business</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="What do you sell? What makes your store special?"
              style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 12 }}>
            <strong>Payout details</strong> — how you'd like to receive your settled earnings (kept private).
          </p>
        </div>
        {field('Payout Method', 'payment_method', false, 'e.g. Mobile Money, Bank Transfer')}
        {field('Payout Reference', 'payment_reference', false, 'e.g. Momo number or account number')}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8 }}>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Application'}</button>
          <Link to="/stores" style={{ color: '#2563eb', fontSize: '0.9rem' }}>Browse the Stores Directory</Link>
        </div>
      </form>
    </div>
  )
}

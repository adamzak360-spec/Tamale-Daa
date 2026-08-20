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
      if (!existing) throw new Error('The application could not be saved. Please make sure you are logged in, then try again. If it still fails, contact support.')

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
        style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }}
      />
    </div>
  )

  return (
    <div className="seller-register-page" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' }}>
      <h2 style={{ fontSize: '1.6rem', lineHeight: 1.25, marginBottom: 8, wordBreak: 'normal' }}>Become a Seller</h2>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
        Open your own store and reach customers across the marketplace. Submit your details below — the admin reviews every application and notifies you once approved.
      </p>

      {!user && (
        <div style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderLeft: '4px solid #ef4444',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: '0.9rem',
          color: '#b91c1c',
          boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 220px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            You must be logged in to apply.
          </span>
          <span style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link to="/login" style={{ background: '#ef4444', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', textDecoration: 'none' }}>Log in</Link>
            <Link to="/register" style={{ background: '#fff', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 600, borderRadius: 8, padding: '6px 14px', fontSize: '0.85rem', textDecoration: 'none' }}>Create account</Link>
          </span>
        </div>
      )}

      {done ? (
        <div style={{ marginBottom: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderLeft: '4px solid #16a34a', borderRadius: 10, padding: '12px 16px', fontSize: '0.9rem', color: '#15803d' }}>
          <span>{done}</span>
        </div>
      ) : null}
      {error && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 10, padding: '12px 16px', fontSize: '0.9rem', color: '#b91c1c' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&times;</button>
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 18px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
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
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 14 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: '1 1 auto',
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg,#1e3a8a,#2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 24px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                Submitting...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>
                Submit Application
              </>
            )}
          </button>
          <Link
            to="/stores"
            style={{
              flex: '1 1 200px',
              textAlign: 'center',
              background: '#f8fafc',
              color: '#1e3a8a',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              padding: '13px 18px',
              fontSize: '0.92rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            Browse the Stores Directory
          </Link>
        </div>
      </form>
    </div>
  )
}

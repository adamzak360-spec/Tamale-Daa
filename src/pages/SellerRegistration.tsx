import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

// Navy / Teal brand tokens
const NAVY = '#0B2F63'
const NAVY_GRAD = `linear-gradient(135deg, ${NAVY}, #12407f)`

// Payout methods with their per-method required fields (label shown to admin, JSON details stored)
const PAYOUT_METHODS: { id: string; label: string; fields: { key: string; label: string; placeholder: string }[] }[] = [
  {
    id: 'mobile_money',
    label: 'Mobile Money (MoMo)',
    fields: [
      { key: 'network', label: 'Mobile Network', placeholder: 'e.g. MTN, Telecel, AT' },
      { key: 'number', label: 'MoMo Number', placeholder: 'e.g. 024 000 0000' },
      { key: 'name', label: 'Account Name', placeholder: 'Registered name on the MoMo account' },
    ],
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    fields: [
      { key: 'bank', label: 'Bank Name', placeholder: 'e.g. GCB, Fidelity, Stanbic' },
      { key: 'account_number', label: 'Account Number', placeholder: 'e.g. 1234567890' },
      { key: 'account_name', label: 'Account Name', placeholder: 'Name on the bank account' },
    ],
  },
  {
    id: 'paypal',
    label: 'PayPal',
    fields: [
      { key: 'email', label: 'PayPal Email', placeholder: 'e.g. name@example.com' },
    ],
  },
  {
    id: 'card',
    label: 'Card (Visa / Mastercard)',
    fields: [
      { key: 'card_number', label: 'Card Number', placeholder: 'e.g. 4111 1111 1111 1111' },
      { key: 'cardholder_name', label: 'Cardholder Name', placeholder: 'Name printed on the card' },
      { key: 'expiry', label: 'Expiry Date', placeholder: 'e.g. 12/28 (MM/YY)' },
    ],
  },
  {
    id: 'cash_pickup',
    label: 'Cash / Office Pickup',
    fields: [
      { key: 'contact', label: 'Contact for Pickup', placeholder: 'Phone number to arrange pickup' },
    ],
  },
  {
    id: 'other',
    label: 'Other Method',
    fields: [
      { key: 'method', label: 'Method Name', placeholder: 'e.g. Western Union, Crypto wallet' },
      { key: 'reference', label: 'Reference Details', placeholder: 'Your receiving details for this method' },
    ],
  },
]

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const inputStyle: React.CSSProperties = { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box', minWidth: 0 }

// Stable (module-level) components so inputs never unmount on every keystroke.
// Defining them inside the render body caused the phone keyboard to disappear
// after each letter because React remounted the inputs and stole focus.
function FormField({ label, value, required, placeholder, onChange, type }: { label: string; value: string; required?: boolean; placeholder?: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function PayoutField({ field, value, onChange }: { field: { key: string; label: string; placeholder: string }; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
        {field.label}<span style={{ color: '#dc2626' }}> *</span>
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} style={inputStyle} />
    </div>
  )
}

export default function SellerRegistration() {
  const { user } = useAuth()
  const [myClaimable, setMyClaimable] = useState<{ id: string; business_name: string; status: string } | null>(null)

  // If the logged-in user has no store yet, try to claim a store that was
  // applied for with the same email (public applications have user_id = null).
  useEffect(() => {
    const client = supabase
    if (!user || !client) return
    let active = true
    ;(async () => {
      try {
        const { data } = await client
          .from('sellers')
          .select('id, business_name, status, user_id')
          .eq('owner_email', user.email as string)
          .in('status', ['pending', 'approved'])
          .order('created_at', { ascending: false })
          .limit(1)
        const found = (data || []).find(r => !r.user_id || r.user_id === user.id)
        if (active && found) setMyClaimable(found)
      } catch { /* ignore */ }
    })()
    return () => { active = false }
  }, [user])

  const claimStore = async () => {
    if (!myClaimable || !user || !supabase) return
    const client = supabase
    setSubmitting(true)
    try {
      const { error } = await client.from('sellers').update({ user_id: user.id }).eq('id', myClaimable.id)
      if (error) throw error
      await client.auth.updateUser({ data: { seller_status: myClaimable.status === 'approved' ? 'approved' : 'pending', business_name: myClaimable.business_name } })
      setSubmitting(false)
      if (myClaimable.status === 'approved') {
        window.location.href = '/seller'
      } else {
        window.location.reload()
      }
    } catch {
      setSubmitting(false)
      setError('Could not link your account to the store. Please try again.')
    }
  }
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    description: '',
    location: '',
    category: '',
    payment_method: '',
    payment_reference: '',
  })
  // Extra payout fields keyed by payment method (stored as JSON when submitting)
  const [payoutFields, setPayoutFields] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured || !supabase) {
      setError('The application service is not available right now. Please try again shortly.')
      return
    }
    if (!form.business_name.trim()) { setError('Business name is required.'); return }
    if (!form.owner_name.trim()) { setError('Your name is required.'); return }
    const email = (form.owner_email || (user?.email ?? '')).trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('A valid email address is required so we can notify you about your application.')
      return
    }
    if (!form.payment_method) { setError('Please choose a payout method.'); return }
    const method = PAYOUT_METHODS.find(m => m.id === form.payment_method)
    const payoutDetails: Record<string, string> = {}
    for (const f of method?.fields || []) {
      const v = (payoutFields[f.key] || '').trim()
      if (!v) { setError(`Payout detail "${f.label}" is required.`); return }
      payoutDetails[f.key] = v
    }

    setSubmitting(true)
    try {
      // Check for a recent duplicate application (same email or business name, pending)
      const { data: duplicates, error: dupErr } = await supabase
        .from('sellers')
        .select('id, status')
        .or(`owner_email.eq.${email},business_name.ilike.${form.business_name.trim()}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
      if (dupErr) throw dupErr
      const recent = duplicates?.[0]
      if (recent) {
        throw new Error(`You already have an application in review (${recent.id.slice(0, 8)}...). Please wait for the admin to approve it, or contact support if it has been waiting too long.`)
      }

      // Public anonymous application — stored as pending for admin approval.
      // An existing logged-in applicant automatically gets linked to their account.
      const payload: Record<string, unknown> = {
        user_id: user?.id ?? null,
        business_name: form.business_name.trim(),
        slug: slugify(form.business_name.trim()) + '-' + Date.now().toString(36),
        owner_name: form.owner_name.trim(),
        owner_email: email,
        owner_phone: form.owner_phone.trim() || null,
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        category: form.category.trim() || null,
        payment_method: method?.label || null,
        payment_reference: JSON.stringify(payoutDetails),
        status: 'pending',
      }

      const { data, error: insertErr } = await supabase
        .from('sellers')
        .insert(payload)
        .select('id')
        .single()
      if (insertErr || !data) {
        throw new Error(insertErr?.message || 'The application could not be saved. Please check your details and try again. If it still fails, contact support.')
      }

      // Link logged-in applicants so the app recognizes them as a seller
      if (user) {
        await supabase.auth.updateUser({ data: { seller_status: 'pending', business_name: form.business_name.trim() } })
      }

      setDone(form.business_name.trim())
    } catch (err: any) {
      setError(err.message || 'Could not submit application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="seller-register-page" style={{ maxWidth: 620, margin: '0 auto', padding: '48px 20px 72px' }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(11,47,99,0.10)', padding: '40px 28px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#00B8A9,#0f766e)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 6px 16px rgba(0,184,169,0.35)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', lineHeight: 1.25, marginBottom: 10, color: NAVY }}>Application Submitted!</h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 8 }}>
            Thank you, <strong>{form.owner_name.trim()}</strong>. Your store <strong>“{done}”</strong> has been sent for review.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 26 }}>
            The admin reviews every application carefully. You will be notified at <strong>{(form.owner_email || user?.email || '').trim()}</strong> as soon as your store is approved and your dashboard is activated.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{ background: NAVY_GRAD, color: '#fff', fontWeight: 600, borderRadius: 10, padding: '13px 22px', fontSize: '0.92rem', textDecoration: 'none', boxShadow: `0 4px 14px rgba(11,47,99,0.3)` }}>Back to Home</Link>
            <Link to="/stores" style={{ background: '#f8fafc', color: NAVY, border: '1px solid #cbd5e1', fontWeight: 600, borderRadius: 10, padding: '13px 22px', fontSize: '0.92rem', textDecoration: 'none' }}>Browse the Stores Directory</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="seller-register-page" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 60px' }}>
      <h2 style={{ fontSize: '1.6rem', lineHeight: 1.25, marginBottom: 8, wordBreak: 'normal', color: NAVY }}>Become a Seller</h2>
      <p style={{ color: '#6b7280', marginBottom: 24, fontSize: '0.95rem', lineHeight: 1.5 }}>
        Open your own store and reach customers across the marketplace. No account is needed to apply — submit your details below and the admin will review every application and notify you once your store is approved.
      </p>

      {user && myClaimable ? (
        <div style={{
          marginBottom: 16,
          background: '#eefbf9',
          border: '1px solid #99f6e4',
          borderLeft: '4px solid #00B8A9',
          borderRadius: 10,
          padding: '14px 16px',
          fontSize: '0.9rem',
          color: '#0f766e',
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>
            You already applied with this email — {myClaimable.status === 'approved' ? 'your store is approved!' : 'your application is under review.'}
          </p>
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#115e59' }}>
            {myClaimable.status === 'approved'
              ? `“${myClaimable.business_name}” is ready. Link it to your account to open your seller dashboard.`
              : `“${myClaimable.business_name}” will be linked to your account. You'll get dashboard access once it's approved.`}
          </p>
          <button
            onClick={claimStore}
            disabled={submitting}
            style={{
              background: submitting ? '#93c5fd' : 'linear-gradient(135deg,#00B8A9,#0f766e)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 3px 10px rgba(0,184,169,0.3)',
            }}
          >
            {submitting ? 'Linking…' : (myClaimable.status === 'approved' ? 'Open Seller Dashboard' : 'Link My Account')}
          </button>
        </div>
      ) : user ? (
        <div style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#eefbf9',
          border: '1px solid #99f6e4',
          borderLeft: '4px solid #00B8A9',
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: '0.88rem',
          color: '#0f766e',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B8A9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          You are logged in — your account will be linked to your new store automatically.
        </div>
      ) : null}

      {error && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 10, padding: '12px 16px', fontSize: '0.9rem', color: '#b91c1c' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>&times;</button>
        </div>
      )}

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 18px', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <FormField label="Business / Store Name" value={form.business_name} required onChange={v => set('business_name', v)} placeholder="e.g. Adama's Boutique" />
        <FormField label="Category" value={form.category} onChange={v => set('category', v)} placeholder="e.g. Fashion, Electronics, Home & Kitchen" />
        <FormField label="Your Full Name" value={form.owner_name} required onChange={v => set('owner_name', v)} />
        <FormField label="Email Address" type="email" value={form.owner_email || (user?.email ?? '')} required onChange={v => set('owner_email', v)} placeholder="For application updates and approval" />
        <FormField label="Phone Number" value={form.owner_phone} onChange={v => set('owner_phone', v)} placeholder="For payout contact" />
        <div style={{ gridColumn: '1 / -1' }}><FormField label="Location" value={form.location} onChange={v => set('location', v)} placeholder="e.g. Tamale, Northern Region" /></div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
            Payout Method<span style={{ color: '#dc2626' }}> *</span>
          </label>
          <select
            value={form.payment_method}
            onChange={e => { set('payment_method', e.target.value); setPayoutFields({}) }}
            style={{ ...inputStyle, background: '#fff' }}
          >
            <option value="">— Select payout method —</option>
            {PAYOUT_METHODS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        {form.payment_method ? (
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {(PAYOUT_METHODS.find(m => m.id === form.payment_method)?.fields || []).map(f => (
              <PayoutField key={f.key} field={f} value={payoutFields[f.key] || ''} onChange={v => setPayoutFields(prev => ({ ...prev, [f.key]: v }))} />
            ))}
          </div>
        ) : null}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 14 }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: '1 1 auto',
              background: submitting ? '#93c5fd' : NAVY_GRAD,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 24px',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: `0 4px 14px rgba(11,47,99,0.35)`,
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
              color: NAVY,
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

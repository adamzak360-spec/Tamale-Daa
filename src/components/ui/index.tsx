/* TAMALE DAA shared UI primitives — one consistent design language.
   Docx spec: teal primary buttons, navy headings, status badges,
   polished forms, modals, skeletons, empty/error states. */
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, FormEvent } from 'react'
import { useEffect, useState } from 'react'

/* ---------- Button ---------- */
type ButtonVariant = 'primary' | 'navy' | 'secondary' | 'outline' | 'danger' | 'danger-solid' | 'ghost' | 'icon'
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  as?: 'button' | 'a'
  href?: string
  icon?: ReactNode
}
export function Button({ variant = 'primary', size = 'md', className = '', icon, children, ...rest }: BtnProps) {
  const base = 'btn'
  const variantClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'navy' ? 'btn-navy' :
    variant === 'secondary' ? 'btn-secondary' :
    variant === 'outline' ? 'btn-outline' :
    variant === 'danger' ? 'btn-danger' :
    variant === 'danger-solid' ? 'btn-danger-solid' :
    variant === 'ghost' ? 'btn-ghost' : 'btn-icon'
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()} {...rest}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>{icon}</span>}
      {children}
    </button>
  )
}

/* ---------- Input ---------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
}
export function Input({ label, required, error, hint, id, ...rest }: InputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}{required && <span className="req"> *</span>}
        </label>
      )}
      <input id={inputId} className={`form-input ${error ? 'input-error' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} {...rest} />
      {error && <div id={`${inputId}-error`} className="form-error">{error}</div>}
      {hint && !error && <div id={`${inputId}-hint`} className="form-hint">{hint}</div>}
    </div>
  )
}

/* ---------- Select ---------- */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}
export function Select({ label, required, error, hint, id, children, ...rest }: SelectProps) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}{required && <span className="req"> *</span>}
        </label>
      )}
      <select id={selectId} className={`form-select ${error ? 'input-error' : ''}`} aria-invalid={!!error} {...rest}>
        {children}
      </select>
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  )
}

/* ---------- Textarea ---------- */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  required?: boolean
  error?: string
  hint?: string
}
export function Textarea({ label, required, error, hint, id, ...rest }: TextareaProps) {
  const taId = id || (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={taId} className="form-label">
          {label}{required && <span className="req"> *</span>}
        </label>
      )}
      <textarea id={taId} className={`form-textarea ${error ? 'input-error' : ''}`} aria-invalid={!!error} {...rest} />
      {error && <div className="form-error">{error}</div>}
      {hint && !error && <div className="form-hint">{hint}</div>}
    </div>
  )
}

/* ---------- Badge ---------- */
export type BadgeStatus = 'active' | 'pending' | 'approved' | 'rejected' | 'delivered' | 'processing' | 'cancelled' | 'out-of-stock' | 'low-stock' | 'verified' | 'suspended' | 'inactive' | 'completed' | 'paid' | 'in-transit' | 'shipped' | 'placed' | 'confirmed' | 'ready-for-pickup' | 'out-for-delivery' | 'failed' | 'refunded'
export function StatusBadge({ status, children }: { status: BadgeStatus; children: ReactNode }) {
  const cls = `status-${status}`
  return <span className={`status-badge ${cls}`}>{children}</span>
}

/* ---------- Section card ---------- */
export function SectionCard({ title, subtitle, actions, children, className = '' }: {
  title?: ReactNode; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', padding: '1rem 1.25rem 0.75rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

/* ---------- PageHeader ---------- */
export function PageHeader({ title, subtitle, actions, className = '' }: {
  title: ReactNode; subtitle?: string; actions?: ReactNode; className?: string
}) {
  return (
    <div className={`page-header ${className}`}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  )
}

/* ---------- EmptyState / ErrorState ---------- */
export function EmptyState({ title, message, icon, action }: {
  title: string; message: string; icon?: ReactNode; action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{message}</p>
      {action && <Button variant="primary" size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: {
  title?: string; message?: string; onRetry?: () => void
}) {
  return (
    <div className="error-state">
      <div className="empty-state-icon">⚠</div>
      <h3>{title}</h3>
      <p>{message || 'Something went wrong while loading. Please try again.'}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try Again</Button>}
    </div>
  )
}

/* ---------- LoadingSkeleton ---------- */
export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-img" />
      <div style={{ padding: '0.6rem 0.3rem 0.3rem' }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-btn" style={{ marginTop: '0.6rem' }} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, j) => <div key={j} className="skeleton" />)}
        </div>
      ))}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, actions, size = 'md' }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; actions?: ReactNode; size?: 'sm' | 'md' | 'lg'
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const maxW = size === 'sm' ? '380px' : size === 'lg' ? '640px' : '480px'
  return (
    <div className="modal-overlay" style={{ opacity: visible ? 1 : 0, transition: 'opacity var(--transition-normal)' }} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Dialog'}>
      <div className="modal-panel" style={{ maxWidth: maxW, transform: visible ? 'none' : 'translateY(14px)', transition: 'transform var(--transition-normal)' }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close" title="Close">✕</button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------- ConfirmDialog ---------- */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, busy = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; danger?: boolean; busy?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} actions={
      <>
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger-solid' : 'primary'} size="sm" onClick={onConfirm} disabled={busy}>{busy ? 'Please wait…' : confirmLabel}</Button>
      </>
    }>
      <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>{message}</p>
    </Modal>
  )
}

/* ---------- KPI ---------- */
export function KpiCard({ icon, iconBg, label, value, sub }: {
  icon: ReactNode; iconBg: string; label: string; value: string | number; sub?: string
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-icon" style={{ background: iconBg }}>{icon}</div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}{sub && <span style={{ marginLeft: '0.4rem', opacity: 0.75 }}>{sub}</span>}</div>
      </div>
    </div>
  )
}

/* ---------- Toast (lightweight replacement for ad-hoc alerts) ---------- */
let toastListener: ((msg: string, kind?: 'error' | 'success' | 'info') => void) | null = null
export function toast(msg: string, kind: 'error' | 'success' | 'info' = 'info') {
  toastListener?.(msg, kind)
}
export function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([])
  useEffect(() => {
    toastListener = (msg, kind = 'info') => {
      const id = Date.now() + Math.random()
      setItems((p) => [...p, { id, msg, kind }])
      setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 3600)
    }
    return () => { toastListener = null }
  }, [])
  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
      {items.map((t) => (
        <div key={t.id} className="card" style={{
          padding: '0.75rem 1rem', fontSize: '0.88rem', pointerEvents: 'auto', minWidth: '240px', maxWidth: '340px',
          borderLeft: `4px solid ${t.kind === 'error' ? 'var(--color-error)' : t.kind === 'success' ? 'var(--color-success)' : 'var(--color-teal)'}`,
          boxShadow: 'var(--shadow-md)',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ---------- SearchBar ---------- */
export function SearchBar({ value, onChange, placeholder = 'Search products, stores…', onSubmit }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onSubmit?: (e: FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} style={{ position: 'relative', flex: '1 1 auto', minWidth: 0 }}>
      <input
        className="form-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        style={{ minHeight: '46px', paddingLeft: '2.6rem', borderRadius: 'var(--radius-full)', background: '#fff' }}
      />
      <span aria-hidden style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>🔍</span>
    </form>
  )
}

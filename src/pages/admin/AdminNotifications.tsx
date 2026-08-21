import { useEffect, useState } from 'react'
import { getConversations, getConversationMessages, type ChatConversationRow } from '../../services/marketplaceService'
import { getAllProducts } from '../../services/productService'
import type { Product } from '../../types'
import { Button, PageHeader, SkeletonTable, EmptyState } from '../../components/ui'
import { toast } from '../../components/ui'
import { Send } from 'lucide-react'

export default function AdminNotifications() {
  const [conversations, setConversations] = useState<ChatConversationRow[]>([])
  const [products, setProducts] = useState<Record<string, Product>>({})
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ChatConversationRow | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const [convs, prods] = await Promise.all([getConversations(), getAllProducts()])
    setConversations(convs)
    const map: Record<string, Product> = {}
    for (const p of prods) map[p.id] = p
    setProducts(map)
    setLoading(false)
  }


  const openThread = async (c: ChatConversationRow) => {
    setSelected(c)
    setMessages(await getConversationMessages(c.id))
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSending(true)
    const { supabase } = await import('../../supabaseClient')
    const sb = supabase
    if (!sb) { toast('Not connected.', 'error'); setSending(false); return }
    const { error } = await sb.from('chat_messages').insert([{
      conversation_id: selected.id,
      sender: 'admin',
      content: reply.trim(),
    }])
    setSending(false)
    if (error) {
      toast('Could not send reply. Check the conversation policy for admin senders.', 'error')
      return
    }
    setReply('')
    setMessages(await getConversationMessages(selected.id))
    toast('Reply sent.', 'success')
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Customer Chats"
        subtitle={`Every conversation customers start from a product page appears here. ${conversations.length} conversation${conversations.length === 1 ? '' : 's'}.`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: 16, minHeight: 420 }}>
        {/* Thread list */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 520 }}>
          {loading ? (
            <SkeletonTable rows={4} cols={2} />
          ) : conversations.length === 0 ? (
            <EmptyState title="No conversations yet" message="Chats customers start from product pages appear here." />
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 520 }}>
              {conversations.map(c => {
                const product = c.product_id ? products[c.product_id] : null
                return (
                  <button
                    key={c.id}
                    onClick={() => openThread(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      background: selected?.id === c.id ? '#eff6ff' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.subject || product?.name || `Conversation #${c.id.slice(0, 6)}`}</div>
                    {product && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Re: {product.name}</div>}
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'No message yet'}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Thread view */}
        <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary, #9ca3af)' }}>
              <p>Select a conversation to read and reply.</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }}>
                {selected.subject || 'Customer conversation'}
                {selected.product_id && products[selected.product_id] && (
                  <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.8rem' }}> — {products[selected.product_id].name}</span>
                )}
              </div>
              <div style={{ flex: 1, padding: 14, overflowY: 'auto', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map(m => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start',
                      background: m.sender === 'admin' ? '#1e3a8a' : '#f3f4f6',
                      color: m.sender === 'admin' ? '#fff' : '#111827',
                      padding: '8px 12px',
                      borderRadius: 12,
                      maxWidth: '75%',
                      fontSize: '0.9rem',
                    }}
                  >
                    {m.content}
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>{new Date(m.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
                {messages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>No messages yet.</p>}
              </div>
              <div style={{ padding: 10, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendReply()}
                  placeholder="Type a reply to the customer..."
                  style={{ flex: 1 }}
                />
                <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={sendReply} disabled={sending}>{sending ? 'Sending...' : 'Send'}</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

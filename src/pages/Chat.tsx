import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getMyConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
  markMessagesRead,
  type ChatConversation,
  type ChatMessage,
} from '../services/chatService'
import { getProductById } from '../services/productService'
import type { Product } from '../types'
import { formatCurrency } from '../utils/currency'
import {
  MessageCircle,
  ArrowLeft,
  Send,
  Package,
  Image as ImageIcon,
} from 'lucide-react'

import './Chat.css'

export default function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productIdParam = searchParams.get('productId') || undefined

  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [active, setActive] = useState<ChatConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Customer name from auth metadata (falls back to email prefix)
  const customerName =
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.first_name as string) ||
    user?.email?.split('@')[0] ||
    'Customer'

  // Load customer conversations
  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = async () => {
      try {
        const convs = await getMyConversations(user.id)
        if (!cancelled) setConversations(convs)
        if (convs.length === 0 || productIdParam) {
          // Open (or create) a conversation for this product
          const conv = await getOrCreateConversation(user.id, customerName, productIdParam)
          if (!cancelled && conv) setActive(conv)
        } else {
          // Open the most recent conversation by default
          if (!cancelled && convs.length > 0) setActive(convs[0])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // When active conversation changes, load messages + product context
  useEffect(() => {
    if (!active) {
      setProduct(null)
      setMessages([])
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const [msgs, prod] = await Promise.all([
          getConversationMessages(active.id),
          active.product_id ? getProductById(active.product_id) : Promise.resolve(null),
        ])
        if (!cancelled) {
          setMessages(msgs)
          setProduct(prod)
        }
      } finally {
        if (!cancelled) markMessagesRead(active.id)
      }
    }
    load()

    // Poll for new messages every 5 seconds
    const poll = setInterval(() => {
      getConversationMessages(active.id).then((msgs) => {
        if (!cancelled) setMessages(msgs)
      })
    }, 5000)
    return () => { cancelled = true; clearInterval(poll) }
  }, [active?.id])

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length])

  const handleSend = async () => {
    if (!active || !user || !input.trim() || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const ok = await sendMessage(active.id, user.id, text, active.product_id || undefined)
      if (ok) {
        const msgs = await getConversationMessages(active.id)
        setMessages(msgs)
      } else {
        setError('Could not send the message. Please try again.')
        setInput(text)
      }
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="chat-page">
      <div className="chat-container container">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="chat-header-info">
            <h1 className="chat-title"><MessageCircle size={20} /> Chat</h1>
            <p className="chat-subtitle">You're chatting with <strong>Tamale Daa</strong></p>
          </div>
        </div>

        {/* Conversation list (mobile-first) */}
        {conversations.length > 1 && (
          <div className="chat-conversations">
            <h3 className="chat-convo-heading">Your conversations</h3>
            <div className="chat-convo-list">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  className={`chat-convo-item ${active?.id === c.id ? 'active' : ''}`}
                  onClick={() => setActive(c)}
                >
                  <Package size={16} />
                  <span>{c.product_id ? 'Product inquiry' : 'General chat'}</span>
                  <span className="chat-convo-date">{formatTime(c.last_message_at)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product context card */}
        {active && product && (
          <div className="chat-product-card">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} />
            ) : (
              <div className="chat-product-placeholder"><ImageIcon size={20} /></div>
            )}
            <div className="chat-product-info">
              <h4>Inquiring about: {product.name}</h4>
              <p>{formatCurrency(product.price)}</p>
            </div>
            <button className="chat-product-view" onClick={() => navigate(`/product/${product.id}`)}>
              View
            </button>
          </div>
        )}

        {/* Messages area */}
        <div className="chat-messages" ref={scrollRef}>
          {loading ? (
            <div className="chat-loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={36} />
              <p><strong>Start the conversation!</strong></p>
              <p>Ask Tamale Daa anything about {product ? product.name : 'our products'} — delivery, stock, payment, and more.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble-row ${m.sender_type === 'customer' ? 'mine' : 'theirs'}`}
              >
                {m.sender_type === 'admin' && (
                  <div className="chat-avatar" title="Tamale Daa">T</div>
                )}
                <div className="chat-bubble">
                  <p>{m.message}</p>
                  <span className="chat-time">{formatTime(m.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {error && <div className="chat-error">{error}</div>}

        {/* Composer */}
        {active && (
          <div className="chat-composer">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              placeholder="Type your message..."
              disabled={sending}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

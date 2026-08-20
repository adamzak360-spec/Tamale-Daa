import { supabase, isSupabaseConfigured } from '../supabaseClient'

// Tamale-Daa chat system (Stage 1 interaction):
// chat_conversations: id, customer_id, product_id, customer_name, admin, last_message_at, created_at
// chat_messages: id, conversation_id, sender_type ('customer'|'admin'), sender_id, product_id, message, read, created_at
// Tamale-Daa has no individual sellers; all chats go to the Tamale Daa store (admin).

export interface ChatConversation {
  id: string
  customer_id: string
  product_id: string | null
  customer_name: string | null
  admin: boolean
  last_message_at: string
  created_at: string
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'admin'
  sender_id: string
  product_id: string | null
  message: string
  read: boolean
  created_at: string
}


export async function getMyConversations(customerId: string): Promise<ChatConversation[]> {
  if (!isSupabaseConfigured || !supabase || !customerId) return []
  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('customer_id', customerId)
      .order('last_message_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('chat: fetch conversations failed', e)
    return []
  }
}

export async function getOrCreateConversation(
  customerId: string,
  customerName: string,
  productId?: string
): Promise<ChatConversation | null> {
  if (!isSupabaseConfigured || !supabase || !customerId) return null
  try {
    // Reuse existing conversation for the same product if present
    const base = supabase
      .from('chat_conversations')
      .select('*')
      .eq('customer_id', customerId)
    const query = productId
      ? base.eq('product_id', productId)
      : base.is('product_id', null)
    const { data } = await query.limit(1).single()
    if (data) return data as ChatConversation

    const { data: created, error } = await supabase
      .from('chat_conversations')
      .insert({
        customer_id: customerId,
        product_id: productId ?? null,
        customer_name: customerName,
      })
      .select()
      .single()
    if (error) throw error
    return created as ChatConversation
  } catch (e) {
    console.error('chat: get-or-create conversation failed', e)
    return null
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured || !supabase || !conversationId) return []
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('chat: fetch messages failed', e)
    return []
  }
}

export async function sendMessage(
  conversationId: string,
  customerId: string,
  message: string,
  productId?: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !conversationId || !message.trim()) return false
  try {
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      sender_id: customerId,
      product_id: productId ?? null,
      message: message.trim(),
    })
    if (error) throw error

    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
    return true
  } catch (e) {
    console.error('chat: send failed', e)
    return false
  }
}

/** Mark all non-customer messages in the conversation as read (viewed by customer). */
export async function markMessagesRead(conversationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !conversationId) return false
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'admin')
      .eq('read', false)
    if (error) throw error
    return true
  } catch (e) {
    console.error('chat: mark read failed', e)
    return false
  }
}

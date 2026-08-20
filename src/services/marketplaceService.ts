import { supabase } from '../supabaseClient'

const run = async <T>(fn: (sb: NonNullable<typeof supabase>) => Promise<T>, fallback: T): Promise<T> => {
  const sb = supabase
  if (!sb) {
    console.error('marketplaceService: Supabase not configured')
    return fallback
  }
  try {
    return await fn(sb)
  } catch (e) {
    console.error('marketplaceService error:', e)
    return fallback
  }
}

export interface Seller {
  id: string
  user_id: string | null
  business_name: string
  slug: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  description: string | null
  logo_url: string | null
  category: string | null
  location: string | null
  payment_method: string | null
  payment_reference: string | null
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  seller_id: string
  order_ids: string[]
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'failed'
  payment_method: string | null
  payment_reference: string | null
  paid_at: string | null
  created_at: string
}

export interface NewsUpdate {
  id: string
  title: string
  body: string
  image_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Promotion {
  id: string
  title: string
  description: string | null
  promo_code: string | null
  discount_type: 'percent' | 'fixed'
  discount_value: number
  start_at: string | null
  end_at: string | null
  is_active: boolean
  created_at: string
}

export interface AdBanner {
  id: string
  title: string
  image_url: string
  link_url: string | null
  position: 'homepage' | 'sidebar' | 'product'
  is_active: boolean
  created_at: string
}

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

// ---------------- SELLERS ----------------

export async function getSellers(): Promise<Seller[]> {
  return run(async (sb) => {
    const { data, error } = await sb.from('sellers').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as Seller[]
  }, [])
}

export async function getApprovedSellers(): Promise<Seller[]> {
  return run(async (sb) => {
    const { data, error } = await sb
      .from('sellers')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as Seller[]
  }, [])
}

export async function getSellerById(id: string): Promise<Seller | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('sellers').select('*').eq('id', id).single()
    if (error) throw error
    return data as Seller
  }, null)
}

export async function getMyStore(userId: string): Promise<Seller | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('sellers').select('*').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return (data as Seller) || null
  }, null)
}

export async function createSeller(store: Partial<Seller>): Promise<Seller | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('sellers').insert([{ ...store, status: 'pending' }]).select().single()
    if (error) throw error
    return data as Seller
  }, null)
}

export async function updateSeller(id: string, store: Partial<Seller>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('sellers').update(store).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function approveSeller(id: string): Promise<boolean> {
  return updateSeller(id, { status: 'approved' })
}

export async function rejectSeller(id: string, note?: string): Promise<boolean> {
  return updateSeller(id, { status: 'rejected', admin_note: note || null })
}

// ---------------- PAYOUTS ----------------

export async function getPayouts(): Promise<Payout[]> {
  return run(async (sb) => {
    const { data, error } = await sb.from('payouts').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as Payout[]
  }, [])
}

export async function createPayout(payout: Partial<Payout>): Promise<Payout | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('payouts').insert([payout]).select().single()
    if (error) throw error
    return data as Payout
  }, null)
}

export async function updatePayout(id: string, payout: Partial<Payout>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('payouts').update(payout).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function deletePayout(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('payouts').delete().eq('id', id)
    if (error) throw error
    return true
  }, false)
}

// ---------------- NEWS ----------------

export async function getNews(publishedOnly = false): Promise<NewsUpdate[]> {
  return run(async (sb) => {
    let q = sb.from('news_updates').select('*').order('created_at', { ascending: false })
    if (publishedOnly) q = q.eq('is_published', true)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as NewsUpdate[]
  }, [])
}

export async function createNews(news: Partial<NewsUpdate>): Promise<NewsUpdate | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('news_updates').insert([news]).select().single()
    if (error) throw error
    return data as NewsUpdate
  }, null)
}

export async function updateNews(id: string, news: Partial<NewsUpdate>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('news_updates').update({ ...news, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function deleteNews(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('news_updates').delete().eq('id', id)
    if (error) throw error
    return true
  }, false)
}

// ---------------- PROMOTIONS ----------------

export async function getPromotions(activeOnly = false): Promise<Promotion[]> {
  return run(async (sb) => {
    let q = sb.from('promotions').select('*').order('created_at', { ascending: false })
    if (activeOnly) q = q.eq('is_active', true)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as Promotion[]
  }, [])
}

export async function createPromotion(promo: Partial<Promotion>): Promise<Promotion | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('promotions').insert([promo]).select().single()
    if (error) throw error
    return data as Promotion
  }, null)
}

export async function updatePromotion(id: string, promo: Partial<Promotion>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('promotions').update(promo).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function deletePromotion(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('promotions').delete().eq('id', id)
    if (error) throw error
    return true
  }, false)
}

// ---------------- ADS ----------------

export async function getAds(activeOnly = false): Promise<AdBanner[]> {
  return run(async (sb) => {
    let q = sb.from('ad_banners').select('*').order('created_at', { ascending: false })
    if (activeOnly) q = q.eq('is_active', true)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as AdBanner[]
  }, [])
}

export async function createAd(ad: Partial<AdBanner>): Promise<AdBanner | null> {
  return run(async (sb) => {
    const { data, error } = await sb.from('ad_banners').insert([ad]).select().single()
    if (error) throw error
    return data as AdBanner
  }, null)
}

export async function updateAd(id: string, ad: Partial<AdBanner>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('ad_banners').update(ad).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function deleteAd(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('ad_banners').delete().eq('id', id)
    if (error) throw error
    return true
  }, false)
}

// ---------------- NOTIFICATIONS ----------------

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  return run(async (sb) => {
    const { data, error } = await sb
      .from('notifications_v2')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as NotificationItem[]
  }, [])
}

export async function markNotificationRead(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('notifications_v2').update({ is_read: true }).eq('id', id)
    if (error) throw error
    return true
  }, false)
}

export async function sendNotification(notif: Partial<NotificationItem>): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('notifications_v2').insert([notif])
    if (error) throw error
    return true
  }, false)
}

export async function deleteNotification(id: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('notifications_v2').delete().eq('id', id)
    if (error) throw error
    return true
  }, false)
}

// ---------------- SITE SETTINGS ----------------

export async function getSiteSettings(): Promise<Record<string, any>> {
  return run(async (sb) => {
    const { data, error } = await sb.from('site_settings').select('*')
    if (error) throw error
    const result: Record<string, any> = {}
    for (const row of data || []) {
      result[row.key] = row.value
    }
    return result
  }, {})
}

export async function upsertSiteSetting(key: string, value: any): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb
      .from('site_settings')
      .upsert({ key, value }, { onConflict: 'key' })
    if (error) throw error
    return true
  }, false)
}

// ---------------- SELLER PRODUCTS ----------------

export async function linkSellerProduct(sellerId: string, productId: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('seller_products').insert([{ seller_id: sellerId, product_id: productId }])
    if (error) throw error
    return true
  }, false)
}

export async function unlinkSellerProduct(sellerId: string, productId: string): Promise<boolean> {
  return run(async (sb) => {
    const { error } = await sb.from('seller_products').delete().eq('seller_id', sellerId).eq('product_id', productId)
    if (error) throw error
    return true
  }, false)
}

export async function getSellerProductIds(sellerId: string): Promise<string[]> {
  return run(async (sb) => {
    const { data, error } = await sb.from('seller_products').select('product_id').eq('seller_id', sellerId)
    if (error) throw error
    return (data || []).map((r: any) => r.product_id)
  }, [])
}

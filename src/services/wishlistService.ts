import { supabase, isSupabaseConfigured } from '../supabaseClient'

// Tamale-Daa wishlist table: id, user_id, product_id, created_at
// Operations require an authenticated customer session.

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase || !userId) return []
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', userId)
    if (error) throw error
    return (data || []).map((r: any) => r.product_id)
  } catch (e) {
    console.error('wishlist: failed to fetch', e)
    return []
  }
}

export async function addToWishlist(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId || !productId) return false
  try {
    const { error } = await supabase
      .from('wishlist')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
    if (error) throw error
    return true
  } catch (e) {
    console.error('wishlist: add failed', e)
    return false
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !userId || !productId) return false
  try {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
    if (error) throw error
    return true
  } catch (e) {
    console.error('wishlist: remove failed', e)
    return false
  }
}

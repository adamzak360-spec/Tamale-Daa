-- Tamale Daa production RLS hardening
-- Review and apply only to Supabase project obbwccldkvnoxtxmlraj.
-- This migration does not drop tables or delete data.

-- Admin helper avoids recursive policy checks on customer_profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Notifications: users can read and update only their own rows.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Self-notification RPC; system/service-role inserts continue to bypass RLS.
CREATE OR REPLACE FUNCTION public.create_self_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_order_id uuid DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  created public.notifications;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  INSERT INTO public.notifications (user_id, title, message, type, order_id)
  VALUES (auth.uid(), p_title, p_message, p_type, p_order_id)
  RETURNING * INTO created;
  RETURN created;
END;
$$;
REVOKE ALL ON FUNCTION public.create_self_notification(text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_self_notification(text, text, text, uuid) TO authenticated;

-- Products: public reads; admin-only writes. Enabling RLS makes the existing
-- admin policies effective instead of leaving the table open.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- Product variants: public reads; admins manage inventory.
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON public.product_variants;
CREATE POLICY "Variants are viewable by everyone"
  ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reviews: public reads; authenticated users manage only their own reviews.
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Enable live updates for client features that subscribe to these tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns whether the current authenticated user has the admin role in Tamale Daa.';
COMMENT ON FUNCTION public.create_self_notification(text, text, text, uuid) IS 'Creates an in-app notification only for the currently authenticated user.';

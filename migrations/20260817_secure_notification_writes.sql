-- Secure notification writes for Tamale Daa
-- Client code may create only a notification addressed to the current user.
-- Backend/service-role processes can still insert system notifications directly.

DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

CREATE OR REPLACE FUNCTION public.create_self_notification(
  p_title text,
  p_message text,
  p_type text DEFAULT 'info',
  p_order_id uuid DEFAULT NULL
)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.create_self_notification(text, text, text, uuid)
IS 'Creates an in-app notification only for the currently authenticated user.';

-- No INSERT policy is granted to authenticated users. Service-role/backend writes
-- bypass RLS and remain available for system-generated admin/seller notifications.

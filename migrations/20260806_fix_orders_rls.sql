-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies on orders
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow all users to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated update orders" ON public.orders;

-- Create comprehensive permissive policies for orders (allowing anon/public insert for checkout/POS and full access for admin/authenticated)
CREATE POLICY "Enable all access for orders" ON public.orders
    FOR ALL
    USING (true)
    With CHECK (true);

-- Also ensure suppliers and product_suppliers have open RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for suppliers" ON public.suppliers;
CREATE POLICY "Enable all access for suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for product_suppliers" ON public.product_suppliers;
CREATE POLICY "Enable all access for product_suppliers" ON public.product_suppliers FOR ALL USING (true) WITH CHECK (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

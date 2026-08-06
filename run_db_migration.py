import psycopg2
import socket

host_name = "db.obbwccldkvnoxtxmlraj.supabase.co"
ip_addr = socket.gethostbyname(host_name)
print(f"Resolved IPv4: {ip_addr}")

old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == host_name:
        return [(socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP, '', (ip_addr, port))]
    return old_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = new_getaddrinfo

passwords = ["Nasara1! 2", "Nasara1!2"]
conn = None
for pwd in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password=pwd,
            host=host_name,
            port=5432,
            sslmode="require"
        )
        print(f"Connected successfully with password: {pwd}")
        break
    except Exception as e:
        print(f"Failed with password {pwd}: {e}")

if conn:
    conn.autocommit = True
    cur = conn.cursor()
    
    sql = """
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;
    ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

    CREATE TABLE IF NOT EXISTS public.suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name TEXT NOT NULL,
        contact_person TEXT,
        phone_number TEXT,
        email_address TEXT,
        business_address TEXT,
        tax_id TEXT,
        notes TEXT,
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.product_suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
        supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Enable all access for suppliers" ON public.suppliers;
    CREATE POLICY "Enable all access for suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Enable all access for product_suppliers" ON public.product_suppliers;
    CREATE POLICY "Enable all access for product_suppliers" ON public.product_suppliers FOR ALL USING (true) WITH CHECK (true);

    NOTIFY pgrst, 'reload schema';
    """
    
    cur.execute(sql)
    print("Migration executed successfully and schema reloaded!")
    cur.close()
    conn.close()
else:
    print("Could not connect to database.")

import psycopg2

passwords = ["Nasara1!2", "Nasara1! 2"]
for pwd in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres", user="postgres", password=pwd,
            host="db.iwouhwizzwwykchgflyk.supabase.co", port=5432)
        cur = conn.cursor()
        print("CONNECTED")

        # Sellers table columns
        cur.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'sellers'
            ORDER BY ordinal_position;
        """)
        print("\n=== SELLERS COLUMNS ===")
        for r in cur.fetchall():
            print(r)

        # RLS enabled + policies on sellers
        cur.execute("""
            SELECT relname, relrowsecurity
            FROM pg_class WHERE relname = 'sellers';
        """)
        print("\n=== RLS ENABLED? ===")
        print(cur.fetchall())

        cur.execute("""
            SELECT policyname, cmd, roles, qual::text, with_check::text
            FROM pg_policies WHERE tablename = 'sellers';
        """)
        print("\n=== SELLERS POLICIES ===")
        for r in cur.fetchall():
            print(r)
            print('---')

        # Check other seller-related tables
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema='public' AND table_name LIKE '%seller%';
        """)
        print("\n=== SELLER-RELATED TABLES ===")
        for r in cur.fetchall():
            print(r[0])

        # Count of sellers by status
        try:
            cur.execute("SELECT status, count(*) FROM sellers GROUP BY 1")
            print("\n=== SELLERS BY STATUS ===")
            for r in cur.fetchall():
                print(r)
            cur.execute("SELECT user_id, business_name, owner_email, status FROM sellers ORDER BY created_at DESC LIMIT 5")
            print("\n=== RECENT SELLERS ===")
            for r in cur.fetchall():
                print(r)
        except Exception as e:
            print("count err", e)
        cur.close(); conn.close(); break
    except Exception as e:
        print(f"Error with password: {e}")

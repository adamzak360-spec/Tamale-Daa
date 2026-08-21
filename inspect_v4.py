import socket, psycopg2

# Resolve to IPv4 explicitly
ip = socket.gethostbyname('db.iwouhwizzwwykchgflyk.supabase.co')
print('resolved:', ip)
for pwd in ['Nasara1!2', 'Nasara1! 2']:
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password=pwd, host=ip, port=5432)
        print('connected with', pwd)
        cur = conn.cursor()
        cur.execute("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sellers' ORDER BY ordinal_position""")
        print("\n=== SELLERS COLUMNS ===")
        for r in cur.fetchall(): print(r)
        cur.execute("""SELECT relrowsecurity FROM pg_class WHERE relname='sellers'""")
        print("\nRLS:", cur.fetchall())
        cur.execute("""SELECT policyname, cmd, roles, qual::text, with_check::text FROM pg_policies WHERE tablename='sellers'""")
        print("\n=== POLICIES ===")
        for r in cur.fetchall():
            print(r); print('---')
        cur.execute("""SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%seller%'""")
        print("\n=== SELLER TABLES ===")
        for r in cur.fetchall(): print(r[0])
        try:
            cur.execute("SELECT status, count(*) FROM sellers GROUP BY 1")
            print("\nBY STATUS:", cur.fetchall())
            cur.execute("SELECT id, user_id, business_name, owner_email, status FROM sellers ORDER BY created_at DESC LIMIT 5")
            print("\nRECENT:", cur.fetchall())
        except Exception as e:
            print("count err", e)
        conn.close()
        break
    except Exception as e:
        print('err', e)

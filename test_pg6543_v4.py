import socket

_orig = socket.getaddrinfo
def v4only(*a, **kw):
    results = _orig(*a, **kw)
    ipv4 = [r for r in results if r[0] == socket.AF_INET]
    return ipv4 if ipv4 else results
socket.getaddrinfo = v4only

import psycopg2

for pwd in ['Nasara1!2', 'Nasara1! 2']:
    try:
        conn = psycopg2.connect(
            dbname="postgres", user="postgres", password=pwd,
            host="db.iwouhwizzwwykchgflyk.supabase.co", port=6543,
            connect_timeout=10)
        print('CONNECTED on 6543 with', pwd)
        cur = conn.cursor()
        cur.execute("SELECT 1")
        print('query ok')
        cur.execute("""SELECT policyname, cmd, roles, qual::text, with_check::text FROM pg_policies WHERE tablename='sellers'""")
        print("\n=== SELLERS POLICIES ===")
        for r in cur.fetchall():
            print(r); print('---')
        cur.execute("""SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%seller%'""")
        print("\n=== SELLER TABLES ===")
        for r in cur.fetchall(): print(r[0])
        cur.execute("""SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sellers' ORDER BY ordinal_position""")
        print("\n=== COLUMNS ===")
        for r in cur.fetchall(): print(r)
        conn.close()
        break
    except Exception as e:
        print('err with', pwd, ':', str(e)[:250])

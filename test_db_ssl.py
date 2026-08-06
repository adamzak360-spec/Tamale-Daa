import psycopg2

passwords = ["Nasara1!2", "Nasara1! 2"]
for pwd in passwords:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres.obbwccldkvnoxtxmlraj",
            password=pwd,
            host="aws-0-us-west-1.pooler.supabase.com",
            port=5432,
            sslmode="require",
            connect_timeout=5
        )
        print(f"Success with pooler & password: {pwd}")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Version:", cur.fetchone())
        conn.close()
        break
    except Exception as e:
        print(f"Failed with pooler {pwd}: {e}")

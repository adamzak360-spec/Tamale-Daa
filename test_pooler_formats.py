import psycopg2

users = ["postgres", "postgres.obbwccldkvnoxtxmlraj", "postgres:obbwccldkvnoxtxmlraj"]
for u in users:
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=u,
            password="Nasara1!2",
            host="aws-0-us-west-1.pooler.supabase.com",
            port=6543,
            sslmode="require",
            connect_timeout=5
        )
        print(f"Success with user {u}!")
        conn.close()
        break
    except Exception as e:
        print(f"Failed with user {u}: {e}")

import psycopg2

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="Nasara1!2",
        host="db.obbwccldkvnoxtxmlraj.supabase.co",
        port=5432,
        sslmode="require"
    )
    print("Connected to postgres directly!")
except Exception as e:
    print("Direct connection error:", e)

import psycopg2
import socket

host = "db.obbwccldkvnoxtxmlraj.supabase.co"
try:
    infos = socket.getaddrinfo(host, 5432, socket.AF_INET, socket.SOCK_STREAM)
    ip = infos[0][4][0]
    print(f"Resolved {host} to IPv4: {ip}")
except Exception as e:
    print("DNS resolution failed:", e)
    ip = host

try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="Nasara1!2",
        host=ip,
        port="5432",
        sslmode="require"
    )
    cur = conn.cursor()
    
    with open("migrations/20260806_fix_orders_suppliers.sql", "r") as f:
        sql = f.read()
        
    print("Executing migration SQL...")
    cur.execute(sql)
    conn.commit()
    print("Migration executed successfully via psycopg2!")
    
    cur.close()
    conn.close()
except Exception as e:
    print("Migration error:", e)

from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

for table in ["orders", "suppliers", "purchase_orders", "supplier_payments", "supplier_products"]:
    try:
        res = supabase.from_(table).select("*").limit(1).execute()
        print(f"Table '{table}' exists. Columns:", list(res.data[0].keys()) if res.data else "Table exists, no rows")
    except Exception as e:
        print(f"Table '{table}' error / missing:", e)

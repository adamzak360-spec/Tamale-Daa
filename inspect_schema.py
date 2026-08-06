from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    # Get table info via postgrest select
    res = supabase.from_("products").select("*").limit(1).execute()
    print("Columns present in products table:", list(res.data[0].keys()) if res.data else "No rows, but query successful")
except Exception as e:
    print("Error:", e)

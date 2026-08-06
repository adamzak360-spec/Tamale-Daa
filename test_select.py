from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    res = supabase.table("orders").select("*").limit(1).execute()
    print("Select success:", res)
except Exception as e:
    print("Select error:", e)

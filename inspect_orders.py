from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    res = supabase.from_("orders").select("*").limit(1).execute()
    print("Orders columns present:", list(res.data[0].keys()) if res.data else "Table empty")
except Exception as e:
    print("Error:", e)

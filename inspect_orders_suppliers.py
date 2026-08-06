from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

print("--- Inspecting orders table ---")
try:
    res = supabase.from_("orders").select("*").limit(1).execute()
    print("Orders columns:", list(res.data[0].keys()) if res.data else "No rows")
except Exception as e:
    print("Orders error:", e)

print("--- Inspecting suppliers table ---")
try:
    res = supabase.from_("suppliers").select("*").limit(1).execute()
    print("Suppliers columns:", list(res.data[0].keys()) if res.data else "No rows")
except Exception as e:
    print("Suppliers error:", e)

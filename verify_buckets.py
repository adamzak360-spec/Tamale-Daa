from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

print("Checking buckets...")
try:
    buckets = supabase.storage.list_buckets()
    print("Buckets found:", [b.name for b in buckets])
except Exception as e:
    print("Error listing buckets:", e)

print("Checking products table columns / insert...")
try:
    res = supabase.from_("products").select("specifications").limit(1).execute()
    print("Specifications column check success:", res.data)
except Exception as e:
    print("Specifications column check error:", e)

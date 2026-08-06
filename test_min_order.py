from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    res = supabase.table("orders").insert({"customer_name": "Test Customer"}).execute()
    print("Success:", res)
except Exception as e:
    print("Error:", e)

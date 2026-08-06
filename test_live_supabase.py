from supabase import create_client
import json

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

print("1. Testing connection by listing products...")
try:
    res = supabase.from_("products").select("id, name").limit(5).execute()
    print("Products query success:", res.data)
except Exception as e:
    print("Products query error:", e)

print("\n2. Testing storage buckets list...")
try:
    buckets = supabase.storage.list_buckets()
    print("Buckets:", [b.name for b in buckets])
except Exception as e:
    print("Buckets error:", e)

print("\n3. Testing product insert with specifications...")
try:
    new_product = {
        "name": "Test Product Automated",
        "description": "Testing dynamic specifications and video upload",
        "price": 100.0,
        "category": "Test",
        "stock_quantity": 10,
        "status": "active",
        "image_url": "https://example.com/image.jpg",
        "gallery_urls": [],
        "video_urls": [],
        "specifications": {"Material": "Cotton", "Warranty": "1 Year"}
    }
    res = supabase.from_("products").insert(new_product).execute()
    print("Product insert success:", res.data)
    created_id = res.data[0]['id']
    
    # Clean up test product
    supabase.from_("products").delete().eq("id", created_id).execute()
    print("Cleanup success.")
except Exception as e:
    print("Product insert error:", e)

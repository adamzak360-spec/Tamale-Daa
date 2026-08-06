from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

for bucket in ["product-images", "product-videos"]:
    try:
        res = supabase.storage.create_bucket(bucket, {"public": True})
        print(f"Bucket {bucket} created:", res)
    except Exception as e:
        print(f"Bucket {bucket} error:", e)

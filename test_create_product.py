from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    supabase.auth.sign_in_with_password({
        "email": "adamzak360@gmail.com",
        "password": "Nasara1!2"
    })
    
    product_data = {
        "name": "Test Product with Specs",
        "description": "Testing dynamic specifications",
        "price": 150.0,
        "category": "Electronics",
        "image": "https://obbwccldkvnoxtxmlraj.supabase.co/storage/v1/object/public/product-images/test.jpg",
        "video_url": "https://obbwccldkvnoxtxmlraj.supabase.co/storage/v1/object/public/product-videos/test.mp4",
        "stock": 10,
        "specifications": {
            "Brand": "Tamale Daa",
            "Weight": "1.5 kg",
            "Warranty": "1 Year",
            "Material": "Aluminum"
        }
    }
    
    res = supabase.from_("products").insert(product_data).execute()
    print("Product insert result:", res.data)
except Exception as e:
    print("Product insert error:", e)

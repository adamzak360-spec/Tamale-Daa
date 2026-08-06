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
        "name": "Live Test Product",
        "description": "Testing live admin form payload",
        "price": 200.0,
        "category": "Electronics",
        "stock_quantity": 15,
        "status": "active",
        "image_url": "https://obbwccldkvnoxtxmlraj.supabase.co/storage/v1/object/public/product-images/test.jpg",
        "gallery_urls": [],
        "video_urls": ["https://obbwccldkvnoxtxmlraj.supabase.co/storage/v1/object/public/product-videos/test.mp4"],
        "has_sizes": False,
        "delivery_fee_tamale": 10,
        "delivery_fee_greater_accra": 20,
        "delivery_fee_lesser_accra": 25,
        "delivery_fee_dhl": 50,
        "delivery_fee_ups": 45,
        "delivery_fee_fedex": 40,
        "specifications": {
            "Brand": "Tamale Daa",
            "Warranty": "1 Year"
        }
    }
    
    res = supabase.from_("products").insert(product_data).execute()
    print("Full insert success:", res.data)
except Exception as e:
    print("Full insert error:", e)

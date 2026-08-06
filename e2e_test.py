from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

print("1. Authenticating as admin...")
auth_res = supabase.auth.sign_in_with_password({
    "email": "adamzak360@gmail.com",
    "password": "Nasara1!2"
})
print("Authenticated successfully:", bool(auth_res.session))

print("2. Uploading test image to product-images...")
img_res = supabase.storage.from_("product-images").upload(f"e2e_test_{auth_res.user.id}.jpg", b"fakeimagedata", file_options={"content-type": "image/jpeg", "upsert": "true"})
print("Image upload response:", img_res)
img_url = supabase.storage.from_("product-images").get_public_url(f"e2e_test_{auth_res.user.id}.jpg")
print("Image public URL:", img_url)

print("3. Uploading test video to product-videos...")
vid_res = supabase.storage.from_("product-videos").upload(f"e2e_test_{auth_res.user.id}.mp4", b"fakevideodata", file_options={"content-type": "video/mp4", "upsert": "true"})
print("Video upload response:", vid_res)
vid_url = supabase.storage.from_("product-videos").get_public_url(f"e2e_test_{auth_res.user.id}.mp4")
print("Video public URL:", vid_url)

print("4. Creating product with dynamic specifications...")
product_data = {
    "name": "E2E Verified Product",
    "description": "Automated end-to-end verification test product",
    "price": 299.99,
    "category": "Electronics",
    "stock_quantity": 25,
    "status": "active",
    "image_url": img_url,
    "gallery_urls": [],
    "video_urls": [vid_url],
    "has_sizes": False,
    "delivery_fee_tamale": 15,
    "delivery_fee_greater_accra": 30,
    "delivery_fee_lesser_accra": 35,
    "delivery_fee_dhl": 60,
    "delivery_fee_ups": 55,
    "delivery_fee_fedex": 50,
    "specifications": {
        "Brand": "Tamale Daa Pro",
        "Material": "Carbon Fiber",
        "Warranty": "2 Years",
        "Weight": "0.8 kg"
    }
}

prod_res = supabase.from_("products").insert(product_data).execute()
print("Product inserted successfully:", prod_res.data[0]["id"])
print("Specifications saved:", prod_res.data[0]["specifications"])
print("ALL E2E TESTS PASSED SUCCESSFULLY!")

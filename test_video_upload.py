from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    supabase.auth.sign_in_with_password({
        "email": "adamzak360@gmail.com",
        "password": "Nasara1!2"
    })
    
    res = supabase.storage.from_("product-videos").upload("test.mp4", b"fakevideodata", file_options={"content-type": "video/mp4"})
    print("Video upload result:", res)
except Exception as e:
    print("Video upload error:", e)

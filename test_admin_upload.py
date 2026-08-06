from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

# Try signing in first
try:
    supabase.auth.sign_in_with_password({
        "email": "adamzak360@gmail.com",
        "password": "Nasara1!2"
    })
    print("Signed in successfully.")
except Exception as e:
    print("Sign in error:", e)

try:
    res = supabase.storage.from_("product-images").upload("test.jpg", b"fakeimagedata", file_options={"content-type": "image/jpeg"})
    print("Upload result:", res)
except Exception as e:
    print("Upload error:", e)

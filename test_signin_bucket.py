from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

for pwd in ["Nasara1!2", "Nasara1! 2"]:
    try:
        res = supabase.auth.sign_in_with_password({
            "email": "adamzak360@gmail.com",
            "password": pwd
        })
        print(f"Sign in success with {pwd}:", res.user.id)
        
        # Now try creating bucket
        try:
            b_res = supabase.storage.create_bucket("product-images", options={"public": True})
            print("Bucket created:", b_res)
        except Exception as be:
            print("Bucket creation error:", be)
            
        try:
            b_res2 = supabase.storage.create_bucket("product-videos", options={"public": True})
            print("Bucket 2 created:", b_res2)
        except Exception as be2:
            print("Bucket 2 creation error:", be2)
            
        break
    except Exception as e:
        print(f"Sign in failed with {pwd}: {e}")

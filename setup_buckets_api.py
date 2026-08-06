import requests

url = "https://obbwccldkvnoxtxmlraj.supabase.co/storage/v1/bucket"
headers = {
    "apikey": "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF",
    "Authorization": "Bearer sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF",
    "Content-Type": "application/json"
}

for bucket in ["product-images", "product-videos"]:
    data = {"id": bucket, "name": bucket, "public": True}
    res = requests.post(url, json=data, headers=headers)
    print(f"Bucket {bucket}: {res.status_code} {res.text}")

import os, requests
env = {}
for line in open('.env'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
url = env['VITE_SUPABASE_URL']
anon = env['VITE_SUPABASE_ANON_KEY']
H = {'apikey': anon, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
payload = {"business_name": "ANON-TEST-DELETE", "owner_name": "anon test", "owner_email": "anon-test-2@example.com", "owner_phone": "0000000000", "status": "pending"}
r = requests.post(f"{url}/rest/v1/sellers", headers=H, json=payload)
print("anon insert:", r.status_code, r.text[:300])

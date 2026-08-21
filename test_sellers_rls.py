import requests

env = {}
for line in open('/home/ubuntu/Tamale-Daa/.env'):
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
anon = env['VITE_SUPABASE_ANON_KEY']
url = env['VITE_SUPABASE_URL']

r = requests.post(
    url + '/auth/v1/token?grant_type=password',
    headers={'apikey': anon, 'Content-Type': 'application/json'},
    json={'email': 'adamzak360@gmail.com', 'password': 'Nasara1!2'},
)
print('signin status:', r.status_code, r.text[:300])
tok = r.json().get('access_token', '')
if not tok:
    raise SystemExit('no token')

r2 = requests.post(
    url + '/rest/v1/sellers',
    headers={'apikey': anon, 'Authorization': f'Bearer {tok}',
             'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    json={'business_name': '__probe__', 'slug': '__probe__', 'owner_email': 'probe@example.com', 'status': 'pending'},
)
print('insert as logged-in user:', r2.status_code, r2.text[:500])
if r2.status_code == 201:
    pid = r2.json()[0]['id']
    requests.delete(f'{url}/rest/v1/sellers?id=eq.{pid}', headers={'apikey': anon, 'Authorization': f'Bearer {tok}'})
    print('cleaned up probe row')

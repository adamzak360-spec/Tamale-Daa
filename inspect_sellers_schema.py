import os, json, requests

env = {}
for line in open('/home/ubuntu/Tamale-Daa/.env').read().splitlines():
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
URL = env['VITE_SUPABASE_URL']
anon = env['VITE_SUPABASE_ANON_KEY']

H = {
    'apikey': anon,
    'Authorization': f'Bearer {anon}',
    'Prefer': 'return=representation',
}

# List tables
r = requests.get(f'{URL}/rest/v1/', headers=H)
print('STATUS', r.status_code)
try:
    tables = r.json()
    print('TABLES:', [t.get('name') for t in tables])
    sellers = [t for t in tables if t.get('name') in ('sellers', 'seller_applications', 'seller_profiles', 'profiles')]
    for t in sellers:
        print('\nTABLE:', t.get('name'))
        print(json.dumps(t.get('columns', []), indent=2)[:4000])
except Exception as e:
    print('ERR', e, r.text[:500])

# Try RPC info
r2 = requests.get(f'{URL}/rest/v1/rpc/', headers=H)
try:
    print('\nRPC LIST:', [x.get('name') for x in r2.json()])
except Exception:
    print('rpc list failed')

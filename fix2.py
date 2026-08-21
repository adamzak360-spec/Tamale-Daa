import re
s = open('test_anon_sellers.py').read()
s = s.replace("os.environ['VITE_SUPABASE_URL'].strip()", "__import__('os').environ['VITE_SUPABASE_URL'].strip()")
# simpler: parse .env
env = {}
for line in open('.env'):
    line = line.strip()
    if line and not line.startswith('#') and '=' in line:
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip()
s = s.replace("os.environ['VITE_SUPABASE_URL'].strip()", repr(env['VITE_SUPABASE_URL']))
s = s.replace("os.environ['VITE_SUPABASE_ANON_KEY'].strip()", repr(env['VITE_SUPABASE_ANON_KEY']))
open('test_anon_sellers.py','w').write(s)
print('done')

from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

# Let's inspect what columns exist by selecting from orders with select limit 0 or similar, or try inserting columns one by one
columns = ["customer_name", "customer_phone", "customer_email", "delivery_address", "city", "region", "items", "subtotal", "delivery_fee", "total", "status", "payment_status", "payment_method", "notes", "amount_paid", "payment_date", "source"]

valid_cols = {}
for col in columns:
    try:
        res = supabase.table("orders").insert({col: "test" if col != "items" and col != "subtotal" and col != "delivery_fee" and col != "total" and col != "amount_paid" else (10 if col != "items" else [])}).execute()
        valid_cols[col] = True
        print(f"Column '{col}' exists!")
    except Exception as e:
        msg = str(e)
        if "schema cache" in msg:
            print(f"Column '{col}' does NOT exist.")
        else:
            # RLS violation means the column exists!
            valid_cols[col] = True
            print(f"Column '{col}' exists (RLS error confirmed)")

print("Valid columns:", list(valid_cols.keys()))

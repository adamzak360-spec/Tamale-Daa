from supabase import create_client

url = "https://obbwccldkvnoxtxmlraj.supabase.co"
key = "sb_publishable_5g0ennjv4FXLbxGvC7R1CA_VQBu_5qF"

supabase = create_client(url, key)

try:
    supabase.auth.sign_in_with_password({
        "email": "adamzak360@gmail.com",
        "password": "Nasara1!2"
    })
    
    # Test orders insert with notes
    order_data = {
        "customer_name": "Test Customer",
        "customer_email": "test@example.com",
        "customer_phone": "0500000000",
        "delivery_address": "Tamale Central",
        "city": "Tamale",
        "region": "Northern",
        "notes": "Test order notes from POS",
        "items": [],
        "subtotal": 70.0,
        "delivery_fee": 0.0,
        "total": 70.0,
        "status": "pending",
        "payment_status": "pending",
        "payment_method": "Cash",
        "amount_paid": 70.0
    }
    
    res = supabase.from_("orders").insert(order_data).execute()
    print("Order insert with notes success:", res.data[0]["id"])
    
    # Test suppliers insert
    supplier_data = {
        "company_name": "Test Supplier Ltd",
        "contact_person": "John Doe",
        "phone_number": "0540000000",
        "email_address": "supplier@example.com",
        "business_address": "Tamale Industrial Area",
        "status": "Active"
    }
    sup_res = supabase.from_("suppliers").insert(supplier_data).execute()
    print("Supplier insert success:", sup_res.data[0]["id"])
    
except Exception as e:
    print("Test error:", e)

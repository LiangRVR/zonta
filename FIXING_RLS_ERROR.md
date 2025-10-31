# Fixing RLS Error - Service Role Key Setup

## 🔴 The Problem

You're getting this error:
```
new row violates row-level security policy for table "orders"
```

**Why?** Your backend is using the **anon (public) key**, but your RLS policy requires the **service role key** to insert/update orders.

## ✅ The Solution

Use the Supabase **Service Role Key** in your backend instead of the anon key.

### Step 1: Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to: **Settings** → **API**
3. Find the **service_role** key (starts with `eyJhbGc...`)
4. ⚠️ **Important**: This key bypasses RLS - keep it secret, never expose in frontend!

### Step 2: Update Your `.env` File

Update your backend `.env` file with:

```env
# Supabase Configuration (Backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key_here
```

Remove or comment out the old variables:
```env
# NEXT_PUBLIC_SUPABASE_URL=...  (not needed for backend)
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...  (not needed for backend)
```

### Step 3: Restart Your Backend

```bash
cd backend
npm start
```

### Step 4: Test Again

Try creating an order again - it should work now!

## 🔍 What Changed

### Before (Using Anon Key)
```javascript
// ❌ Anon key = subject to RLS policies
const supabase = createClient(url, anonKey);
```

### After (Using Service Role Key)
```javascript
// ✅ Service role key = bypasses RLS
const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

## 🎯 Why This Works

Your RLS policy says:
```sql
CREATE POLICY "Service role can do anything on orders"
    ON orders FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
```

When you use the **service_role key**, Supabase recognizes the role and allows all operations on the orders table.

## 🔒 Security Notes

- ✅ **Service role key** should ONLY be used in backend code
- ✅ **Never** expose service role key in frontend code
- ✅ **Never** commit service role key to git (it's in `.gitignore`)
- ✅ Frontend should still use the anon key for reading products

## 📊 Expected Behavior After Fix

### Checkout Flow
```
1. Customer checks out
   ↓
2. Backend creates order using SERVICE ROLE KEY
   ✅ Order created (bypasses RLS)
   ↓
3. Webhook updates order using SERVICE ROLE KEY
   ✅ Order updated (bypasses RLS)
```

### Reading Orders
- Backend can read/write all orders (service role)
- Customers can only read their own orders (RLS policy enforced when using anon key)

## 🧪 Verify It's Working

After restarting backend with service role key:

1. Add items to cart
2. Complete checkout
3. Check logs - should see:
   ```
   Order created in Supabase for session: cs_test_...
   ✓ Order fulfilled successfully for session: cs_test_...
   ```
4. Check Supabase orders table - order should exist!

## 🆘 Still Having Issues?

### Check Environment Variables
```bash
cd backend
node -e "console.log(process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Service key set' : '✗ Service key missing')"
```

### Verify Service Role Key
- Should start with `eyJhbGc`
- Should be different from anon key
- Get it from: Supabase Dashboard → Settings → API → service_role

### Alternative: Simplify RLS (Not Recommended)

If you want to allow anon key to insert orders, you could update the policy:

```sql
-- Allow authenticated and anon to insert orders
CREATE POLICY "Anyone can insert orders"
    ON orders FOR INSERT
    WITH CHECK (true);
```

But this is **not recommended** because it doesn't validate the user. Use the service role key instead!

---

**After updating your `.env` file and restarting, the error should be gone!** 🚀

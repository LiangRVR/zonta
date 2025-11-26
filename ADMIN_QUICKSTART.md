# Admin Dashboard Quick Start 🚀

Get your admin dashboard up and running in 5 minutes!

## 📝 Prerequisites Checklist

Before you start, make sure you have:
- [ ] Existing Zonta e-commerce setup running
- [ ] Supabase project created
- [ ] Backend running (port 3000)
- [ ] Frontend served (port 5500 or similar)

## ⚡ 5-Minute Setup

### Step 1: Run Database Schema (2 minutes)

1. Open Supabase dashboard → SQL Editor
2. Copy contents of `backend/database/admin-schema.sql`
3. Paste and click **Run**
4. Wait for success message ✅

### Step 2: Create Admin User (1 minute)

**Option A: Create New User**
1. Supabase → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Copy the user's UUID

**Option B: Use Existing User**
1. Supabase → Authentication → Users
2. Find your user
3. Copy their UUID

**Assign Admin Role:**
```sql
-- Paste this in SQL Editor, replace YOUR_UUID
INSERT INTO user_roles (user_id, role_id)
SELECT 'YOUR_UUID_HERE'::UUID, id
FROM roles
WHERE name = 'admin';
```

### Step 3: Update Config (1 minute)

**Backend `.env`:**
```bash
# Add if missing
SUPABASE_ANON_KEY=your_anon_key
```

**Frontend `js/admin-auth.js` (lines 7-8):**
```javascript
const SUPABASE_URL = 'your_supabase_url';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

### Step 4: Restart Backend (30 seconds)

```bash
cd backend
npm run dev
# or pnpm dev
```

Check for admin routes at http://localhost:3000/

### Step 5: Access Dashboard (30 seconds)

1. Open browser: http://localhost:5500/admin/login.html
2. Login with admin credentials
3. You should see the dashboard! 🎉

## ✅ Verify Everything Works

### Quick Test Checklist

- [ ] Can login at `/admin/login.html`
- [ ] Redirects to `/admin/dashboard.html`
- [ ] Dashboard shows statistics
- [ ] Can navigate to Orders page
- [ ] Can navigate to Products page
- [ ] Can view order details
- [ ] Can create/edit products

## 🔧 Troubleshooting

### Can't Login?

**Error: "Access denied"**
```sql
-- Verify admin role:
SELECT u.email, r.name as role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'your_email@example.com';
```

**Error: "Invalid credentials"**
- Check email/password are correct
- Try resetting password in Supabase dashboard

### Dashboard Not Loading?

1. Check backend is running: `curl http://localhost:3000/health`
2. Check browser console for errors
3. Verify Supabase credentials in `admin-auth.js`

### API Errors?

1. Verify `.env` has `SUPABASE_ANON_KEY`
2. Check backend logs for errors
3. Try restarting backend

## 📚 Next Steps

### Test the Features

1. **Dashboard**:
   - View statistics
   - Check recent orders
   - Try refresh button

2. **Orders**:
   - View all orders
   - Click "View" on an order
   - Try updating order status
   - Test status filter

3. **Products**:
   - Click "Add Product"
   - Create a test product
   - Edit the product
   - Toggle active/inactive
   - Try the filter

### Add More Admins

```sql
-- For each new admin user:
INSERT INTO user_roles (user_id, role_id)
SELECT 'new_user_uuid'::UUID, id
FROM roles
WHERE name = 'admin';
```

### Customize

- **Colors**: Edit `frontend/css/admin.css`
- **Logo**: Update `admin-brand` in HTML files
- **Features**: See `ADMIN_FEATURES.md` for extension ideas

## 🎯 Common Tasks

### View All Admins
```sql
SELECT u.email, u.id, r.name as role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'admin';
```

### Remove Admin Access
```sql
DELETE FROM user_roles
WHERE user_id = 'user_uuid_here'
AND role_id = (SELECT id FROM roles WHERE name = 'admin');
```

### Check Order Counts
```sql
SELECT status, COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;
```

## 📖 Full Documentation

For complete documentation, see:

- **Setup Guide**: `ADMIN_SETUP.md` - Detailed setup instructions
- **Features**: `ADMIN_FEATURES.md` - Complete feature list
- **Main README**: `README.md` - Project overview

## 🆘 Still Having Issues?

1. **Check Logs**:
   - Backend console output
   - Browser console (F12)
   - Supabase logs

2. **Verify Environment**:
   ```bash
   # Backend
   cd backend
   cat .env | grep SUPABASE

   # Should show SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
   ```

3. **Test API**:
   ```bash
   # Health check
   curl http://localhost:3000/health

   # Should return: {"status":"OK","timestamp":"..."}
   ```

4. **Check Database**:
   ```sql
   -- Verify tables exist
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('roles', 'user_roles', 'orders');
   ```

## 🎉 Success!

If you've completed all the steps and the dashboard is working:

**Congratulations!** 🎊 Your admin dashboard is ready to use!

Next steps:
- Explore all features
- Add more admin users if needed
- Customize styling to your brand
- Start managing your orders and products

---

**Need help?** Check the troubleshooting section above or review the full documentation.

**Want more features?** See `ADMIN_FEATURES.md` for the roadmap and extension ideas.

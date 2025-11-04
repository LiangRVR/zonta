# Webhook Not Triggering - Troubleshooting Guide

## 🔴 Problem: Webhooks Not Being Received

Based on your logs, orders are being created but webhook events aren't being processed after payment completion.

## ✅ Solution: Start Stripe CLI Webhook Forwarding

### Quick Fix

**In a separate terminal window**, run:

```bash
cd /home/lrvr/Projects/zonta
./start-stripe-webhook.sh
```

Or manually:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You should see output like:
```
Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

### Critical Steps

1. **Copy the webhook secret** (`whsec_...`)

2. **Add it to your `.env` file**:
   ```bash
   cd backend
   nano .env  # or use your preferred editor
   ```

   Add or update:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_from_stripe_listen
   ```

3. **Restart your backend**:
   ```bash
   # Stop current backend (if using start-servers.sh)
   ./stop-servers.sh

   # Start again
   ./start-servers.sh
   ```

## 🔍 How to Verify It's Working

### Step 1: Check Stripe CLI is Running
You should see in the stripe listen terminal:
```
> Ready! Your webhook signing secret is whsec_...
```

### Step 2: Make a Test Purchase
1. Go to your shop: http://localhost:8000/pages/shop.html
2. Add items to cart
3. Complete checkout with: `4242 4242 4242 4242`
4. Watch the Stripe CLI terminal

### Step 3: You Should See Events
In the Stripe CLI terminal:
```
2025-11-02 12:34:56   --> payment_intent.created [evt_...]
2025-11-02 12:34:56  <--  [200] POST http://localhost:3000/api/stripe/webhook
2025-11-02 12:34:57   --> checkout.session.completed [evt_...]
2025-11-02 12:34:57  <--  [200] POST http://localhost:3000/api/stripe/webhook
```

### Step 4: Check Backend Logs
```bash
tail -f backend.log
```

You should see:
```
Event checkout.session.completed received for session: cs_test_...
Fulfilling Checkout Session cs_test_...
Retrieved session details: { ... }
Updating order with data: { ... }
✓ Order fulfilled successfully for session: cs_test_...
```

### Step 5: Verify in Supabase
Check your orders table - the order should have:
- ✅ `status`: "paid"
- ✅ `customer_name`: Filled in
- ✅ `shipping_address`: Filled in
- ✅ `paid_at`: Timestamp

## 🚨 Common Issues

### Issue 1: "No stripe-signature header"
**Problem**: Stripe CLI not running or not forwarding to correct port

**Solution**:
```bash
# Make sure stripe listen is running
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Issue 2: "Webhook signature verification failed"
**Problem**: Wrong webhook secret in `.env`

**Solution**:
- Get secret from `stripe listen` output
- Update `STRIPE_WEBHOOK_SECRET` in backend/.env
- Restart backend

### Issue 3: "Connection refused"
**Problem**: Backend not running on expected port

**Solution**:
```bash
# Check if backend is running
curl http://localhost:3000/health

# If not running, start it
cd /home/lrvr/Projects/zonta
./start-servers.sh
```

### Issue 4: Events showing in CLI but not in backend logs
**Problem**: Webhook endpoint not properly configured

**Solution**:
```bash
# Test the webhook endpoint directly
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Should return: "Webhook Error: No stripe-signature header"
# This confirms endpoint is working
```

## 📋 Complete Workflow

### Terminal 1: Backend Server
```bash
cd /home/lrvr/Projects/zonta
./start-servers.sh
```

### Terminal 2: Stripe Webhook Forwarding
```bash
cd /home/lrvr/Projects/zonta
./start-stripe-webhook.sh

# Or manually:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Terminal 3: Watch Logs (Optional)
```bash
cd /home/lrvr/Projects/zonta
tail -f backend.log
```

## 🎯 Production Setup (Later)

For production, you'll need to:

1. **Create webhook endpoint in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`

2. **Update production .env**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_from_dashboard
   ```

3. **No need for `stripe listen`** in production - Stripe sends webhooks directly to your server

## 🧪 Quick Test Command

Test if everything is set up correctly:

```bash
# 1. Check backend is running
curl http://localhost:3000/health

# 2. Check webhook endpoint exists
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}' 2>&1 | grep "Webhook Error"

# 3. Make sure stripe listen is running (in another terminal)
# You should see the CLI waiting for events

# 4. Try a test payment and watch the logs
```

## 💡 Why This Happens

**Local Development**: Stripe can't reach `localhost` from the internet, so you need the Stripe CLI to:
1. Listen to Stripe's webhooks on their servers
2. Forward them to your local backend

**Production**: Your server is publicly accessible, so Stripe sends webhooks directly.

---

**Quick Start Commands:**
```bash
# Terminal 1
./start-servers.sh

# Terminal 2
./start-stripe-webhook.sh
# Copy the whsec_... secret
# Add to backend/.env as STRIPE_WEBHOOK_SECRET
# Restart backend (Terminal 1)
```

That's it! Now webhooks should work. 🚀

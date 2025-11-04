# Stripe Integration Setup

This document describes how to set up and use Stripe payment integration in the Zonta Club of Naples shop.

## Prerequisites

- Node.js and npm installed
- Stripe account (sign up at https://stripe.com)
- Backend server running

## Setup Instructions

### 1. Install Dependencies

The Stripe package is already included in `package.json`:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Stripe API keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

3. Update the `.env` file with your Stripe secret key:
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   FRONTEND_URL=http://localhost:5500
   ```

   **Important**:
   - Use your **test mode** secret key (starts with `sk_test_`) for development
   - Use your **live mode** secret key (starts with `sk_live_`) for production
   - Never commit the `.env` file to version control

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server should start on `http://localhost:3000`

## How It Works

### Checkout Flow

1. **User adds items to cart** in the frontend shop
2. **User clicks "Proceed to Checkout"**
3. Frontend sends cart items to `/api/stripe/create-checkout-session`
4. Backend creates a Stripe Checkout Session with the cart items
5. Backend returns the Stripe Checkout URL
6. User is redirected to Stripe's hosted checkout page
7. User completes payment on Stripe
8. Stripe redirects to:
   - **Success page** (`/pages/success.html`) if payment succeeds
   - **Cancel page** (`/pages/cancel.html`) if user cancels

### API Endpoints

#### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Content-Type: application/json

{
  "items": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": 25.00,
      "quantity": 2,
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/c/pay/...",
  "sessionId": "cs_test_..."
}
```

#### Get Session Details
```
GET /api/stripe/session/:sessionId
```

Response:
```json
{
  "status": "paid",
  "customer_email": "customer@example.com",
  "amount_total": 50.00,
  "currency": "usd"
}
```

## Frontend Pages

### Success Page (`/pages/success.html`)
- Displays order confirmation
- Shows order details from Stripe session
- Accessed after successful payment

### Cancel Page (`/pages/cancel.html`)
- Shown when user cancels checkout
- Provides options to return to shop or home

## Testing

### Test Cards

Use Stripe's test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiration date, any 3-digit CVC, and any ZIP code.

### Test the Flow

1. Add products to cart in the shop
2. Enter a test email address
3. Click "Proceed to Checkout"
4. Use a test card number on Stripe checkout
5. Complete the payment
6. Verify you're redirected to the success page

## Production Deployment

### Before Going Live

1. **Replace test API key with live key** in `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_your_actual_live_key
   ```

2. **Update frontend URL** in `.env`:
   ```
   FRONTEND_URL=https://your-actual-domain.com
   ```

3. **Enable proper CORS** settings in the backend

4. **Set up webhook endpoints** (optional but recommended) to handle post-payment events

5. **Test thoroughly** with Stripe test mode before switching to live mode

## Security Notes

- Never expose your Stripe secret key in frontend code
- Always validate and sanitize input on the backend
- Use HTTPS in production
- Keep your Stripe API keys secure
- Regularly rotate API keys
- Monitor Stripe Dashboard for suspicious activity

## Troubleshooting

### "Failed to create checkout session"
- Check that STRIPE_SECRET_KEY is set correctly in `.env`
- Verify the backend server is running
- Check console logs for detailed error messages

### Redirect URLs not working
- Ensure FRONTEND_URL in `.env` matches your actual frontend URL
- Check that success.html and cancel.html are accessible

### CORS errors
- Verify CORS is enabled in backend (`cors` middleware)
- Check that API_URL in frontend matches backend URL

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

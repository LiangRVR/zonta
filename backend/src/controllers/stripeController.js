require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../supabaseClient');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

/**
 * Create a Stripe checkout session
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Transform cart items to Stripe line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || '',
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${FRONTEND_URL}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pages/cancel.html`,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      billing_address_collection: 'required',
      customer_email: req.body.customerEmail,
    });

    // Create order in Supabase with pending status
    try {
      const { error: dbError } = await supabase
        .from('orders')
        .insert([{
          customer_email: req.body.customerEmail || 'unknown@example.com',
          customer_name: null, // Will be updated by webhook
          items: items,
          total_amount: totalAmount,
          status: 'pending',
          stripe_session_id: session.id,
          stripe_payment_intent: null, // Will be updated by webhook
          shipping_address: null, // Will be updated by webhook
        }]);

      if (dbError) {
        console.error('Failed to create order in database:', dbError);
        // Don't fail the checkout, but log the error
      } else {
        console.log('Order created in Supabase for session:', session.id);
      }
    } catch (dbError) {
      console.error('Failed to create order in database:', dbError);
    }

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get checkout session details
 */
const getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total / 100, // Convert from cents
      currency: session.currency,
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({
      error: 'Failed to retrieve checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Fulfill checkout - Following Stripe's fulfillment pattern
 * This function is called by webhooks and should be idempotent
 */
async function fulfillCheckout(sessionId) {
  console.log('Fulfilling Checkout Session ' + sessionId);

  try {
    // Check if fulfillment has already been performed for this session
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking order status:', fetchError);
      throw fetchError;
    }

    // If order is already fulfilled (paid), skip
    if (existingOrder && existingOrder.status === 'paid') {
      console.log('Order already fulfilled for session:', sessionId);
      return;
    }

    // Retrieve the Checkout Session from the API with line_items expanded
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent', 'customer'],
    });

    console.log('Retrieved session details:', {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      customer_details: checkoutSession.customer_details,
      shipping_details: checkoutSession.shipping_details,
      shipping: checkoutSession.shipping,
    });

    // Check the Checkout Session's payment_status property
    if (checkoutSession.payment_status !== 'unpaid') {
      // Get shipping address - Stripe uses 'shipping_details' for the full object
      const shippingAddress = checkoutSession.shipping_details?.address || checkoutSession.shipping?.address || null;
      const shippingName = checkoutSession.shipping_details?.name || checkoutSession.shipping?.name || null;

      // Perform fulfillment - Update order in Supabase
      const updateData = {
        status: 'paid',
        customer_name: checkoutSession.customer_details?.name || null,
        stripe_payment_intent: checkoutSession.payment_intent?.id || checkoutSession.payment_intent || null,
        shipping_address: (shippingAddress && shippingName) ? {
          name: shippingName,
          address: shippingAddress,
        } : null,
        paid_at: new Date().toISOString(),
      };

      console.log('Updating order with data:', JSON.stringify(updateData, null, 2));

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('stripe_session_id', sessionId);

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      console.log('✓ Order fulfilled successfully for session:', sessionId);

      // TODO: Additional fulfillment actions can go here:
      // - Send confirmation email
      // - Update inventory
      // - Trigger shipping
      // - Grant access to digital products
    }
  } catch (error) {
    console.error('Error fulfilling checkout:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    // Handle immediate and delayed payment completions
    console.log('Processing webhook event:', event.type);
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;
      console.log(`Event ${event.type} received for session:`, session.id);

      // Fulfill the order
      await fulfillCheckout(session.id);
    }
    // Handle failed async payments
    else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      console.log('Async payment failed for session:', session.id);

      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id);
    }
    // Handle expired sessions
    else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      console.log('Checkout session expired:', session.id);

      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('stripe_session_id', session.id);
    }
    // Handle refunds
    else if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      console.log('Charge refunded:', charge.id);

      // Update order status to refunded
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent', charge.payment_intent);
    }
    else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  handleWebhook,
  fulfillCheckout, // Export for use in success page
};

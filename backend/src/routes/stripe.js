const express = require('express');
const router = express.Router();
const { createCheckoutSession, getCheckoutSession, handleWebhook } = require('../controllers/stripeController');

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', createCheckoutSession);

// GET /api/stripe/session/:sessionId
router.get('/session/:sessionId', getCheckoutSession);

// POST /api/stripe/webhook (raw body is handled in index.js)
router.post('/webhook', handleWebhook);

module.exports = router;

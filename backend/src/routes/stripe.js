const express = require('express');
const router = express.Router();
const { createCheckoutSession, getCheckoutSession } = require('../controllers/stripeController');

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', createCheckoutSession);

// GET /api/stripe/session/:sessionId
router.get('/session/:sessionId', getCheckoutSession);

module.exports = router;

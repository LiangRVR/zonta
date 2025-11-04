require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const productsRoutes = require('./routes/products');
const stripeRoutes = require('./routes/stripe');

// Middleware
app.use(cors());

// Stripe webhook needs raw body, so handle it before JSON parsing
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  next();
});

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Zonta Club of Naples API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      productById: '/api/products/:id',
      categories: '/api/products/categories',
      productsByCategory: '/api/products/category/:category',
      createCheckout: 'POST /api/stripe/create-checkout-session',
      getSession: '/api/stripe/session/:sessionId',
      webhook: 'POST /api/stripe/webhook'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/stripe', stripeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

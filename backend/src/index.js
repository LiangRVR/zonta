require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Import routes
const productsRoutes = require('./routes/products');
const stripeRoutes = require('./routes/stripe');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

/**
 * Ensure required storage buckets exist
 */
async function ensureStorageBuckets() {
  const bucketName = 'products-images';

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError.message);
      return;
    }

    const bucketExists = buckets.some(b => b.name === bucketName);

    console.log(`Checking for storage bucket: ${bucketName}`);

    if (!bucketExists) {
      console.log(`Creating storage bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log(`Storage bucket '${bucketName}' created successfully`);
      }
    } else {
      console.log(`Storage bucket '${bucketName}' already exists`);
    }
  } catch (err) {
    console.error('Error ensuring storage buckets:', err.message);
  }
}

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
      webhook: 'POST /api/stripe/webhook',
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        session: 'GET /api/auth/session',
        refresh: 'POST /api/auth/refresh'
      },
      admin: {
        check: 'GET /api/admin/check',
        orders: 'GET /api/admin/orders',
        orderById: 'GET /api/admin/orders/:id',
        updateOrderStatus: 'PUT /api/admin/orders/:id/status',
        stats: 'GET /api/admin/stats',
        products: 'GET /api/admin/products',
        createProduct: 'POST /api/admin/products',
        updateProduct: 'PUT /api/admin/products/:id',
        deleteProduct: 'DELETE /api/admin/products/:id'
      }
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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);

  // Ensure storage buckets exist
  await ensureStorageBuckets();
});

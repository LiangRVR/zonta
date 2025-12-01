const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  checkAdminStatus,
  getOverview,
} = require('../controllers/adminController');

// Admin status check (requires auth only)
router.get('/check', requireAuth, requireAdmin, checkAdminStatus);

// Dashboard overview route
router.get('/overview', requireAuth, requireAdmin, getOverview);

// Order management routes
router.get('/orders', requireAuth, requireAdmin, getAllOrders);
router.get('/orders/:id', requireAuth, requireAdmin, getOrderById);
router.put('/orders/:id/status', requireAuth, requireAdmin, updateOrderStatus);

// Statistics route
router.get('/stats', requireAuth, requireAdmin, getOrderStats);

// Product management routes
router.get('/products', requireAuth, requireAdmin, getAllProductsAdmin);
router.post('/products', requireAuth, requireAdmin, createProduct);
router.put('/products/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct);

module.exports = router;

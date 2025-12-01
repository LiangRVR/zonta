const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// Configure multer for memory storage (files stored in buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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
router.post('/products', requireAuth, requireAdmin, upload.single('image'), createProduct);
router.put('/products/:id', requireAuth, requireAdmin, upload.single('image'), updateProduct);
router.delete('/products/:id', requireAuth, requireAdmin, deleteProduct);

module.exports = router;

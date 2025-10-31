const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getCategories
} = require('../controllers/productsController');

// Get all products
router.get('/', getAllProducts);

// Get product categories
router.get('/categories', getCategories);

// Get products by category
router.get('/category/:category', getProductsByCategory);

// Get single product by ID
router.get('/:id', getProductById);

module.exports = router;

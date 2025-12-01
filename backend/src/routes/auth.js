const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  getSession,
  refreshToken,
} = require('../controllers/authController');

// Public routes (no auth required)
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes (require valid token)
router.post('/logout', logout);
router.get('/session', getSession);

module.exports = router;

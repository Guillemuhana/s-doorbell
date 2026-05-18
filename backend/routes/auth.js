// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register, refreshToken, me, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, me);
router.post('/refresh', protect, refreshToken);

module.exports = router;

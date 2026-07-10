const express = require('express');
const { body } = require('express-validator');
const { registerStudent, loginUser, getMe, updatePassword, resetAdminPassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  registerStudent
);

router.post(
  '/login',
  [
    body().custom((value) => {
      if (!value.identifier && !value.email && !value.phone) {
        throw new Error('Email or phone number is required');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  forgotPassword
);

router.post(
  '/reset-admin-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('adminKey').notEmpty().withMessage('Admin reset key is required'),
  ],
  resetAdminPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  resetPassword
);

router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;

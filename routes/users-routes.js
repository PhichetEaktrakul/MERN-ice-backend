import express from 'express';
import { check } from 'express-validator';

// Controller functions for user routes
import usersController from '../controllers/users-controllers.js';

// Middleware for handling file uploads (e.g., profile images)
import fileUpload from '../middleware/file-upload.js';

const router = express.Router();

// ==============================
// @route   GET /api/users
// @desc    Get all users
// @access  Public
// ==============================
router.get('/', usersController.getUsers);

// ==============================
// @route   POST /api/users/signup
// @desc    Register a new user with image upload and validation
// @access  Public
// ==============================
router.post(
  '/signup',
  // Middleware for single file upload (expects 'image' field in form data)
  fileUpload.single('image'),
  // Validation middleware
  [
    check('name')
      .not()
      .isEmpty()
      .withMessage('Name is required'),
    check('email')
      .normalizeEmail()
      .isEmail()
      .withMessage('Please provide a valid email'),
    check('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  usersController.signup
);

// ==============================
// @route   POST /api/users/login
// @desc    Authenticate user and get token
// @access  Public
// ==============================
router.post('/login', usersController.login);

export default router;
import express from 'express';
import { check } from 'express-validator';

// Controller functions for place routes
import placesControllers from '../controllers/places-controllers.js';

// Middleware for handling file uploads (e.g., profile images) and auth check (e.g., JWT verification)
import fileUpload from '../middleware/file-upload.js';
import checkAuth from '../middleware/check-auth.js';

const router = express.Router();

// ==============================
// @route   GET /api/places/:pid
// @desc    Get a place by its ID
// @access  Public
// ==============================
router.get('/:pid', placesControllers.getPlaceById);

// ==============================
// @route   GET /api/places/user/:uid
// @desc    Get all places for a specific user
// @access  Public
// ==============================
router.get('/user/:uid', placesControllers.getPlacesByUserId);

// ==============================
// Middleware: Protect routes below this line
// ==============================
router.use(checkAuth);

// ==============================
// @route   POST /api/places
// @desc    Create a new place (with image upload)
// @access  Private
// ==============================
router.post(
  '/',
  fileUpload.single('image'), // Handle image upload from field 'image'
  [
    check('title')
      .not()
      .isEmpty()
      .withMessage('Title is required'),
    check('description')
      .isLength({ min: 5 })
      .withMessage('Description must be at least 5 characters'),
    check('address')
      .not()
      .isEmpty()
      .withMessage('Address is required')
  ],
  placesControllers.createPlace
);

// ==============================
// @route   PATCH /api/places/:pid
// @desc    Update a place's title and description
// @access  Private
// ==============================
router.patch(
  '/:pid',
  [
    check('title')
      .not()
      .isEmpty()
      .withMessage('Title is required'),
    check('description')
      .isLength({ min: 5 })
      .withMessage('Description must be at least 5 characters')
  ],
  placesControllers.updatePlace
);

// ==============================
// @route   DELETE /api/places/:pid
// @desc    Delete a place by its ID
// @access  Private
// ==============================
router.delete('/:pid', placesControllers.deletePlace);

export default router;
import express from 'express';
import {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions,
  searchUsers,
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadProfile, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ===================
// PUBLIC ROUTES
// ===================

/**
 * @route   GET /api/users/search
 * @desc    Search users by username or name
 * @access  Public (optional auth for isFollowing check)
 */
router.get('/search', optionalAuth, searchUsers);

/**
 * @route   GET /api/users/:identifier
 * @desc    Get user profile by ID or username
 * @access  Public (optional auth for isFollowing check)
 */
router.get('/:identifier', optionalAuth, getUserProfile);

/**
 * @route   GET /api/users/:id/followers
 * @desc    Get user's followers
 * @access  Public
 */
router.get('/:id/followers', getFollowers);

/**
 * @route   GET /api/users/:id/following
 * @desc    Get user's following
 * @access  Public
 */
router.get('/:id/following', getFollowing);

// ===================
// PROTECTED ROUTES
// ===================

/**
 * @route   GET /api/users/suggestions
 * @desc    Get user suggestions
 * @access  Private
 */
router.get('/feed/suggestions', protect, getSuggestions);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   PUT /api/users/profile/image
 * @desc    Update profile image
 * @access  Private
 */
router.put(
  '/profile/image',
  protect,
  uploadProfile.single('profileImage'),
  handleUploadError,
  updateProfileImage
);

/**
 * @route   POST /api/users/follow/:id
 * @desc    Follow a user
 * @access  Private
 */
router.post('/follow/:id', protect, followUser);

/**
 * @route   DELETE /api/users/unfollow/:id
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete('/unfollow/:id', protect, unfollowUser);

export default router;

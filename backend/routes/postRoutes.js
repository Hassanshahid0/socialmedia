import express from 'express';
import {
  createPost,
  getFeedPosts,
  getExplorePosts,
  getUserPosts,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  sharePost,
  savePost,
  unsavePost,
  getSavedPosts,
} from '../controllers/postController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadPost, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// ===================
// PROTECTED ROUTES
// ===================

/**
 * @route   GET /api/posts/feed
 * @desc    Get feed posts (from followed users)
 * @access  Private
 */
router.get('/feed', protect, getFeedPosts);

/**
 * @route   GET /api/posts/explore
 * @desc    Get explore/popular posts
 * @access  Private
 */
router.get('/explore', protect, getExplorePosts);

/**
 * @route   GET /api/posts/saved
 * @desc    Get saved posts
 * @access  Private
 */
router.get('/saved', protect, getSavedPosts);

/**
 * @route   POST /api/posts
 * @desc    Create a new post (Creator only)
 * @access  Private
 */
router.post(
  '/',
  protect,
  uploadPost.single('image'),
  handleUploadError,
  createPost
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (Owner only)
 */
router.delete('/:id', protect, deletePost);

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like/Unlike a post
 * @access  Private
 */
router.post('/:id/like', protect, toggleLike);

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment
 * @access  Private
 */
router.post('/:id/comment', protect, addComment);

/**
 * @route   DELETE /api/posts/:id/comment/:commentId
 * @desc    Delete a comment
 * @access  Private
 */
router.delete('/:id/comment/:commentId', protect, deleteComment);

/**
 * @route   POST /api/posts/:id/share
 * @desc    Share a post
 * @access  Private
 */
router.post('/:id/share', protect, sharePost);

/**
 * @route   POST /api/posts/:id/save
 * @desc    Save a post
 * @access  Private
 */
router.post('/:id/save', protect, savePost);

/**
 * @route   DELETE /api/posts/:id/save
 * @desc    Unsave a post
 * @access  Private
 */
router.delete('/:id/save', protect, unsavePost);

// ===================
// PUBLIC/OPTIONAL AUTH ROUTES
// ===================

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get user's posts
 * @access  Public
 */
router.get('/user/:userId', optionalAuth, getUserPosts);

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post
 * @access  Public
 */
router.get('/:id', optionalAuth, getPost);

/**
 * @route   GET /api/posts/:id/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/:id/comments', getComments);

export default router;

import express from 'express';
import {
  createStory,
  getFeedStories,
  getMyStories,
  getUserStories,
  getStory,
  viewStory,
  getStoryViewers,
  deleteStory,
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadStory, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/stories
 * @desc    Get stories for feed (from followed users + own)
 * @access  Private
 */
router.get('/', getFeedStories);

/**
 * @route   GET /api/stories/my
 * @desc    Get current user's stories
 * @access  Private
 */
router.get('/my', getMyStories);

/**
 * @route   GET /api/stories/user/:userId
 * @desc    Get user's stories
 * @access  Private
 */
router.get('/user/:userId', getUserStories);

/**
 * @route   POST /api/stories
 * @desc    Create a new story
 * @access  Private
 */
router.post(
  '/',
  uploadStory.single('image'),
  handleUploadError,
  createStory
);

/**
 * @route   GET /api/stories/:id
 * @desc    Get single story
 * @access  Private
 */
router.get('/:id', getStory);

/**
 * @route   POST /api/stories/:id/view
 * @desc    Mark story as viewed
 * @access  Private
 */
router.post('/:id/view', viewStory);

/**
 * @route   GET /api/stories/:id/viewers
 * @desc    Get story viewers (owner only)
 * @access  Private
 */
router.get('/:id/viewers', getStoryViewers);

/**
 * @route   DELETE /api/stories/:id
 * @desc    Delete a story
 * @access  Private
 */
router.delete('/:id', deleteStory);

export default router;

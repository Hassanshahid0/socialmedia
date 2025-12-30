import express from 'express';
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPost, handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations
 * @access  Private
 */
router.get('/conversations', getConversations);

/**
 * @route   POST /api/messages/conversations/start
 * @desc    Start a new conversation
 * @access  Private
 */
router.post('/conversations/start', startConversation);

/**
 * @route   GET /api/messages/conversations/:id
 * @desc    Get single conversation
 * @access  Private
 */
router.get('/conversations/:id', getConversation);

/**
 * @route   GET /api/messages/conversations/:id/messages
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get('/conversations/:id/messages', getMessages);

/**
 * @route   GET /api/messages/:conversationId
 * @desc    Get messages for a conversation (alternate route)
 * @access  Private
 */
router.get('/:conversationId', getMessages);

/**
 * @route   PUT /api/messages/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put('/conversations/:id/read', markAsRead);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message
 * @access  Private
 */
router.post(
  '/send',
  uploadPost.single('image'),
  handleUploadError,
  sendMessage
);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', deleteMessage);

export default router;

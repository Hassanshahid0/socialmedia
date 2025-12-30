import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getIO, getSocketId, sendNotificationToUser, sendMessageNotification } from '../config/socket.js';

/**
 * @desc    Get all conversations for current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.getUserConversations(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        conversations,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get single conversation
 * @route   GET /api/messages/conversations/:id
 * @access  Private
 */
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username fullName profileImage')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation',
      });
    }

    // Get other participant
    const otherParticipant = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    res.status(200).json({
      success: true,
      data: {
        conversation: {
          _id: conversation._id,
          participant: otherParticipant,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: conversation.unreadCount?.get(req.user._id.toString()) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get messages for a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation',
      });
    }

    // Get messages
    const messages = await Message.getConversationMessages(
      conversationId,
      req.user._id,
      page,
      limit
    );

    // Mark messages as read
    await Message.markAsRead(conversationId, req.user._id);
    await conversation.resetUnread(req.user._id);

    res.status(200).json({
      success: true,
      messages: messages,
      data: {
        messages,
        page,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/messages/send
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, text, sharedPostId } = req.body;

    // Validate input
    if (!text && !sharedPostId && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    let conversation;

    // If conversationId provided, use it
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found',
        });
      }

      // Verify user is participant
      const isParticipant = conversation.participants.some(
        (p) => p.toString() === req.user._id.toString()
      );

      if (!isParticipant) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
      }
    } else if (recipientId) {
      // Create or get conversation with recipient
      if (recipientId === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot send message to yourself',
        });
      }

      // Verify recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found',
        });
      }

      conversation = await Conversation.getOrCreate(req.user._id, recipientId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID or recipient ID is required',
      });
    }

    // Determine message type
    let messageType = 'text';
    if (sharedPostId) messageType = 'post';
    else if (req.file) messageType = 'image';

    // Create message
    const messageData = {
      conversation: conversation._id,
      sender: req.user._id,
      text: text || '',
      messageType,
    };

    if (sharedPostId) {
      messageData.sharedPost = sharedPostId;
    }

    if (req.file) {
      messageData.image = req.file.filename;
    }

    const message = await Message.create(messageData);

    // Populate message data
    await message.populate('sender', 'username fullName profileImage');
    if (sharedPostId) {
      await message.populate({
        path: 'sharedPost',
        select: 'image caption author',
        populate: {
          path: 'author',
          select: 'username fullName profileImage',
        },
      });
    }

    // Update conversation
    await conversation.updateLastMessage(message._id);

    // Get recipient ID
    const recipientUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    // Increment unread count for recipient
    await conversation.incrementUnread(recipientUserId);

    // Send real-time message via Socket.IO
    const io = getIO();
    io.to(conversation._id.toString()).emit('receive_message', {
      message: message.toObject(),
      conversationId: conversation._id,
    });

    // Send notification to recipient's room (always works if user is connected)
    sendMessageNotification(recipientUserId.toString(), {
      conversationId: conversation._id,
      message: message.toObject(),
      sender: {
        _id: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        profileImage: req.user.profileImage,
      },
    });

    res.status(201).json({
      success: true,
      message: message.toObject(),
      conversationId: conversation._id,
      data: {
        message: message.toObject(),
        conversationId: conversation._id,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Start a new conversation
 * @route   POST /api/messages/conversations/start
 * @access  Private
 */
const startConversation = async (req, res) => {
  try {
    const { recipientId, text, sharedPostId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required',
      });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation with yourself',
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get or create conversation
    const conversation = await Conversation.getOrCreate(req.user._id, recipientId);

    // If text or sharedPost provided, send initial message
    if (text || sharedPostId) {
      let messageType = 'text';
      if (sharedPostId) messageType = 'post';

      const messageData = {
        conversation: conversation._id,
        sender: req.user._id,
        text: text || '',
        messageType,
      };

      if (sharedPostId) {
        messageData.sharedPost = sharedPostId;
      }

      const message = await Message.create(messageData);
      await message.populate('sender', 'username fullName profileImage');
      
      if (sharedPostId) {
        await message.populate({
          path: 'sharedPost',
          select: 'image caption author',
          populate: {
            path: 'author',
            select: 'username fullName profileImage',
          },
        });
      }

      await conversation.updateLastMessage(message._id);
      await conversation.incrementUnread(recipientId);

      // Send real-time notification to recipient's room
      sendMessageNotification(recipientId.toString(), {
        conversationId: conversation._id,
        message: message.toObject(),
        sender: {
          _id: req.user._id,
          username: req.user.username,
          fullName: req.user.fullName,
          profileImage: req.user.profileImage,
        },
      });
    }

    // Format response
    const formattedConversation = {
      _id: conversation._id,
      participant: {
        _id: recipient._id,
        username: recipient.username,
        fullName: recipient.fullName,
        profileImage: recipient.profileImage,
      },
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 0,
    };

    res.status(201).json({
      success: true,
      data: {
        conversation: formattedConversation,
      },
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Mark conversation as read
 * @route   PUT /api/messages/conversations/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Mark messages as read
    await Message.markAsRead(conversation._id, req.user._id);
    await conversation.resetUnread(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Delete a message (soft delete)
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Add user to deletedFor array
    if (!message.deletedFor.includes(req.user._id)) {
      message.deletedFor.push(req.user._id);
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  deleteMessage,
};

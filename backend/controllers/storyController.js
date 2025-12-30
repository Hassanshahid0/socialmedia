import Story from '../models/Story.js';
import User from '../models/User.js';
import { deleteFile } from '../middleware/uploadMiddleware.js';

/**
 * @desc    Create a new story
 * @route   POST /api/stories
 * @access  Private
 */
const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const { caption } = req.body;

    const story = await Story.create({
      author: req.user._id,
      image: req.file.filename,
      caption: caption || '',
    });

    // Populate author info
    await story.populate('author', 'username fullName profileImage');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: {
        story: {
          ...story.toObject(),
          hasViewed: false,
        },
      },
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get stories for feed (from followed users + own)
 * @route   GET /api/stories
 * @access  Private
 */
const getFeedStories = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const stories = await Story.getFeedStories(req.user._id, user.following);

    res.status(200).json({
      success: true,
      data: {
        stories,
      },
    });
  } catch (error) {
    console.error('Get feed stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get current user's stories
 * @route   GET /api/stories/my
 * @access  Private
 */
const getMyStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.user._id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'username fullName profileImage')
      .populate('viewers.user', 'username fullName profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        stories: stories.map((story) => ({
          ...story,
          hasViewed: true, // Own stories are always "viewed"
        })),
      },
    });
  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get user's stories by user ID
 * @route   GET /api/stories/user/:userId
 * @access  Private
 */
const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;

    const stories = await Story.getUserStories(userId, req.user._id);

    res.status(200).json({
      success: true,
      data: {
        stories,
      },
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get single story
 * @route   GET /api/stories/:id
 * @access  Private
 */
const getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('author', 'username fullName profileImage')
      .populate('viewers.user', 'username fullName profileImage');

    if (!story || !story.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if expired
    if (new Date(story.expiresAt) < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Story has expired',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        story: {
          ...story.toObject(),
          hasViewed: story.hasViewed(req.user._id),
        },
      },
    });
  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    View a story (mark as viewed)
 * @route   POST /api/stories/:id/view
 * @access  Private
 */
const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story || !story.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if expired
    if (new Date(story.expiresAt) < new Date()) {
      return res.status(404).json({
        success: false,
        message: 'Story has expired',
      });
    }

    // Don't record view for own stories
    if (story.author.toString() !== req.user._id.toString()) {
      await story.addViewer(req.user._id);
    }

    res.status(200).json({
      success: true,
      message: 'Story viewed',
      data: {
        viewersCount: story.viewersCount,
      },
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get story viewers
 * @route   GET /api/stories/:id/viewers
 * @access  Private (Owner only)
 */
const getStoryViewers = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('viewers.user', 'username fullName profileImage')
      .select('viewers viewersCount author');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Only owner can see viewers
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view story viewers',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        viewers: story.viewers,
        viewersCount: story.viewersCount,
      },
    });
  } catch (error) {
    console.error('Get story viewers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Delete a story
 * @route   DELETE /api/stories/:id
 * @access  Private (Owner only)
 */
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check ownership
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this story',
      });
    }

    // Delete image file
    if (story.image) {
      deleteFile(`uploads/stories/${story.image}`);
    }

    // Delete story
    await Story.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export {
  createStory,
  getFeedStories,
  getMyStories,
  getUserStories,
  getStory,
  viewStory,
  getStoryViewers,
  deleteStory,
};

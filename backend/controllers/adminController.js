import User from '../models/User.js';
import Post from '../models/Post.js';
import Story from '../models/Story.js';
import Message from '../models/Message.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * @desc    Get dashboard stats
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User stats
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: thisWeek } });
    const activeUsersToday = await User.countDocuments({ lastActive: { $gte: today } });
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // User role distribution
    const creators = await User.countDocuments({ role: 'creator' });
    const consumers = await User.countDocuments({ role: 'consumer' });

    // Post stats
    const totalPosts = await Post.countDocuments();
    const postsToday = await Post.countDocuments({ createdAt: { $gte: today } });
    const postsThisWeek = await Post.countDocuments({ createdAt: { $gte: thisWeek } });

    // Story stats
    const activeStories = await Story.countDocuments({ expiresAt: { $gt: now } });
    const storiesCreatedToday = await Story.countDocuments({ createdAt: { $gte: today } });

    // Message stats
    const totalMessages = await Message.countDocuments();
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: today } });

    // Growth calculation
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: thisMonth }
    });
    const userGrowth = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : 100;

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          activeToday: activeUsersToday,
          banned: bannedUsers,
          creators,
          consumers,
          growth: parseFloat(userGrowth)
        },
        posts: {
          total: totalPosts,
          today: postsToday,
          thisWeek: postsThisWeek
        },
        stories: {
          active: activeStories,
          createdToday: storiesCreatedToday
        },
        messages: {
          total: totalMessages,
          today: messagesToday
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with pagination and filters
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const role = req.query.role;
    const status = req.query.status; // active, banned

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get post counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const postCount = await Post.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          postCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users: usersWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user details
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's posts
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get activity stats
    const postCount = await Post.countDocuments({ user: user._id });
    const storyCount = await Story.countDocuments({ user: user._id });
    const messageCount = await Message.countDocuments({
      $or: [{ sender: user._id }, { receiver: user._id }]
    });

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          posts: postCount,
          stories: storyCount,
          messages: messageCount
        },
        recentPosts: posts
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['consumer', 'creator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ban user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Private/Admin
 */
export const banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot ban yourself'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot ban an admin user'
      });
    }

    user.isBanned = true;
    user.banReason = reason || 'Violation of community guidelines';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been banned`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unban user
 * @route   PUT /api/admin/users/:id/unban
 * @access  Private/Admin
 */
export const unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBanned = false;
    user.banReason = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.username} has been unbanned`,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user and all their content
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an admin user'
      });
    }

    // Delete user's posts and their images
    const posts = await Post.find({ user: user._id });
    for (const post of posts) {
      for (const image of post.images) {
        await deleteFromCloudinary(image.publicId);
      }
    }
    await Post.deleteMany({ user: user._id });

    // Delete user's stories
    const stories = await Story.find({ user: user._id });
    for (const story of stories) {
      await deleteFromCloudinary(story.media.publicId);
    }
    await Story.deleteMany({ user: user._id });

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ sender: user._id }, { receiver: user._id }]
    });

    // Remove user from followers/following lists
    await User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    );
    await User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    );

    // Delete avatar if not default
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    }

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.username} and all their content have been deleted`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all posts with pagination
 * @route   GET /api/admin/posts
 * @access  Private/Admin
 */
export const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const query = {};
    
    if (search) {
      query.$or = [
        { caption: { $regex: search, $options: 'i' } },
        { hashtags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const posts = await Post.find(query)
      .populate('user', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      posts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete any post
 * @route   DELETE /api/admin/posts/:id
 * @access  Private/Admin
 */
export const deleteAnyPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete images from Cloudinary
    for (const image of post.images) {
      await deleteFromCloudinary(image.publicId);
    }

    // Remove from saved posts
    await User.updateMany(
      { savedPosts: post._id },
      { $pull: { savedPosts: post._id } }
    );

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recent activity
 * @route   GET /api/admin/activity
 * @access  Private/Admin
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get recent users
    const recentUsers = await User.find()
      .select('username displayName avatar createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent posts
    const recentPosts = await Post.find()
      .populate('user', 'username avatar')
      .select('images caption createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent active users
    const activeUsers = await User.find()
      .select('username displayName avatar lastActive')
      .sort({ lastActive: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      activity: {
        recentUsers,
        recentPosts,
        activeUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  getAllPosts,
  deleteAnyPost,
  getRecentActivity
};

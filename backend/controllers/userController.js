import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { deleteFile } from '../middleware/uploadMiddleware.js';
import { sendNotificationToUser } from '../config/socket.js';

/**
 * @desc    Get user profile by ID or username
 * @route   GET /api/users/:identifier
 * @access  Public
 */
const getUserProfile = async (req, res) => {
  try {
    const { identifier } = req.params;

    let user;

    // Check if identifier is MongoDB ObjectId or username
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(identifier).select('-password');
    } else {
      user = await User.findOne({ username: identifier.toLowerCase() }).select(
        '-password'
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = req.user.following.some(
        (id) => id.toString() === user._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          profileImage: user.profileImage,
          bio: user.bio,
          role: user.role,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
          createdAt: user.createdAt,
          isFollowing,
        },
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, username } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

    // Check username availability if changing
    if (username && username.toLowerCase() !== user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
      user.username = username.toLowerCase();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profileImage: user.profileImage,
          bio: user.bio,
          role: user.role,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          postsCount: user.postsCount,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Update profile image
 * @route   PUT /api/users/profile/image
 * @access  Private
 */
const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const user = await User.findById(req.user._id);

    // Delete old profile image if exists
    if (user.profileImage) {
      deleteFile(`uploads/profiles/${user.profileImage}`);
    }

    // Update with new image
    user.profileImage = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Follow a user
 * @route   POST /api/users/follow/:id
 * @access  Private
 */
const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Can't follow yourself
    if (userToFollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    // Add to following/followers
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    // Update counts
    currentUser.followingCount = currentUser.following.length;
    userToFollow.followersCount = userToFollow.followers.length;

    await currentUser.save();
    await userToFollow.save();

    // Create notification for the followed user
    try {
      const notification = await Notification.createNotification({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow',
      });

      // Send real-time notification via Socket.IO
      if (notification) {
        sendNotificationToUser(userToFollow._id.toString(), notification);
      }
    } catch (notifError) {
      console.error('Error creating follow notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: `You are now following ${userToFollow.username}`,
      data: {
        followingCount: currentUser.followingCount,
        targetFollowersCount: userToFollow.followersCount,
      },
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Unfollow a user
 * @route   DELETE /api/users/unfollow/:id
 * @access  Private
 */
const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Can't unfollow yourself
    if (userToUnfollow._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself',
      });
    }

    // Check if not following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not following this user',
      });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    // Update counts
    currentUser.followingCount = currentUser.following.length;
    userToUnfollow.followersCount = userToUnfollow.followers.length;

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({
      success: true,
      message: `You have unfollowed ${userToUnfollow.username}`,
      data: {
        followingCount: currentUser.followingCount,
        targetFollowersCount: userToUnfollow.followersCount,
      },
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get user's followers
 * @route   GET /api/users/:id/followers
 * @access  Public
 */
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'followers',
      'username fullName profileImage bio'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        followers: user.followers,
        count: user.followersCount,
      },
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get user's following
 * @route   GET /api/users/:id/following
 * @access  Public
 */
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      'following',
      'username fullName profileImage bio'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        following: user.following,
        count: user.followingCount,
      },
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get user suggestions (users not followed)
 * @route   GET /api/users/suggestions
 * @access  Private
 */
const getSuggestions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const suggestions = await User.getSuggestions(req.user._id, limit);

    // Add isFollowing field (should be false for suggestions)
    const suggestionsWithFollowStatus = suggestions.map(user => ({
      ...user.toObject ? user.toObject() : user,
      isFollowing: false,
    }));

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestionsWithFollowStatus,
      },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Public
 */
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ],
      isActive: true,
      _id: { $ne: req.user?._id }, // Exclude current user
    })
      .select('username fullName profileImage bio')
      .limit(limit)
      .lean();

    // Add isFollowing field if user is logged in
    let usersWithFollowStatus = users;
    if (req.user) {
      const currentUser = await User.findById(req.user._id);
      usersWithFollowStatus = users.map(user => ({
        ...user,
        isFollowing: currentUser.following.some(
          id => id.toString() === user._id.toString()
        ),
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        users: usersWithFollowStatus,
        count: usersWithFollowStatus.length,
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSuggestions,
  searchUsers,
};

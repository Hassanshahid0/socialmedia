import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../config/socket.js';
import { deleteFile } from '../middleware/uploadMiddleware.js';

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private (Creator only)
 */
const createPost = async (req, res) => {
  try {
    // Check if user is a creator
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only creators can create posts',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const { caption } = req.body;

    const post = await Post.create({
      author: req.user._id,
      caption: caption || '',
      image: req.file.filename,
    });

    // Increment user's posts count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: 1 },
    });

    // Populate author info
    await post.populate('author', 'username fullName profileImage');

    // Create the post object with all needed fields
    const postData = {
      _id: post._id,
      author: post.author,
      caption: post.caption,
      image: post.image,
      likes: post.likes,
      likesCount: post.likesCount,
      comments: post.comments,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: false,
    };

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: postData,
      data: {
        post: postData,
      },
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get feed posts (from followed users)
 * @route   GET /api/posts/feed
 * @access  Private
 */
const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const user = await User.findById(req.user._id);
    const posts = await Post.getFeedPosts(req.user._id, user.following, page, limit);
    
    console.log(`Found ${posts.length} feed posts for user ${req.user._id}`);

    res.status(200).json({
      success: true,
      posts: posts,
      data: {
        posts,
        page,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get explore posts (popular posts)
 * @route   GET /api/posts/explore
 * @access  Private
 */
const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.getExplorePosts(req.user._id, page, limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        page,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get user's posts
 * @route   GET /api/posts/user/:userId
 * @access  Public
 */
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const posts = await Post.getUserPosts(userId, req.user?._id, page, limit);
    
    console.log(`Found ${posts.length} posts for user ${userId}`);

    res.status(200).json({
      success: true,
      posts: posts,
      data: {
        posts,
        page,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get single post
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName profileImage')
      .populate('comments.user', 'username fullName profileImage');

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const postData = post.toObject();
    postData.isLiked = req.user
      ? post.isLikedBy(req.user._id)
      : false;

    res.status(200).json({
      success: true,
      data: { post: postData },
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Delete a post
 * @route   DELETE /api/posts/:id
 * @access  Private (Owner only)
 */
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete image file
    if (post.image) {
      deleteFile(`uploads/posts/${post.image}`);
    }

    // Delete post
    await Post.findByIdAndDelete(req.params.id);

    // Decrement user's posts count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postsCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Like/Unlike a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isLiked = post.isLikedBy(req.user._id);

    if (isLiked) {
      await post.removeLike(req.user._id);
    } else {
      await post.addLike(req.user._id);

      // Create & send notification if liking someone else's post
      if (post.author.toString() !== req.user._id.toString()) {
        try {
          const notification = await Notification.createNotification({
            recipient: post.author,
            sender: req.user._id,
            type: 'like',
            post: post._id,
          });

          if (notification) {
            sendNotificationToUser(post.author.toString(), notification);
          }
        } catch (notifError) {
          console.error('Error creating like notification:', notifError);
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        isLiked: !isLiked,
        likesCount: post.likesCount,
      },
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Add a comment
 * @route   POST /api/posts/:id/comment
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = await post.addComment(req.user._id, text.trim());

    // Populate user info
    const populatedComment = {
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: {
        _id: req.user._id,
        username: req.user.username,
        fullName: req.user.fullName,
        profileImage: req.user.profileImage,
      },
    };

    // Create & send notification if commenting on someone else's post
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.createNotification({
          recipient: post.author,
          sender: req.user._id,
          type: 'comment',
          post: post._id,
          comment: text.trim().substring(0, 50),
        });

        if (notification) {
          sendNotificationToUser(post.author.toString(), notification);
        }
      } catch (notifError) {
        console.error('Error creating comment notification:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        comment: populatedComment,
        commentsCount: post.commentsCount,
      },
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get comments for a post
 * @route   GET /api/posts/:id/comments
 * @access  Public
 */
const getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('comments.user', 'username fullName profileImage')
      .select('comments commentsCount');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Transform comments to match expected format
    const comments = post.comments.map((comment) => ({
      _id: comment._id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: comment.user,
    }));

    res.status(200).json({
      success: true,
      data: {
        comments,
        count: post.commentsCount,
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/posts/:id/comment/:commentId
 * @access  Private
 */
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await post.removeComment(commentId, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
      data: {
        commentsCount: post.commentsCount,
      },
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Share a post (track sharing)
 * @route   POST /api/posts/:id/share
 * @access  Private
 */
const sharePost = async (req, res) => {
  try {
    const { sharedTo } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Add share record
    post.shares.push({
      user: req.user._id,
      sharedTo: sharedTo,
    });
    post.sharesCount = post.shares.length;
    await post.save();

    // Create & send notification to post author
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        const notification = await Notification.createNotification({
          recipient: post.author,
          sender: req.user._id,
          type: 'share',
          post: post._id,
        });

        if (notification) {
          sendNotificationToUser(post.author.toString(), notification);
        }
      } catch (notifError) {
        console.error('Error creating share notification:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
      data: {
        sharesCount: post.sharesCount,
      },
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Save a post
 * @route   POST /api/posts/:id/save
 * @access  Private
 */
const savePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const alreadySaved = post.isSavedBy(req.user._id);

    if (alreadySaved) {
      return res.status(400).json({
        success: false,
        message: 'Post already saved',
      });
    }

    await post.addToSaved(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Post saved',
      data: {
        isSaved: true,
        savedCount: post.savedCount,
      },
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Unsave a post
 * @route   DELETE /api/posts/:id/save
 * @access  Private
 */
const unsavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isSaved = post.isSavedBy(req.user._id);

    if (!isSaved) {
      return res.status(400).json({
        success: false,
        message: 'Post not saved',
      });
    }

    await post.removeFromSaved(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Post unsaved',
      data: {
        isSaved: false,
        savedCount: post.savedCount,
      },
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * @desc    Get saved posts
 * @route   GET /api/posts/saved
 * @access  Private
 */
const getSavedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;

    const posts = await Post.getSavedPosts(req.user._id, page, limit);

    res.status(200).json({
      success: true,
      posts: posts,
      data: {
        posts,
        page,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export {
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
};

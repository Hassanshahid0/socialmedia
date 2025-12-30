import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    image: {
      type: String,
      required: [true, 'Post image is required'],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
    comments: [commentSchema],
    commentsCount: {
      type: Number,
      default: 0,
    },
    shares: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        sharedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sharesCount: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    savedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ likes: 1 });

// Virtual for image URL
postSchema.virtual('imageUrl').get(function () {
  if (this.image) {
    if (this.image.startsWith('http')) {
      return this.image;
    }
    return `/uploads/posts/${this.image}`;
  }
  return null;
});

// Check if user has liked the post
postSchema.methods.isLikedBy = function (userId) {
  return this.likes.some((id) => id.toString() === userId.toString());
};

// Check if user has saved the post
postSchema.methods.isSavedBy = function (userId) {
  return this.savedBy.some((id) => id.toString() === userId.toString());
};

// Add to saved
postSchema.methods.addToSaved = async function (userId) {
  if (!this.isSavedBy(userId)) {
    this.savedBy.push(userId);
    this.savedCount = this.savedBy.length;
    await this.save();
    return true;
  }
  return false;
};

// Remove from saved
postSchema.methods.removeFromSaved = async function (userId) {
  if (this.isSavedBy(userId)) {
    this.savedBy = this.savedBy.filter((id) => id.toString() !== userId.toString());
    this.savedCount = this.savedBy.length;
    await this.save();
    return true;
  }
  return false;
};

// Add like
postSchema.methods.addLike = async function (userId) {
  if (!this.isLikedBy(userId)) {
    this.likes.push(userId);
    this.likesCount = this.likes.length;
    await this.save();
    return true;
  }
  return false;
};

// Remove like
postSchema.methods.removeLike = async function (userId) {
  if (this.isLikedBy(userId)) {
    this.likes = this.likes.filter((id) => id.toString() !== userId.toString());
    this.likesCount = this.likes.length;
    await this.save();
    return true;
  }
  return false;
};

// Add comment
postSchema.methods.addComment = async function (userId, text) {
  this.comments.push({ user: userId, text });
  this.commentsCount = this.comments.length;
  await this.save();
  return this.comments[this.comments.length - 1];
};

// Remove comment
postSchema.methods.removeComment = async function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this comment');
  }
  this.comments.pull(commentId);
  this.commentsCount = this.comments.length;
  await this.save();
  return true;
};

// Static method to get feed posts (from users the current user follows)
postSchema.statics.getFeedPosts = async function (userId, following, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  // Include posts from followed users and own posts
  const userIds = [...following, userId];
  
  const posts = await this.find({
    author: { $in: userIds },
    isActive: true,
  })
    .populate('author', 'username fullName profileImage')
    .populate('comments.user', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Add isLiked and isSaved field for current user
  return posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === userId.toString()),
    isSaved: post.savedBy ? post.savedBy.some((id) => id.toString() === userId.toString()) : false,
  }));
};

// Static method to get explore posts (from all users)
postSchema.statics.getExplorePosts = async function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const posts = await this.find({
    isActive: true,
  })
    .populate('author', 'username fullName profileImage')
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === userId.toString()),
    isSaved: post.savedBy ? post.savedBy.some((id) => id.toString() === userId.toString()) : false,
  }));
};

// Static method to get user posts
postSchema.statics.getUserPosts = async function (authorId, currentUserId, page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  
  const posts = await this.find({
    author: authorId,
    isActive: true,
  })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return posts.map((post) => ({
    ...post,
    isLiked: currentUserId
      ? post.likes.some((id) => id.toString() === currentUserId.toString())
      : false,
    isSaved: currentUserId && post.savedBy
      ? post.savedBy.some((id) => id.toString() === currentUserId.toString())
      : false,
  }));
};

// Static method to get saved posts for a user
postSchema.statics.getSavedPosts = async function (userId, page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  
  const posts = await this.find({
    savedBy: userId,
    isActive: true,
  })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return posts.map((post) => ({
    ...post,
    isLiked: post.likes.some((id) => id.toString() === userId.toString()),
    isSaved: true,
  }));
};

const Post = mongoose.model('Post', postSchema);

export default Post;

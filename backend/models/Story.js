import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: String,
      required: [true, 'Story image is required'],
    },
    caption: {
      type: String,
      maxlength: [100, 'Caption cannot exceed 100 characters'],
      default: '',
    },
    viewers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    viewersCount: {
      type: Number,
      default: 0,
    },
    // TTL index - Story expires after 24 hours
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 }, // TTL index - MongoDB auto-deletes when expiresAt is reached
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ createdAt: -1 });

// Virtual for image URL
storySchema.virtual('imageUrl').get(function () {
  if (this.image) {
    if (this.image.startsWith('http')) {
      return this.image;
    }
    return `/uploads/stories/${this.image}`;
  }
  return null;
});

// Virtual for time remaining
storySchema.virtual('timeRemaining').get(function () {
  const now = new Date();
  const expires = new Date(this.expiresAt);
  const remaining = expires - now;
  return Math.max(0, remaining);
});

// Virtual for hours remaining
storySchema.virtual('hoursRemaining').get(function () {
  return Math.floor(this.timeRemaining / (1000 * 60 * 60));
});

// Check if user has viewed the story
storySchema.methods.hasViewed = function (userId) {
  return this.viewers.some(
    (viewer) => viewer.user.toString() === userId.toString()
  );
};

// Add viewer
storySchema.methods.addViewer = async function (userId) {
  if (!this.hasViewed(userId)) {
    this.viewers.push({ user: userId, viewedAt: new Date() });
    this.viewersCount = this.viewers.length;
    await this.save();
    return true;
  }
  return false;
};

// Static method to get stories for feed (from followed users + own)
storySchema.statics.getFeedStories = async function (userId, following) {
  const userIds = [...following, userId];

  const stories = await this.find({
    author: { $in: userIds },
    isActive: true,
    expiresAt: { $gt: new Date() }, // Not expired
  })
    .populate('author', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .lean();

  // Group stories by author
  const groupedStories = {};
  
  stories.forEach((story) => {
    const authorId = story.author._id.toString();
    
    if (!groupedStories[authorId]) {
      groupedStories[authorId] = {
        user: story.author,
        stories: [],
        hasUnviewed: false,
        latestStoryAt: story.createdAt,
      };
    }
    
    const hasViewed = story.viewers.some(
      (v) => v.user.toString() === userId.toString()
    );
    
    groupedStories[authorId].stories.push({
      ...story,
      hasViewed,
    });
    
    if (!hasViewed) {
      groupedStories[authorId].hasUnviewed = true;
    }
  });

  // Convert to array and sort (own stories first, then by hasUnviewed and latestStoryAt)
  const result = Object.values(groupedStories).sort((a, b) => {
    // Own stories first
    if (a.user._id.toString() === userId.toString()) return -1;
    if (b.user._id.toString() === userId.toString()) return 1;
    
    // Unviewed stories next
    if (a.hasUnviewed && !b.hasUnviewed) return -1;
    if (!a.hasUnviewed && b.hasUnviewed) return 1;
    
    // Then by latest story time
    return new Date(b.latestStoryAt) - new Date(a.latestStoryAt);
  });

  return result;
};

// Static method to get user's stories
storySchema.statics.getUserStories = async function (userId, currentUserId) {
  const stories = await this.find({
    author: userId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  })
    .populate('author', 'username fullName profileImage')
    .populate('viewers.user', 'username fullName profileImage')
    .sort({ createdAt: -1 })
    .lean();

  return stories.map((story) => ({
    ...story,
    hasViewed: story.viewers.some(
      (v) => v.user._id.toString() === currentUserId.toString()
    ),
  }));
};

// Ensure TTL index is created
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', storySchema);

export default Story;

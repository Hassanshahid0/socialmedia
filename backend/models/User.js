import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [50, 'Full name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: ['creator', 'consumer'],
      default: 'consumer',
    },
    profileImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for text search (username and email already indexed via unique: true)
userSchema.index({ fullName: 'text', username: 'text' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update followers count
userSchema.methods.updateFollowersCount = async function () {
  this.followersCount = this.followers.length;
  await this.save();
};

// Update following count
userSchema.methods.updateFollowingCount = async function () {
  this.followingCount = this.following.length;
  await this.save();
};

// Check if user is following another user
userSchema.methods.isFollowing = function (userId) {
  return this.following.some(
    (followingId) => followingId.toString() === userId.toString()
  );
};

// Check if user is a creator
userSchema.methods.isCreator = function () {
  return this.role === 'creator';
};

// Virtual for full profile URL
userSchema.virtual('profileImageUrl').get(function () {
  if (this.profileImage) {
    if (this.profileImage.startsWith('http')) {
      return this.profileImage;
    }
    return `/uploads/profiles/${this.profileImage}`;
  }
  return null;
});

// Static method to find by email or username
userSchema.statics.findByCredentials = async function (emailOrUsername) {
  return await this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername.toLowerCase() },
    ],
  }).select('+password');
};

// Static method to get user suggestions (users not followed by current user)
userSchema.statics.getSuggestions = async function (userId, limit = 5) {
  const currentUser = await this.findById(userId);
  if (!currentUser) return [];

  const suggestions = await this.find({
    _id: {
      $ne: userId,
      $nin: currentUser.following,
    },
    isActive: true,
  })
    .select('username fullName profileImage bio followersCount')
    .limit(limit)
    .sort({ followersCount: -1 });

  return suggestions;
};

const User = mongoose.model('User', userSchema);

export default User;

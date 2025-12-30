import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'share', 'message'],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    comment: {
      type: String,
      maxlength: 100,
    },
    message: {
      type: String,
      maxlength: 200,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  // Don't create notification if sender is recipient
  if (data.sender.toString() === data.recipient.toString()) {
    return null;
  }

  const notification = await this.create(data);
  
  // Populate sender info
  await notification.populate('sender', 'username fullName profileImage');
  
  return notification;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function (userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const notifications = await this.find({ recipient: userId })
    .populate('sender', 'username fullName profileImage')
    .populate('post', 'image caption')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const unreadCount = await this.countDocuments({ recipient: userId, read: false });

  return { notifications, unreadCount };
};

// Static method to mark as read
notificationSchema.statics.markAsRead = async function (notificationId, userId) {
  const notification = await this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );
  return notification;
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  await this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
  return true;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

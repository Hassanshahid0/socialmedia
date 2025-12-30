import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      default: null,
    },
    // For sharing posts in messages
    sharedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    // Message type: text, image, post
    messageType: {
      type: String,
      enum: ['text', 'image', 'post'],
      default: 'text',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // For message deletion (soft delete)
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ read: 1 });

// Static method to get messages for a conversation
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  userId,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;

  const messages = await this.find({
    conversation: conversationId,
    deletedFor: { $ne: userId },
  })
    .populate('sender', 'username fullName profileImage')
    .populate({
      path: 'sharedPost',
      select: 'image caption author',
      populate: {
        path: 'author',
        select: 'username fullName profileImage',
      },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Return in chronological order (oldest first)
  return messages.reverse();
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function (conversationId, userId) {
  const result = await this.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );
  return result.modifiedCount;
};

// Method to check if message is from sender
messageSchema.methods.isFromUser = function (userId) {
  return this.sender.toString() === userId.toString();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;

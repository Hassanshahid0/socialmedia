import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Track unread count per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = async function (userId1, userId2) {
  return await this.findOne({
    participants: { $all: [userId1, userId2], $size: 2 },
  })
    .populate('participants', 'username fullName profileImage')
    .populate('lastMessage');
};

// Static method to get or create conversation
conversationSchema.statics.getOrCreate = async function (userId1, userId2) {
  let conversation = await this.findBetweenUsers(userId1, userId2);

  if (!conversation) {
    conversation = await this.create({
      participants: [userId1, userId2],
      unreadCount: new Map([
        [userId1.toString(), 0],
        [userId2.toString(), 0],
      ]),
    });
    await conversation.populate('participants', 'username fullName profileImage');
  }

  return conversation;
};

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = async function (userId) {
  const conversations = await this.find({
    participants: userId,
  })
    .populate('participants', 'username fullName profileImage')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username fullName profileImage',
      },
    })
    .sort({ lastMessageAt: -1 })
    .lean();

  // Format conversations for the current user
  return conversations.map((conv) => {
    // Get the other participant
    const otherParticipant = conv.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );

    // Handle unreadCount - it might be a Map or plain object
    let unread = 0;
    if (conv.unreadCount) {
      if (conv.unreadCount instanceof Map) {
        unread = conv.unreadCount.get(userId.toString()) || 0;
      } else if (typeof conv.unreadCount === 'object') {
        unread = conv.unreadCount[userId.toString()] || 0;
      }
    }

    return {
      _id: conv._id,
      participant: {
        _id: otherParticipant?._id,
        username: otherParticipant?.username || 'Unknown',
        fullName: otherParticipant?.fullName || 'Unknown User',
        profileImage: otherParticipant?.profileImage || '',
      },
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: unread,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  });
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnread = async function (userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  await this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = async function (userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = async function (messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  await this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;

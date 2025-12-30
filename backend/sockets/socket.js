import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';

// Store online users
const onlineUsers = new Map();

export const initializeSocket = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.isBanned) {
        return next(new Error('Authentication error: User is banned'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    console.log(`User connected: ${socket.user.username} (${userId})`);
    
    // Join personal room for direct notifications
    socket.join(userId);
    
    // Add to online users
    onlineUsers.set(userId, {
      socketId: socket.id,
      user: {
        _id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar
      }
    });

    // Broadcast online status to followers
    broadcastOnlineStatus(io, socket.user, true);

    // Update last active
    User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`${socket.user.username} joined conversation: ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`${socket.user.username} left conversation: ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing_start', ({ conversationId, receiverId }) => {
      socket.to(receiverId).emit('user_typing', {
        conversationId,
        user: {
          _id: socket.user._id,
          username: socket.user.username
        }
      });
    });

    socket.on('typing_stop', ({ conversationId, receiverId }) => {
      socket.to(receiverId).emit('user_stopped_typing', {
        conversationId,
        userId: socket.user._id
      });
    });

    // Handle message seen
    socket.on('message_seen', async ({ conversationId, senderId }) => {
      try {
        await Message.markAsSeen(conversationId, userId);
        
        socket.to(senderId).emit('messages_seen', {
          conversationId,
          seenBy: userId
        });
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    });

    // Handle get online status
    socket.on('get_online_users', (userIds) => {
      const onlineStatus = {};
      userIds.forEach(id => {
        onlineStatus[id] = onlineUsers.has(id);
      });
      socket.emit('online_users', onlineStatus);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      onlineUsers.delete(userId);
      
      // Broadcast offline status
      broadcastOnlineStatus(io, socket.user, false);

      // Update last active
      User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Periodically clean up stale connections
  setInterval(() => {
    const sockets = io.sockets.sockets;
    onlineUsers.forEach((value, odKey) => {
      if (!sockets.has(value.socketId)) {
        onlineUsers.delete(key);
      }
    });
  }, 30000);
};

// Broadcast online status to user's followers
const broadcastOnlineStatus = async (io, user, isOnline) => {
  try {
    const fullUser = await User.findById(user._id).select('followers');
    
    if (fullUser && fullUser.followers) {
      fullUser.followers.forEach(followerId => {
        io.to(followerId.toString()).emit('user_status_change', {
          userId: user._id,
          username: user.username,
          isOnline,
          lastActive: isOnline ? null : new Date()
        });
      });
    }
  } catch (error) {
    console.error('Error broadcasting online status:', error);
  }
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

// Helper function to get online users
export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Helper function to emit to specific user
export const emitToUser = (io, userId, event, data) => {
  io.to(userId.toString()).emit(event, data);
};

export default { initializeSocket, isUserOnline, getOnlineUsers, emitToUser };

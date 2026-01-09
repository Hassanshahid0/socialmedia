import { Server } from 'socket.io';

let io;

// Store online users: { odId: odketId }
const onlineUsers = new Map();

const initializeSocket = (server) => {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // User joins with their userId
    socket.on('join', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        // Join a personal room with their userId for direct notifications
        socket.join(userId.toString());
        console.log(`👤 User ${userId} joined room ${userId.toString()} (socket: ${socket.id})`);
        
        // Notify others that user is online
        socket.broadcast.emit('user_online', userId);
      }
    });

    // Join a conversation room
    socket.on('join_room', (conversationId) => {
      socket.join(conversationId);
      console.log(`💬 User joined room: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leave_room', (conversationId) => {
      socket.leave(conversationId);
      console.log(`🚪 User left room: ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data) => {
      const { conversationId, message } = data;
      // Emit to all users in the conversation room
      socket.to(conversationId).emit('receive_message', message);
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { conversationId, userId } = data;
      socket.to(conversationId).emit('user_typing', { conversationId, userId });
    });

    socket.on('stop_typing', (data) => {
      const { conversationId, userId } = data;
      socket.to(conversationId).emit('user_stop_typing', { conversationId, userId });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`👋 User ${socket.userId} disconnected`);
        
        // Notify others that user is offline
        socket.broadcast.emit('user_offline', socket.userId);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
};

// Get socket ID by user ID
const getSocketId = (userId) => {
  return onlineUsers.get(userId);
};

// Check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Get all online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Send notification to specific user
const sendNotificationToUser = (userId, notification) => {
  // Emit to user's personal room (userId) - more reliable
  io.to(userId.toString()).emit('new_notification', notification);
  console.log('📢 Sent notification to user room:', userId.toString());
  return true;
};

// Send message notification to specific user
const sendMessageNotification = (userId, data) => {
  io.to(userId.toString()).emit('new_message_notification', data);
  console.log('📩 Sent message notification to user room:', userId.toString());
  return true;
};

export {
  initializeSocket,
  getIO,
  getSocketId,
  isUserOnline,
  getOnlineUsers,
  sendNotificationToUser,
  sendMessageNotification,
};

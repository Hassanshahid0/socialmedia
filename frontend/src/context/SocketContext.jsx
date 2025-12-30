import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    if (user && token) {
      // Connect to Socket.IO server (use proxy in development)
      const socketUrl = import.meta.env.PROD 
        ? window.location.origin 
        : 'http://localhost:5008';
      
      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected:', newSocket.id);
        setIsConnected(true);
        // Join with user ID as string
        console.log('👤 Joining room with user ID:', user._id);
        newSocket.emit('join', user._id.toString());
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('user_online', (userId) => {
        setOnlineUsers((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      });

      newSocket.on('user_offline', (userId) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      // Listen for new message notifications
      newSocket.on('new_message_notification', (data) => {
        console.log('📩📩📩 NEW MESSAGE NOTIFICATION RECEIVED:', data);
        setUnreadMessages((prev) => {
          console.log('📩 Unread messages count:', prev + 1);
          return prev + 1;
        });
      });

      // Also listen for receive_message when not in chat
      newSocket.on('receive_message', (data) => {
        console.log('📨 Received message:', data);
        // This will be handled by ChatWindow if user is in that conversation
        // But we can use it to show red dot too
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.off('new_message_notification');
        newSocket.off('receive_message');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setUnreadMessages(0);
      };
    }
  }, [user, token]);

  // Join a conversation room
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  // Leave a conversation room
  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave_room', roomId);
    }
  };

  // Send a message
  const sendMessage = (conversationId, message) => {
    if (socket) {
      socket.emit('send_message', { conversationId, message });
    }
  };

  // Typing indicators
  const startTyping = (conversationId) => {
    if (socket && user) {
      socket.emit('typing', { conversationId, userId: user._id });
    }
  };

  const stopTyping = (conversationId) => {
    if (socket && user) {
      socket.emit('stop_typing', { conversationId, userId: user._id });
    }
  };

  // Check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // Clear unread messages count
  const clearUnreadMessages = () => {
    setUnreadMessages(0);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    unreadMessages,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    clearUnreadMessages,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

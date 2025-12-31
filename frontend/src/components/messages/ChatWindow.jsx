import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { messageService } from '../../services/messageService';
import Avatar from '../common/Avatar';
import MessageBubble from './MessageBubble';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversation, onBack, onMessageSent }) => {
  const { user } = useAuth();
  const { socket, isUserOnline, joinRoom, leaveRoom } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const participant = conversation?.participant;
  const isOnline = isUserOnline(participant?._id);

  // Join room and fetch messages on conversation change
  useEffect(() => {
    if (conversation?._id) {
      joinRoom(conversation._id);
      fetchMessages();
      
      // Mark as read
      messageService.markAsRead(conversation._id).catch(console.error);

      return () => {
        leaveRoom(conversation._id);
      };
    }
  }, [conversation?._id]);

  // Socket event listeners
  useEffect(() => {
    if (socket && conversation?._id) {
      const handleReceiveMessage = (data) => {
        // Only add message if it's from someone else (not self)
        const messageFromSelf = data.message?.sender?._id === user._id || 
                                data.message?.sender === user._id;
        
        if (data.conversationId === conversation._id && !messageFromSelf) {
          setMessages((prev) => [...prev, data.message]);
          scrollToBottom();
          
          // Mark as read
          messageService.markAsRead(conversation._id).catch(console.error);
        }
      };

      const handleUserTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId !== user._id) {
          setIsTyping(true);
        }
      };

      const handleUserStopTyping = (data) => {
        if (data.conversationId === conversation._id && data.userId !== user._id) {
          setIsTyping(false);
        }
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleUserStopTyping);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleUserStopTyping);
      };
    }
  }, [socket, conversation?._id, user._id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
      // Auto focus input when messages load
      inputRef.current?.focus();
    }
  }, [messages, loading]);

  // Auto focus input when conversation changes
  useEffect(() => {
    if (conversation?._id) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [conversation?._id]);

  const fetchMessages = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    
    try {
      const response = await messageService.getMessages(conversation._id, pageNum);
      console.log('Messages response:', response);
      
      // Handle different response formats
      const newMessages = response.messages || response.data?.messages || [];
      
      if (pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages((prev) => [...newMessages, ...prev]);
      }
      
      setHasMore(response.data?.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() && !sending) {
        handleSend(e);
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing event
    if (socket) {
      socket.emit('typing', { 
        conversationId: conversation._id, 
        userId: user._id 
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { 
          conversationId: conversation._id, 
          userId: user._id 
        });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    if (socket) {
      socket.emit('stop_typing', { 
        conversationId: conversation._id, 
        userId: user._id 
      });
    }

    try {
      const response = await messageService.sendMessage({
        conversationId: conversation._id,
        text: messageText,
      });

      console.log('Send message response:', response);
      const sentMessage = response.message || response.data?.message;
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
        onMessageSent?.(sentMessage, conversation._id);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
      // Keep focus on input after sending
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSending(true);
    try {
      const response = await messageService.sendMessage({
        conversationId: conversation._id,
        image: file,
      });

      console.log('Send image response:', response);
      const sentMessage = response.message || response.data?.message;
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
        onMessageSent?.(sentMessage, conversation._id);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Send image error:', error);
      toast.error('Failed to send image');
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Keep focus on input after image upload
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="md:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <Link 
          to={`/profile/${participant?.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <Avatar
              src={participant?.profileImage}
              alt={participant?.username}
              size="md"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{participant?.username}</p>
            <p className="text-xs text-gray-500">
              {isTyping ? (
                <span className="text-primary-500">Typing...</span>
              ) : isOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pb-4">
                <button
                  onClick={handleLoadMore}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Say hello to start the conversation!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender?._id === user._id || 
                              message.sender === user._id;
                const showAvatar = 
                  index === 0 || 
                  messages[index - 1]?.sender?._id !== message.sender?._id;

                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar && !isOwn}
                    participant={participant}
                  />
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <Avatar
                  src={participant?.profileImage}
                  alt={participant?.username}
                  size="sm"
                />
                <div className="bg-gray-200 rounded-full px-4 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            disabled={sending}
            autoFocus
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;

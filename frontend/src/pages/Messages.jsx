import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { messageService } from '../services/messageService';
import { userService } from '../services/userService';
import ConversationList from '../components/messages/ConversationList';
import ChatWindow from '../components/messages/ChatWindow';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import toast from 'react-hot-toast';

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, clearUnreadMessages } = useSocket();
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL param for conversation
  useEffect(() => {
    if (conversationId) {
      // First check if conversation exists in list
      const conv = conversations.find((c) => c._id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
      } else if (!loading) {
        // Fetch the specific conversation if not in list and not loading
        fetchConversation(conversationId);
      }
    }
  }, [conversationId, conversations, loading]);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('new_message_notification', handleNewMessage);
      
      return () => {
        socket.off('new_message_notification');
      };
    }
  }, [socket, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await messageService.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (convId) => {
    try {
      const response = await messageService.getConversation(convId);
      if (response.data.conversation) {
        setSelectedConversation(response.data.conversation);
        // Add to conversations if not already there
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === convId);
          if (!exists) {
            return [response.data.conversation, ...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      navigate('/messages');
    }
  };

  const handleNewMessage = (data) => {
    const { conversationId: convId, message, sender } = data;

    // Update conversations list
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv._id === convId) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: selectedConversation?._id === convId 
              ? 0 
              : (conv.unreadCount || 0) + 1,
          };
        }
        return conv;
      });

      // Sort by lastMessageAt
      return updated.sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    });
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation._id}`);

    // Reset unread count
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversation._id ? { ...conv, unreadCount: 0 } : conv
      )
    );

    // Clear red dot on navbar
    clearUnreadMessages();
  };

  const handleBack = () => {
    setSelectedConversation(null);
    navigate('/messages');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await userService.searchUsers(query);
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleStartConversation = async (recipient) => {
    try {
      const response = await messageService.startConversation(recipient._id);
      const newConv = response.data.conversation;

      // Add to conversations if not exists
      setConversations((prev) => {
        const exists = prev.find((c) => c._id === newConv._id);
        if (!exists) {
          return [newConv, ...prev];
        }
        return prev;
      });

      // Select the conversation
      setSelectedConversation(newConv);
      navigate(`/messages/${newConv._id}`);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const handleMessageSent = (message, convId) => {
    // Update conversation's last message
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv._id === convId) {
          return {
            ...conv,
            lastMessage: message,
            lastMessageAt: message.createdAt,
          };
        }
        return conv;
      });

      // Sort by lastMessageAt
      return updated.sort(
        (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
      );
    });
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden" 
      style={{ height: 'calc(100vh - 140px)' }}
    >
      <div className="flex h-full">
        {/* Conversations List */}
        <div 
          className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="New message"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?._id}
            onSelect={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Chat Window */}
        <div 
          className={`flex-1 flex flex-col ${
            !selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={handleBack}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Your Messages
                </h3>
                <p className="text-gray-500 mt-2">
                  Select a conversation or start a new one
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => {
          setShowNewChat(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        title="New Message"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              autoFocus
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <p className="text-center text-gray-500 py-8">
                Type at least 2 characters to search
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No users found
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((searchUser) => (
                  <button
                    key={searchUser._id}
                    onClick={() => handleStartConversation(searchUser)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Avatar
                      src={searchUser.profileImage}
                      alt={searchUser.username}
                      size="md"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">
                        {searchUser.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {searchUser.fullName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Messages;

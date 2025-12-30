import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { messageService } from '../../services/messageService';
import { postService } from '../../services/postService';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const SharePostModal = ({ post, onClose, onShare }) => {
  const { user } = useAuth();
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    fetchFollowing();
  }, []);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const response = await userService.getFollowing(user._id);
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
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
      // Filter out current user
      const filtered = (response.data.users || []).filter(
        (u) => u._id !== user._id
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async (recipient) => {
    setSending(recipient._id);
    
    try {
      // Start conversation and send the shared post
      await messageService.startConversation(
        recipient._id,
        `Check out this post!`,
        post._id
      );

      // Track share on the post
      await postService.sharePost(post._id, recipient._id);

      toast.success(`Post shared with ${recipient.username}!`);
      onShare?.();
      onClose();
    } catch (error) {
      toast.error('Failed to share post');
      console.error('Share error:', error);
    } finally {
      setSending(null);
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success('Link copied to clipboard!');
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : following;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Share Post</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            {post.image && (
              <img
                src={post.image.startsWith('http') ? post.image : `/uploads/posts/${post.image}`}
                alt=""
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-800">
                @{post.author?.username}
              </p>
              <p className="text-xs text-gray-500 truncate mt-1">
                {post.caption || 'No caption'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
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
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">
                {searchQuery.length >= 2 ? '🔍' : '👥'}
              </div>
              <p className="text-gray-500">
                {searchQuery.length >= 2
                  ? 'No users found'
                  : 'Follow users to share posts with them'}
              </p>
            </div>
          ) : (
            <>
              {/* Section Header */}
              <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                {searchQuery.length >= 2 ? 'Search Results' : 'Following'}
              </div>

              {/* User List */}
              {displayUsers.map((recipient) => (
                <div
                  key={recipient._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={recipient.profileImage}
                      alt={recipient.username}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {recipient.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {recipient.fullName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShare(recipient)}
                    disabled={sending === recipient._id}
                    className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 min-w-[70px]"
                  >
                    {sending === recipient._id ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer - Copy Link */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;

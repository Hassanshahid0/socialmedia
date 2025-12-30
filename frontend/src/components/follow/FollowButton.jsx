import { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const FollowButton = ({ userId, initialFollowing = false, onFollowChange, size = 'md' }) => {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  // Sync with initialFollowing when it changes (e.g., when search results update)
  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, userId]);

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-6 py-2 text-base',
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await userService.unfollowUser(userId);
        toast.success('Unfollowed');
      } else {
        await userService.followUser(userId);
        toast.success('Following!');
      }
      setFollowing(!following);
      onFollowChange?.(!following);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses[size]} font-semibold rounded-lg transition-colors disabled:opacity-50 ${
        following
          ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          : 'bg-primary-500 hover:bg-primary-600 text-white'
      }`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton;

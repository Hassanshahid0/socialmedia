import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import Avatar from '../common/Avatar';
import FollowButton from '../follow/FollowButton';
import { useAuth } from '../../hooks/useAuth';

const FollowingList = ({ userId }) => {
  const { user: currentUser } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const response = await userService.getFollowing(userId);
      setFollowing(response.data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
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
    );
  }

  if (following.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-gray-500">Not following anyone yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {following.map((user) => (
        <div key={user._id} className="flex items-center justify-between">
          <Link
            to={`/profile/${user.username}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Avatar
              src={user.profileImage}
              alt={user.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-800">{user.username}</p>
              <p className="text-sm text-gray-500">{user.fullName}</p>
            </div>
          </Link>
          {currentUser?._id !== user._id && (
            <FollowButton userId={user._id} initialFollowing={true} size="sm" />
          )}
        </div>
      ))}
    </div>
  );
};

export default FollowingList;

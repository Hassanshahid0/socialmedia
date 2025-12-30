import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import Avatar from '../common/Avatar';
import FollowButton from '../follow/FollowButton';
import { useAuth } from '../../hooks/useAuth';

const FollowersList = ({ userId }) => {
  const { user: currentUser } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const response = await userService.getFollowers(userId);
      setFollowers(response.data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
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

  if (followers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">👥</div>
        <p className="text-gray-500">No followers yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {followers.map((follower) => (
        <div key={follower._id} className="flex items-center justify-between">
          <Link
            to={`/profile/${follower.username}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Avatar
              src={follower.profileImage}
              alt={follower.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-800">{follower.username}</p>
              <p className="text-sm text-gray-500">{follower.fullName}</p>
            </div>
          </Link>
          {currentUser?._id !== follower._id && (
            <FollowButton userId={follower._id} initialFollowing={false} size="sm" />
          )}
        </div>
      ))}
    </div>
  );
};

export default FollowersList;

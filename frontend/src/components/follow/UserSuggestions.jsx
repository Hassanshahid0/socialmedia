import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import Avatar from '../common/Avatar';
import FollowButton from './FollowButton';

const UserSuggestions = ({ limit = 5 }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await userService.getSuggestions(limit);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId, isFollowing) => {
    if (isFollowing) {
      // Remove from suggestions when followed
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Suggested for you</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Suggested for you</h3>
        <Link
          to="/explore"
          className="text-sm text-primary-500 hover:text-primary-600 font-medium"
        >
          See All
        </Link>
      </div>

      <div className="space-y-4">
        {suggestions.map((user) => (
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
                <p className="font-semibold text-gray-800 text-sm">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500">{user.fullName}</p>
              </div>
            </Link>
            <FollowButton
              userId={user._id}
              initialFollowing={false}
              onFollowChange={(isFollowing) => handleFollowChange(user._id, isFollowing)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSuggestions;

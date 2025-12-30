import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import Loader from '../components/common/Loader';
import Avatar from '../components/common/Avatar';
import FollowButton from '../components/follow/FollowButton';
import toast from 'react-hot-toast';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const response = await userService.getSuggestions(20);
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
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
      setSearchResults(response.data.users || []);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : suggestions;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
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
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Results / Suggestions */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {searchQuery.length >= 2 ? 'Search Results' : 'Suggested for You'}
          </h2>
        </div>

        {loading ? (
          <div className="p-8">
            <Loader />
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">
              {searchQuery.length >= 2 ? '🔍' : '👥'}
            </div>
            <p className="text-gray-500">
              {searchQuery.length >= 2
                ? 'No users found'
                : 'No suggestions available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.profileImage}
                    alt={user.username}
                    size="md"
                  />
                  <div>
                    <a
                      href={`/profile/${user.username}`}
                      className="font-semibold text-gray-800 hover:underline"
                    >
                      {user.username}
                    </a>
                    <p className="text-sm text-gray-500">{user.fullName}</p>
                    {user.bio && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>
                <FollowButton userId={user._id} initialFollowing={user.isFollowing || false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;

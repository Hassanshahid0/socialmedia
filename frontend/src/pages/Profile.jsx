import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import ProfileHeader from '../components/profile/ProfileHeader';
import PostCard from '../components/posts/PostCard';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await userService.getProfile(username);
      const userProfile = response.data.user;
      setProfile(userProfile);
      
      // Fetch user's posts
      if (userProfile._id) {
        try {
          const postsResponse = await postService.getUserPosts(userProfile._id);
          console.log('User posts response:', postsResponse);
          const userPosts = postsResponse.data?.posts || postsResponse.posts || [];
          setPosts(userPosts);
        } catch (postError) {
          console.error('Error fetching posts:', postError);
          setPosts([]);
        }
      }
      
      // Fetch saved posts if own profile
      if (currentUser?.username === username) {
        try {
          const savedResponse = await postService.getSavedPosts();
          console.log('Saved posts response:', savedResponse);
          const saved = savedResponse.data?.posts || savedResponse.posts || [];
          setSavedPosts(saved);
        } catch (savedError) {
          console.error('Error fetching saved posts:', savedError);
          setSavedPosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (isFollowing) => {
    setProfile((prev) => ({
      ...prev,
      isFollowing,
      followersCount: isFollowing
        ? prev.followersCount + 1
        : prev.followersCount - 1,
    }));
  };

  if (loading) {
    return <Loader />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800">User not found</h2>
        <p className="text-gray-500 mt-2">
          The user you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onFollowChange={handleFollowChange}
        onProfileUpdate={(updates) => setProfile({ ...profile, ...updates })}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mt-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-primary-500 border-b-2 border-primary-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Posts ({posts.length})
          </span>
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'saved'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved ({savedPosts.length})
            </span>
          </button>
        )}
      </div>

      {/* Posts Grid/List */}
      <div className="mt-6">
        {activeTab === 'posts' ? (
          // User's Posts
          posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-800">No posts yet</h3>
              <p className="text-gray-500 mt-2">
                {isOwnProfile
                  ? 'Share your first photo!'
                  : 'This user hasn\'t posted anything yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={{
                    ...post,
                    author: post.author || profile,
                  }}
                  onDelete={(postId) => {
                    setPosts(posts.filter(p => p._id !== postId));
                    setProfile(prev => ({
                      ...prev,
                      postsCount: Math.max(0, (prev.postsCount || 1) - 1)
                    }));
                  }}
                  onUpdate={(updatedPost) => {
                    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
                  }}
                />
              ))}
            </div>
          )
        ) : (
          // Saved Posts (only visible on own profile)
          savedPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="text-6xl mb-4">🔖</div>
              <h3 className="text-xl font-semibold text-gray-800">No saved posts</h3>
              <p className="text-gray-500 mt-2">
                Save posts to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {savedPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={{
                    ...post,
                    isSaved: true,
                  }}
                  onDelete={(postId) => {
                    setSavedPosts(savedPosts.filter(p => p._id !== postId));
                  }}
                  onUpdate={(updatedPost) => {
                    setSavedPosts(savedPosts.map(p => p._id === updatedPost._id ? updatedPost : p));
                  }}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Profile;

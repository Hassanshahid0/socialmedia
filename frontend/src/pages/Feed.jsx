import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { postService } from '../services/postService';
import StoryBar from '../components/stories/StoryBar';
import PostCard from '../components/posts/PostCard';
import PostForm from '../components/posts/PostForm';
import UserSuggestions from '../components/follow/UserSuggestions';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const Feed = () => {
  const { user, isCreator } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await postService.getFeedPosts(1, 10);
      console.log('Feed posts response:', response);
      const feedPosts = response.data?.posts || response.posts || [];
      setPosts(feedPosts);
      setHasMore(response.data?.hasMore || false);
      setPage(1);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await postService.getFeedPosts(nextPage, 10);
      const morePosts = response.data?.posts || response.posts || [];
      setPosts((prev) => [...prev, ...morePosts]);
      setHasMore(response.data?.hasMore || false);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNewPost = (newPost) => {
    // Add the new post to the beginning of the list
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map((post) => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000
    ) {
      loadMorePosts();
    }
  }, [page, hasMore, loadingMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Stories Section */}
      <StoryBar />

      {/* Create Post (Only for Creators) */}
      {isCreator && <PostForm onPostCreated={handleNewPost} />}

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 mb-4">
              Follow some users to see their posts here, or create your first post!
            </p>
            {/* User Suggestions */}
            <UserSuggestions />
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onDelete={handlePostDelete}
                onUpdate={handlePostUpdate}
              />
            ))}
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="py-4">
                <Loader />
              </div>
            )}
            
            {/* No more posts */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>You've seen all posts! 🎉</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sidebar Suggestions (visible on larger screens via CSS in component) */}
      {posts.length > 0 && (
        <div className="hidden lg:block fixed right-8 top-24 w-80">
          <UserSuggestions />
        </div>
      )}
    </div>
  );
};

export default Feed;

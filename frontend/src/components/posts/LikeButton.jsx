import { useState } from 'react';
import { postService } from '../../services/postService';

const LikeButton = ({ postId, initialLiked = false, initialCount = 0 }) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    
    // Optimistic update
    const wasLiked = liked;
    const prevCount = count;
    
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setAnimating(true);
    setLoading(true);

    try {
      const response = await postService.toggleLike(postId);
      // Update with server response
      setLiked(response.data.isLiked);
      setCount(response.data.likesCount);
    } catch (error) {
      // Revert on error
      setLiked(wasLiked);
      setCount(prevCount);
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }

    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className="flex items-center gap-1.5 transition-colors disabled:opacity-70"
    >
      <svg
        className={`w-6 h-6 transition-transform ${
          animating ? 'scale-125' : 'scale-100'
        } ${liked ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className={`text-sm font-medium ${liked ? 'text-red-500' : 'text-gray-600'}`}>
        {count}
      </span>
    </button>
  );
};

export default LikeButton;

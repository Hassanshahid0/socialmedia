import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../services/postService';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const CommentForm = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await postService.addComment(postId, text.trim());
      onCommentAdded(response.data.comment);
      setText('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Avatar src={user?.profileImage} alt={user?.username} size="sm" />
      <div className="flex-1 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full py-2 pr-16 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          disabled={loading}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:text-primary-600 transition-colors"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            'Post'
          )}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;

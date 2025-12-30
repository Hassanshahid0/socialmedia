import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../services/postService';
import Avatar from '../common/Avatar';
import CommentForm from './CommentForm';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const CommentList = ({ postId, onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await postService.getComments(postId);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (comment) => {
    setComments([...comments, comment]);
    onCommentAdded?.();
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await postService.deleteComment(postId, commentId);
      setComments(comments.filter((c) => c._id !== commentId));
      onCommentDeleted?.();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="mt-4 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {/* Comments */}
      <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex gap-2 group">
              <Link to={`/profile/${comment.author?.username}`}>
                <Avatar
                  src={comment.author?.profileImage}
                  alt={comment.author?.username}
                  size="sm"
                />
              </Link>
              <div className="flex-1">
                <div className="bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/profile/${comment.author?.username}`}
                      className="font-semibold text-sm text-gray-800 hover:underline"
                    >
                      {comment.author?.username}
                    </Link>
                    {user?._id === comment.author?._id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                        title="Delete comment"
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-2">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Form */}
      <CommentForm postId={postId} onCommentAdded={handleNewComment} />
    </div>
  );
};

export default CommentList;

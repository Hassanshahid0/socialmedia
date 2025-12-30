import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { postService } from '../../services/postService';
import Avatar from '../common/Avatar';
import LikeButton from './LikeButton';
import CommentList from './CommentList';
import SharePostModal from '../messages/SharePostModal';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentsCount || 0);
  const [shareCount, setShareCount] = useState(post.sharesCount || 0);
  
  // Double-click like state
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [isLikedState, setIsLikedState] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  
  // Save post state
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [saving, setSaving] = useState(false);
  
  // Double-click handler for like
  const handleDoubleClick = async () => {
    // Show heart animation
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
    
    // Only like if not already liked
    if (!isLikedState) {
      try {
        const response = await postService.toggleLike(post._id);
        setIsLikedState(response.data.isLiked);
        setLikesCount(response.data.likesCount);
      } catch (error) {
        console.error('Like error:', error);
      }
    }
  };
  
  // Save/unsave handler
  const handleSaveToggle = async () => {
    if (saving) return;
    setSaving(true);
    
    try {
      if (isSaved) {
        await postService.unsavePost(post._id);
        setIsSaved(false);
        toast.success('Post removed from saved');
      } else {
        await postService.savePost(post._id);
        setIsSaved(true);
        toast.success('Post saved!');
      }
    } catch (error) {
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const isOwner = user?._id === post.author?._id;

  // Build image URL - handle different formats
  const getImageUrl = () => {
    if (!post.image) return null;
    if (post.image.startsWith('http')) return post.image;
    if (post.image.startsWith('/uploads')) return post.image;
    return `/uploads/posts/${post.image}`;
  };
  
  const imageUrl = getImageUrl();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postService.deletePost(post._id);
      toast.success('Post deleted');
      onDelete?.(post._id);
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    setShareCount((prev) => prev + 1);
    setShowShareModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link
            to={`/profile/${post.author?.username}`}
            className="flex items-center gap-3"
          >
            <Avatar
              src={post.author?.profileImage}
              alt={post.author?.username}
              size="md"
            />
            <div>
              <p className="font-semibold text-gray-800 hover:underline">
                {post.author?.username}
              </p>
              <p className="text-xs text-gray-500">
                {post.createdAt && formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {/* More Options */}
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            
            {showOptions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowOptions(false)} 
                />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
                  {isOwner && (
                    <button
                      onClick={() => {
                        setShowOptions(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-50 transition-colors"
                    >
                      Delete Post
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                      toast.success('Link copied!');
                      setShowOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Copy Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Image with Double-Click to Like */}
        {post.image && (
          <div 
            className="aspect-square bg-gray-100 relative cursor-pointer select-none"
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              draggable="false"
            />
            
            {/* Heart Animation on Double-Click */}
            {showHeartAnimation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg
                  className="w-24 h-24 text-white drop-shadow-lg animate-heart-pop"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
                  }}
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              {/* Like Button - synced with double-click */}
              <button
                onClick={async () => {
                  try {
                    const response = await postService.toggleLike(post._id);
                    setIsLikedState(response.data.isLiked);
                    setLikesCount(response.data.likesCount);
                  } catch (error) {
                    console.error('Like error:', error);
                  }
                }}
                className="flex items-center gap-1.5 transition-colors"
              >
                <svg
                  className={`w-6 h-6 transition-transform hover:scale-110 ${
                    isLikedState ? 'text-red-500 fill-red-500' : 'text-gray-600'
                  }`}
                  fill={isLikedState ? 'currentColor' : 'none'}
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
                <span className={`text-sm font-medium ${isLikedState ? 'text-red-500' : 'text-gray-600'}`}>
                  {likesCount}
                </span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors"
              >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm font-medium">{commentCount}</span>
            </button>

            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {shareCount > 0 && (
                <span className="text-sm font-medium">{shareCount}</span>
              )}
            </button>
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSaveToggle}
              disabled={saving}
              className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              title={isSaved ? 'Unsave post' : 'Save post'}
            >
              <svg
                className={`w-6 h-6 ${isSaved ? 'text-gray-900 fill-gray-900' : ''}`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          {/* Caption */}
          {post.caption && (
            <p className="text-gray-800">
              <Link
                to={`/profile/${post.author?.username}`}
                className="font-semibold hover:underline mr-2"
              >
                {post.author?.username}
              </Link>
              {post.caption}
            </p>
          )}

          {/* Comments Preview */}
          {commentCount > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-gray-500 mt-2 hover:text-gray-700"
            >
              View all {commentCount} comments
            </button>
          )}

          {/* Comments Section */}
          {showComments && (
            <CommentList
              postId={post._id}
              onCommentAdded={() => setCommentCount((c) => c + 1)}
              onCommentDeleted={() => setCommentCount((c) => Math.max(0, c - 1))}
            />
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <SharePostModal
          post={post}
          onClose={() => setShowShareModal(false)}
          onShare={handleShare}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Post"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PostCard;

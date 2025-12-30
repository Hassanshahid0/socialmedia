import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { storyService } from '../../services/storyService';
import Avatar from '../common/Avatar';
import Modal from '../common/Modal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const StoryViewer = ({
  group,
  initialIndex = 0,
  onClose,
  onNextGroup,
  onPrevGroup,
  hasNextGroup,
  hasPrevGroup,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const stories = group.stories || [];
  const currentStory = stories[currentIndex];
  const isOwnStory = group.user._id === user?._id;
  const storyDuration = 5000; // 5 seconds per story

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.hasViewed && !isOwnStory) {
      storyService.viewStory(currentStory._id).catch(console.error);
    }
  }, [currentStory?._id]);

  // Progress bar timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (storyDuration / 100));
        
        if (newProgress >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else if (hasNextGroup) {
            onNextGroup();
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, stories.length, hasNextGroup]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [currentIndex, group.user._id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stories.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else if (hasNextGroup) {
      onNextGroup();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, hasNextGroup]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else if (hasPrevGroup) {
      onPrevGroup();
    }
  }, [currentIndex, hasPrevGroup]);

  const handleDelete = async () => {
    if (!currentStory) return;

    try {
      await storyService.deleteStory(currentStory._id);
      toast.success('Story deleted');
      
      if (stories.length === 1) {
        onClose();
      } else if (currentIndex === stories.length - 1) {
        setCurrentIndex(currentIndex - 1);
      }
    } catch (error) {
      toast.error('Failed to delete story');
    }
  };

  const fetchViewers = async () => {
    if (!currentStory || loadingViewers) return;

    setLoadingViewers(true);
    try {
      const response = await storyService.getStoryViewers(currentStory._id);
      setViewers(response.data.viewers || []);
    } catch (error) {
      console.error('Error fetching viewers:', error);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleShowViewers = () => {
    setShowViewers(true);
    setIsPaused(true);
    fetchViewers();
  };

  if (!currentStory) return null;

  const imageUrl = currentStory.image?.startsWith('http')
    ? currentStory.image
    : `/uploads/stories/${currentStory.image}`;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-20"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-20">
          Paused
        </div>
      )}

      {/* Story Content */}
      <div 
        className="relative w-full max-w-md h-full max-h-[85vh] mx-4"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width:
                    index < currentIndex
                      ? '100%'
                      : index === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 left-4 right-4 flex items-center justify-between z-10">
          <Link
            to={`/profile/${group.user.username}`}
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <Avatar
              src={group.user.profileImage}
              alt={group.user.username}
              size="md"
            />
            <div>
              <p className="text-white font-semibold">{group.user.username}</p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </p>
            </div>
          </Link>

          {/* Actions for own stories */}
          {isOwnStory && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowViewers}
                className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {currentStory.viewersCount || 0}
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-white/80 hover:text-red-400 transition-colors"
                title="Delete story"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-8 left-4 right-4 z-10">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
              <p className="text-white">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          <button
            onClick={handlePrev}
            className="w-1/3 h-full focus:outline-none"
            disabled={currentIndex === 0 && !hasPrevGroup}
          />
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="w-1/3 h-full focus:outline-none"
          />
          <button
            onClick={handleNext}
            className="w-1/3 h-full focus:outline-none"
          />
        </div>

        {/* Navigation Arrows */}
        {(currentIndex > 0 || hasPrevGroup) && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {(currentIndex < stories.length - 1 || hasNextGroup) && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Viewers Modal */}
      {showViewers && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[60vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                Viewers ({currentStory.viewersCount || 0})
              </h3>
              <button
                onClick={() => {
                  setShowViewers(false);
                  setIsPaused(false);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {loadingViewers ? (
                <div className="p-8 flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : viewers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No viewers yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {viewers.map((viewer) => (
                    <Link
                      key={viewer.user._id}
                      to={`/profile/${viewer.user.username}`}
                      onClick={onClose}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        src={viewer.user.profileImage}
                        alt={viewer.user.username}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {viewer.user.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;

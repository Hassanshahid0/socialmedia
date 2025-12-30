import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { storyService } from '../../services/storyService';
import StoryCard from './StoryCard';
import StoryUpload from './StoryUpload';
import StoryViewer from './StoryViewer';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const StoryBar = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const response = await storyService.getFeedStories();
      setStoryGroups(response.data.stories || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (group, index = 0) => {
    setSelectedGroup(group);
    setSelectedStoryIndex(index);
  };

  const handleStoryClose = () => {
    setSelectedGroup(null);
    setSelectedStoryIndex(0);
    // Refresh stories to update viewed status
    fetchStories();
  };

  const handleStoryUploaded = (newStory) => {
    // Add or update user's story group
    setStoryGroups((prev) => {
      const userGroupIndex = prev.findIndex(
        (g) => g.user._id === user._id
      );

      if (userGroupIndex >= 0) {
        // Add to existing group
        const updated = [...prev];
        updated[userGroupIndex] = {
          ...updated[userGroupIndex],
          stories: [newStory, ...updated[userGroupIndex].stories],
        };
        return updated;
      } else {
        // Create new group at the start
        return [
          {
            user: {
              _id: user._id,
              username: user.username,
              fullName: user.fullName,
              profileImage: user.profileImage,
            },
            stories: [newStory],
            hasUnviewed: false,
          },
          ...prev,
        ];
      }
    });
    setShowUpload(false);
    toast.success('Story uploaded!');
  };

  const handleNextGroup = () => {
    const currentIndex = storyGroups.findIndex(
      (g) => g.user._id === selectedGroup.user._id
    );
    if (currentIndex < storyGroups.length - 1) {
      setSelectedGroup(storyGroups[currentIndex + 1]);
      setSelectedStoryIndex(0);
    } else {
      handleStoryClose();
    }
  };

  const handlePrevGroup = () => {
    const currentIndex = storyGroups.findIndex(
      (g) => g.user._id === selectedGroup.user._id
    );
    if (currentIndex > 0) {
      setSelectedGroup(storyGroups[currentIndex - 1]);
      setSelectedStoryIndex(0);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Check if current user has stories
  const userHasStories = storyGroups.some((g) => g.user._id === user?._id);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="w-12 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          {/* Scroll Buttons */}
          {storyGroups.length > 4 && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Stories */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-2"
          >
            {/* Add Story Button */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className="relative">
                <div className={`p-0.5 rounded-full ${userHasStories ? 'story-ring' : 'bg-gray-200'}`}>
                  <div className="p-0.5 bg-white rounded-full">
                    <Avatar src={user?.profileImage} alt={user?.username} size="lg" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">Your Story</span>
            </button>

            {/* User Story Groups */}
            {storyGroups.map((group) => (
              // Skip current user's stories in the loop (shown as "Your Story")
              group.user._id !== user?._id && (
                <StoryCard
                  key={group.user._id}
                  group={group}
                  onClick={() => handleStoryClick(group)}
                />
              )
            ))}

            {storyGroups.length <= 1 && (
              <div className="flex items-center justify-center py-4 px-8 text-gray-400">
                <p className="text-sm">No stories from people you follow</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Story Upload Modal */}
      {showUpload && (
        <StoryUpload
          onClose={() => setShowUpload(false)}
          onStoryUploaded={handleStoryUploaded}
        />
      )}

      {/* Story Viewer Modal */}
      {selectedGroup && (
        <StoryViewer
          group={selectedGroup}
          initialIndex={selectedStoryIndex}
          onClose={handleStoryClose}
          onNextGroup={handleNextGroup}
          onPrevGroup={handlePrevGroup}
          hasNextGroup={
            storyGroups.findIndex((g) => g.user._id === selectedGroup.user._id) <
            storyGroups.length - 1
          }
          hasPrevGroup={
            storyGroups.findIndex((g) => g.user._id === selectedGroup.user._id) > 0
          }
        />
      )}
    </>
  );
};

export default StoryBar;

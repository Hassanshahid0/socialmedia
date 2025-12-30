import Avatar from '../common/Avatar';

const StoryCard = ({ group, onClick }) => {
  const { user, hasUnviewed, stories } = group;
  const latestStory = stories[0];

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
    >
      <div className={`p-0.5 rounded-full ${hasUnviewed ? 'story-ring' : 'bg-gray-300'}`}>
        <div className="p-0.5 bg-white rounded-full">
          <Avatar
            src={user?.profileImage}
            alt={user?.username}
            size="lg"
          />
        </div>
      </div>
      <span className="text-xs text-gray-600 max-w-[64px] truncate">
        {user?.username}
      </span>
    </button>
  );
};

export default StoryCard;

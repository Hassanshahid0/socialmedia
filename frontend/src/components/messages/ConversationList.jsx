import Avatar from '../common/Avatar';
import { useSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ conversations, selectedId, onSelect, loading }) => {
  const { isUserOnline } = useSocket();

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p className="text-gray-500 font-medium">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start chatting with someone!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const participant = conversation.participant;
        const isOnline = isUserOnline(participant?._id);
        const isSelected = selectedId === conversation._id;
        const lastMessage = conversation.lastMessage;

        // Format last message preview
        let lastMessagePreview = '';
        if (lastMessage) {
          if (lastMessage.messageType === 'image') {
            lastMessagePreview = '📷 Photo';
          } else if (lastMessage.messageType === 'post') {
            lastMessagePreview = '📤 Shared a post';
          } else {
            lastMessagePreview = lastMessage.text || '';
          }
        }

        return (
          <button
            key={conversation._id}
            onClick={() => onSelect(conversation)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              isSelected ? 'bg-primary-50 hover:bg-primary-50' : ''
            }`}
          >
            <div className="relative">
              <Avatar
                src={participant?.profileImage}
                alt={participant?.username}
                size="md"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className={`font-semibold text-gray-800 truncate ${
                  conversation.unreadCount > 0 ? 'text-black' : ''
                }`}>
                  {participant?.username || participant?.fullName || 'Unknown User'}
                </p>
                {conversation.lastMessageAt && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                      addSuffix: false,
                    })}
                  </span>
                )}
              </div>

              {lastMessagePreview && (
                <p className={`text-sm truncate ${
                  conversation.unreadCount > 0 
                    ? 'text-gray-800 font-medium' 
                    : 'text-gray-500'
                }`}>
                  {lastMessagePreview}
                </p>
              )}
            </div>

            {conversation.unreadCount > 0 && (
              <span className="min-w-[20px] h-5 flex items-center justify-center bg-primary-500 text-white text-xs font-bold rounded-full px-1.5">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;

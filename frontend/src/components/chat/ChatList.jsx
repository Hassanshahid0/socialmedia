import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '../../hooks/useSocket'

const ChatList = ({ conversations, activeChat, onSelectChat }) => {
  const { isUserOnline } = useSocket()

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a conversation with someone</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {conversations.map((conversation) => {
        const user = conversation.user
        const lastMessage = conversation.lastMessage
        const isActive = activeChat === user?._id
        const isOnline = isUserOnline(user?._id)

        return (
          <button
            key={conversation.conversationId}
            onClick={() => onSelectChat(user)}
            className={`
              w-full flex items-center gap-3 p-4 transition
              ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
            `}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user?.avatar || '/default-avatar.png'}
                alt={user?.username}
                className="w-14 h-14 rounded-full object-cover"
              />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-neutral-900 rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold truncate">{user?.displayName || user?.username}</p>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {lastMessage?.createdAt && formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {conversation.typing ? (
                  <div className="flex items-center gap-1">
                    <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                ) : (
                  <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {lastMessage?.sender === 'me' && 'You: '}
                    {lastMessage?.text || 'Sent an image'}
                  </p>
                )}
                {conversation.unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default ChatList

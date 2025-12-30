import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ message, isOwn, showAvatar, participant }) => {
  const imageUrl = message.image
    ? message.image.startsWith('http')
      ? message.image
      : `/uploads/posts/${message.image}`
    : null;

  const sharedPost = message.sharedPost;
  const sharedPostImage = sharedPost?.image
    ? sharedPost.image.startsWith('http')
      ? sharedPost.image
      : `/uploads/posts/${sharedPost.image}`
    : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex items-end gap-2 max-w-[75%] ${isOwn ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwn && showAvatar && (
          <Avatar
            src={participant?.profileImage}
            alt={participant?.username}
            size="sm"
          />
        )}
        {!isOwn && !showAvatar && <div className="w-8" />}

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {/* Text Message */}
          {message.text && message.messageType === 'text' && (
            <div
              className={`rounded-2xl px-4 py-2 ${
                isOwn
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
              }`}
            >
              <p className="break-words whitespace-pre-wrap">{message.text}</p>
            </div>
          )}

          {/* Image Message */}
          {message.messageType === 'image' && imageUrl && (
            <div
              className={`rounded-2xl overflow-hidden ${
                isOwn ? 'rounded-br-md' : 'rounded-bl-md'
              }`}
            >
              <img
                src={imageUrl}
                alt=""
                className="max-w-full max-h-64 object-cover rounded-2xl"
                loading="lazy"
              />
              {message.text && (
                <div
                  className={`px-4 py-2 mt-1 rounded-2xl ${
                    isOwn
                      ? 'bg-primary-500 text-white rounded-br-md'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                </div>
              )}
            </div>
          )}

          {/* Shared Post */}
          {message.messageType === 'post' && sharedPost && (
            <div
              className={`rounded-2xl overflow-hidden ${
                isOwn
                  ? 'bg-primary-500 rounded-br-md'
                  : 'bg-white rounded-bl-md shadow-sm'
              }`}
            >
              {message.text && (
                <div className={`px-4 py-2 ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                  <p className="break-words">{message.text}</p>
                </div>
              )}
              <Link
                to={`/post/${sharedPost._id}`}
                className="block border-t border-gray-200/20"
              >
                <div className="bg-gray-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      src={sharedPost.author?.profileImage}
                      alt={sharedPost.author?.username}
                      size="xs"
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {sharedPost.author?.username}
                    </span>
                  </div>
                  {sharedPostImage && (
                    <img
                      src={sharedPostImage}
                      alt=""
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  {sharedPost.caption && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {sharedPost.caption}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Timestamp */}
          <p
            className={`text-[10px] px-1 ${
              isOwn ? 'text-right text-gray-400' : 'text-left text-gray-400'
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

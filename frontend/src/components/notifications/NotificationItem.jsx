import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ notification, onClick }) => {
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    onClick?.();
  };

  const getNotificationContent = () => {
    switch (notification.type) {
      case 'follow':
        return {
          text: 'started following you',
          link: `/profile/${notification.sender?.username}`,
          icon: '👤',
        };
      case 'like':
        return {
          text: 'liked your post',
          link: `/post/${notification.post}`,
          icon: '❤️',
        };
      case 'comment':
        return {
          text: 'commented on your post',
          link: `/post/${notification.post}`,
          icon: '💬',
        };
      case 'share':
        return {
          text: 'shared your post',
          link: `/messages`,
          icon: '📤',
        };
      default:
        return {
          text: 'interacted with you',
          link: '/',
          icon: '🔔',
        };
    }
  };

  const content = getNotificationContent();

  return (
    <Link
      to={content.link}
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors ${
        !notification.read ? 'bg-primary-50' : ''
      }`}
    >
      <div className="relative">
        <Avatar
          src={notification.sender?.profileImage}
          alt={notification.sender?.username}
          size="md"
        />
        <span className="absolute -bottom-1 -right-1 text-sm">
          {content.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          <span className="font-semibold">{notification.sender?.username}</span>{' '}
          {content.text}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </Link>
  );
};

export default NotificationItem;

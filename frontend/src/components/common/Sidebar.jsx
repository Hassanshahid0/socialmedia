import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';

const Sidebar = () => {
  const { user, isCreator } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/explore',
      label: 'Explore',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/messages',
      label: 'Messages',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      to: `/profile/${user?.username}`,
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 hidden md:block overflow-y-auto">
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 mb-4 bg-gray-50 rounded-xl">
          <Avatar src={user?.profileImage} alt={user?.username} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate">{user?.fullName}</p>
            <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
          </div>
          {isCreator && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
              Creator
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Stats */}
        <div className="mt-6 p-4 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl text-white">
          <h3 className="font-semibold mb-3">Your Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{user?.postsCount || 0}</p>
              <p className="text-xs text-white/80">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.followersCount || 0}</p>
              <p className="text-xs text-white/80">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user?.followingCount || 0}</p>
              <p className="text-xs text-white/80">Following</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

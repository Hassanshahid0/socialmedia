import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Search, 
  PlusSquare, 
  MessageCircle, 
  User, 
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../hooks/useApp'

const Sidebar = () => {
  const navigate = useNavigate()
  const { user, logout, canCreate, isAdmin } = useAuth()
  const { unreadMessages } = useApp()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    ...(canCreate() ? [{ icon: PlusSquare, label: 'Create', path: '/create' }] : []),
    { 
      icon: MessageCircle, 
      label: 'Messages', 
      path: '/messages',
      badge: unreadMessages > 0 ? unreadMessages : null 
    },
    { icon: User, label: 'Profile', path: `/profile/${user?.username}` },
  ]

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 bg-black border-r border-white/10 flex-col p-4">
      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive ? 'bg-white/10 font-semibold' : 'hover:bg-white/5'}
            `}
          >
            <item.icon className="w-6 h-6" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Admin Panel Link */}
      {isAdmin() && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <NavLink
            to="/admin"
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5'}
            `}
          >
            <Settings className="w-6 h-6" />
            <span>Admin Panel</span>
          </NavLink>
        </div>
      )}

      {/* User Section */}
      <div className="border-t border-white/10 pt-4 mt-4">
        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-3">
          <img
            src={user?.avatar || '/default-avatar.png'}
            alt={user?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.displayName}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition w-full mt-2"
        >
          <LogOut className="w-6 h-6" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

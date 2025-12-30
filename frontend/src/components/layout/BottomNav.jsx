import { NavLink } from 'react-router-dom'
import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../hooks/useApp'

const BottomNav = () => {
  const { user, canCreate } = useAuth()
  const { unreadMessages } = useApp()

  const navItems = [
    { icon: Home, path: '/' },
    { icon: Search, path: '/explore' },
    ...(canCreate() ? [{ icon: PlusSquare, path: '/create' }] : []),
    { 
      icon: MessageCircle, 
      path: '/messages',
      badge: unreadMessages > 0 
    },
    { icon: User, path: `/profile/${user?.username}` },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-lg border-t border-white/10 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `
            relative p-3 rounded-xl transition-all duration-200
            ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}
          `}
        >
          <item.icon className="w-6 h-6" />
          {item.badge && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default BottomNav

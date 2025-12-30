import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, 
  Bell, 
  MessageCircle, 
  PlusSquare,
  Heart,
  User,
  Settings,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useApp } from '../../hooks/useApp'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout, canCreate } = useAuth()
  const { notifications, unreadNotifications, unreadMessages, markNotificationsRead } = useApp()
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadNotifications > 0) {
      markNotificationsRead()
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-lg border-b border-white/10 z-50 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-gray-400 flex items-center justify-center">
            <span className="text-black font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-xl hidden sm:block">PixelSphere</span>
        </Link>

        {/* Search (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-white/5 rounded-xl px-4 py-2 w-64 lg:w-80">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none ml-3 text-sm w-full placeholder-gray-500"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Create Post */}
          {canCreate() && (
            <button
              onClick={() => navigate('/create')}
              className="hidden md:flex p-2 hover:bg-white/10 rounded-xl transition"
            >
              <PlusSquare className="w-6 h-6" />
            </button>
          )}

          {/* Messages */}
          <button
            onClick={() => navigate('/messages')}
            className="hidden md:flex p-2 hover:bg-white/10 rounded-xl transition relative"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-dot" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={handleNotificationClick}
              className="p-2 hover:bg-white/10 rounded-xl transition relative"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-dot" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 right-0 w-80 bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                >
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-white/5 transition flex items-center gap-3 cursor-pointer ${
                            !notification.isRead ? 'bg-white/5' : ''
                          }`}
                        >
                          <img
                            src={notification.sender?.avatar || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-semibold">{notification.sender?.username}</span>
                              {' '}
                              {notification.type === 'like' && 'liked your post'}
                              {notification.type === 'comment' && 'commented on your post'}
                              {notification.type === 'follow' && 'started following you'}
                              {notification.type === 'mention' && 'mentioned you'}
                            </p>
                            <p className="text-xs text-gray-500">{formatTime(notification.createdAt)}</p>
                          </div>
                          {notification.post?.images?.[0] && (
                            <img
                              src={notification.post.images[0].url}
                              alt=""
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-white/20 transition"
            >
              <img
                src={user?.avatar || '/default-avatar.png'}
                alt={user?.username}
                className="w-full h-full object-cover"
              />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-12 right-0 w-56 bg-neutral-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
                >
                  <Link
                    to={`/profile/${user?.username}`}
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <div className="border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition w-full text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

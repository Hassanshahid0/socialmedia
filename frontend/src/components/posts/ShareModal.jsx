import { useState, useEffect } from 'react'
import { Search, Send, Copy, X } from 'lucide-react'
import Modal from '../common/Modal'
import { userApi } from '../../api/userApi'
import { messageApi } from '../../api/messageApi'
import toast from 'react-hot-toast'

const ShareModal = ({ isOpen, onClose, post }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      fetchSuggestions()
    }
  }, [searchQuery])

  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await userApi.getSuggestions(10)
      setUsers(response.suggestions || [])
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      setLoading(true)
      const response = await userApi.searchUsers(searchQuery)
      setUsers(response.users || [])
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id)
      if (isSelected) {
        return prev.filter(u => u._id !== user._id)
      }
      return [...prev, user]
    })
  }

  const handleShare = async () => {
    if (selectedUsers.length === 0) return

    try {
      setSending(true)
      
      // Send post link to each selected user
      const postLink = `${window.location.origin}/post/${post._id}`
      const message = `Check out this post: ${postLink}`
      
      await Promise.all(
        selectedUsers.map(user => 
          messageApi.sendMessage(user._id, { text: message })
        )
      )
      
      toast.success(`Shared with ${selectedUsers.length} user(s)`)
      onClose()
      setSelectedUsers([])
    } catch (error) {
      toast.error('Failed to share post')
    } finally {
      setSending(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`)
    toast.success('Link copied to clipboard')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share" size="md">
      {/* Search */}
      <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 mb-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none"
        />
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedUsers.map(user => (
            <div 
              key={user._id}
              className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1"
            >
              <span className="text-sm">{user.username}</span>
              <button onClick={() => toggleUser(user)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* User List */}
      <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
        {users.map(user => (
          <button
            key={user._id}
            onClick={() => toggleUser(user)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl transition
              ${selectedUsers.some(u => u._id === user._id) 
                ? 'bg-white/10' 
                : 'hover:bg-white/5'}
            `}
          >
            <img
              src={user.avatar || '/default-avatar.png'}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 text-left">
              <p className="font-semibold">{user.username}</p>
              <p className="text-sm text-gray-400">{user.displayName}</p>
            </div>
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${selectedUsers.some(u => u._id === user._id)
                ? 'bg-white border-white'
                : 'border-white/30'}
            `}>
              {selectedUsers.some(u => u._id === user._id) && (
                <div className="w-2 h-2 rounded-full bg-black" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition"
        >
          <Copy className="w-5 h-5" />
          <span>Copy Link</span>
        </button>
        <button
          onClick={handleShare}
          disabled={selectedUsers.length === 0 || sending}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-semibold disabled:opacity-50 transition"
        >
          <Send className="w-5 h-5" />
          <span>{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
    </Modal>
  )
}

export default ShareModal

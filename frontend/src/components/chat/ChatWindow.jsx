import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Phone, Video, Info, Smile, Image, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useSocket } from '../../hooks/useSocket'
import { messageApi } from '../../api/messageApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const ChatWindow = ({ user: chatUser, onBack }) => {
  const { user: currentUser } = useAuth()
  const { isUserOnline, on, startTyping, stopTyping, markMessageSeen } = useSocket()
  
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const conversationId = [currentUser?._id, chatUser?._id].sort().join('_')

  // Fetch messages
  useEffect(() => {
    if (chatUser?._id) {
      fetchMessages()
    }
  }, [chatUser?._id])

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = on('new_message', (message) => {
      if (message.sender._id === chatUser?._id || message.receiver._id === chatUser?._id) {
        setMessages(prev => [...prev, message])
        scrollToBottom()
        // Mark as seen
        markMessageSeen(conversationId, message.sender._id)
      }
    })

    return unsubscribe
  }, [chatUser?._id, on])

  // Listen for typing indicator
  useEffect(() => {
    const unsubscribeTyping = on('user_typing', ({ conversationId: convId, user }) => {
      if (convId === conversationId && user._id === chatUser?._id) {
        setIsTyping(true)
      }
    })

    const unsubscribeStopTyping = on('user_stopped_typing', ({ conversationId: convId, userId }) => {
      if (convId === conversationId && userId === chatUser?._id) {
        setIsTyping(false)
      }
    })

    return () => {
      unsubscribeTyping()
      unsubscribeStopTyping()
    }
  }, [chatUser?._id, conversationId, on])

  // Listen for messages seen
  useEffect(() => {
    const unsubscribe = on('messages_seen', ({ conversationId: convId, seenBy }) => {
      if (convId === conversationId && seenBy === chatUser?._id) {
        setMessages(prev => prev.map(msg => 
          msg.sender._id === currentUser?._id ? { ...msg, status: 'seen' } : msg
        ))
      }
    })

    return unsubscribe
  }, [chatUser?._id, conversationId, currentUser?._id, on])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await messageApi.getMessages(chatUser._id)
      setMessages(response.messages || [])
      scrollToBottom()
    } catch (error) {
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    startTyping(conversationId, chatUser._id)
    
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId, chatUser._id)
    }, 1000)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageText = newMessage.trim()
    setNewMessage('')
    setSending(true)
    stopTyping(conversationId, chatUser._id)

    try {
      const response = await messageApi.sendMessage(chatUser._id, { text: messageText })
      setMessages(prev => [...prev, response.message])
      scrollToBottom()
    } catch (error) {
      toast.error('Failed to send message')
      setNewMessage(messageText)
    } finally {
      setSending(false)
    }
  }

  const isOnline = isUserOnline(chatUser?._id)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-full transition lg:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <img
            src={chatUser?.avatar || '/default-avatar.png'}
            alt={chatUser?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-neutral-900 rounded-full" />
          )}
        </div>
        
        <div className="flex-1">
          <p className="font-semibold">{chatUser?.displayName || chatUser?.username}</p>
          <p className="text-xs text-gray-400">
            {isTyping ? 'typing...' : isOnline ? 'Active now' : chatUser?.lastActive ? `Active ${formatDistanceToNow(new Date(chatUser.lastActive), { addSuffix: true })}` : ''}
          </p>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-full transition">
          <Phone className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition">
          <Video className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <img
              src={chatUser?.avatar || '/default-avatar.png'}
              alt=""
              className="w-20 h-20 rounded-full mb-4"
            />
            <p className="font-semibold text-white">{chatUser?.displayName}</p>
            <p className="text-sm">@{chatUser?.username}</p>
            <p className="mt-4 text-sm">Start a conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => {
              const isMine = message.sender._id === currentUser?._id || message.sender === currentUser?._id
              
              return (
                <div
                  key={message._id || idx}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isMine ? 'bg-white text-black' : 'bg-neutral-800'} rounded-2xl px-4 py-2`}>
                    {message.image && (
                      <img
                        src={message.image.url}
                        alt=""
                        className="rounded-lg mb-2 max-w-full"
                      />
                    )}
                    {message.text && (
                      <p className="text-sm break-words">{message.text}</p>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className={`text-xs ${isMine ? 'text-gray-600' : 'text-gray-500'}`}>
                        {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: false })}
                      </span>
                      {isMine && (
                        <span className="text-xs">
                          {message.status === 'seen' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 rounded-2xl px-4 py-3 flex items-center gap-1">
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 bg-neutral-800 rounded-full px-4 py-2">
          <button type="button" className="p-1 hover:bg-white/10 rounded-full transition">
            <Smile className="w-6 h-6" />
          </button>
          
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={handleTyping}
            className="flex-1 bg-transparent outline-none"
          />
          
          <button type="button" className="p-1 hover:bg-white/10 rounded-full transition">
            <Image className="w-6 h-6" />
          </button>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-1 hover:bg-white/10 rounded-full transition disabled:opacity-50"
          >
            <Send className={`w-6 h-6 ${newMessage.trim() ? 'text-blue-400' : ''}`} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatWindow

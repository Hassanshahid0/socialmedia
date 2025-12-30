import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../common/Modal'
import { postApi } from '../../api/postApi'
import { userApi } from '../../api/userApi'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const PostActions = ({ isOpen, onClose, post, onUpdate }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const isOwner = user?._id === post?.user?._id
  const isFollowing = post?.user?.isFollowing

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      setLoading(true)
      await postApi.deletePost(post._id)
      toast.success('Post deleted')
      onClose()
      if (onUpdate) onUpdate()
      navigate('/')
    } catch (error) {
      toast.error('Failed to delete post')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    try {
      setLoading(true)
      if (isFollowing) {
        await userApi.unfollowUser(post.user._id)
        toast.success(`Unfollowed ${post.user.username}`)
      } else {
        await userApi.followUser(post.user._id)
        toast.success(`Following ${post.user.username}`)
      }
      onClose()
      if (onUpdate) onUpdate()
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`)
    toast.success('Link copied to clipboard')
    onClose()
  }

  const handleGoToPost = () => {
    navigate(`/post/${post._id}`)
    onClose()
  }

  const actions = [
    ...(isOwner ? [
      { label: 'Delete', onClick: handleDelete, danger: true },
      { label: 'Edit', onClick: () => navigate(`/post/${post._id}/edit`) },
    ] : [
      { label: isFollowing ? 'Unfollow' : 'Follow', onClick: handleFollow, danger: isFollowing },
    ]),
    { label: 'Go to post', onClick: handleGoToPost },
    { label: 'Copy link', onClick: handleCopyLink },
    { label: 'Cancel', onClick: onClose },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={false}>
      <div className="divide-y divide-white/10 -m-4">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={loading}
            className={`
              w-full py-4 text-center font-medium transition hover:bg-white/5
              ${action.danger ? 'text-red-500' : ''}
              disabled:opacity-50
            `}
          >
            {action.label}
          </button>
        ))}
      </div>
    </Modal>
  )
}

export default PostActions

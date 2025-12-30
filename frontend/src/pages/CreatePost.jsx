import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, MapPin, X, Upload } from 'lucide-react'
import Button from '../components/common/Button'
import { postApi } from '../api/postApi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const CreatePost = () => {
  const navigate = useNavigate()
  const { user, canCreate } = useAuth()
  const fileInputRef = useRef(null)
  
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if user can't create posts
  if (!canCreate()) {
    return (
      <div className="max-w-xl mx-auto p-4 text-center py-20">
        <Image className="w-16 h-16 mx-auto mb-4 text-gray-500" />
        <h2 className="text-2xl font-bold mb-2">Creator Access Required</h2>
        <p className="text-gray-400 mb-4">
          You need a Creator account to post content.
        </p>
        <Button onClick={() => navigate('/settings')}>
          Upgrade Account
        </Button>
      </div>
    )
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }

    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    setImages(prev => [...prev, ...validFiles])

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviews(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (images.length === 0) {
      toast.error('Please add at least one image')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      images.forEach(image => {
        formData.append('images', image)
      })
      formData.append('caption', caption)
      if (location) {
        formData.append('location', location)
      }

      await postApi.createPost(formData)
      toast.success('Post created successfully!')
      navigate('/')
    } catch (error) {
      toast.error(error.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900 rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
              ${previews.length > 0 ? 'border-white/20' : 'border-white/10 hover:border-white/30'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={preview}
                      alt=""
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(idx)
                      }}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previews.length < 10 && (
                  <div className="aspect-square border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
            ) : (
              <>
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-2">Click to upload images</p>
                <p className="text-sm text-gray-500">JPG, PNG, GIF up to 10MB</p>
              </>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              maxLength={2200}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition resize-none"
            />
            <p className="text-xs text-gray-500 text-right mt-1">{caption.length}/2200</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Location (optional)</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                maxLength={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:border-white/30 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={images.length === 0}
          >
            Share Post
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

export default CreatePost

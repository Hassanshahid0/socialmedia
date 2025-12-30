import { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const ProfileEdit = ({ profile, onClose, onUpdate }) => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    username: profile.username || '',
    bio: profile.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await userService.updateProfileImage(formData);
      updateUser({ profileImage: response.data.profileImage });
      onUpdate({ profileImage: response.data.profileImage });
      toast.success('Profile image updated!');
    } catch (error) {
      toast.error('Failed to update profile image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await userService.updateProfile(formData);
      updateUser(response.data.user);
      onUpdate(response.data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <h2 className="font-semibold">Edit Profile</h2>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-primary-500 font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar
                src={profile.profileImage}
                alt={profile.username}
                size="xl"
              />
              {imageLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
              className="mt-3 text-primary-500 font-medium hover:text-primary-600"
            >
              Change Profile Photo
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                maxLength={160}
                placeholder="Write something about yourself..."
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.bio.length}/160
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;

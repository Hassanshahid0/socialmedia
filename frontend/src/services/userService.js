import api from './api';

export const userService = {
  // Get user profile by ID or username
  getProfile: async (identifier) => {
    const response = await api.get(`/users/${identifier}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // Update profile image
  updateProfileImage: async (formData) => {
    const response = await api.put('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await api.post(`/users/follow/${userId}`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await api.delete(`/users/unfollow/${userId}`);
    return response.data;
  },

  // Get followers
  getFollowers: async (userId) => {
    const response = await api.get(`/users/${userId}/followers`);
    return response.data;
  },

  // Get following
  getFollowing: async (userId) => {
    const response = await api.get(`/users/${userId}/following`);
    return response.data;
  },

  // Get suggestions
  getSuggestions: async (limit = 5) => {
    const response = await api.get(`/users/feed/suggestions?limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    const response = await api.get(`/users/search?q=${query}&limit=${limit}`);
    return response.data;
  },
};

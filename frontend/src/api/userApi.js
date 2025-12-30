import api from './axios';

export const userApi = {
  // Get user profile
  getProfile: async (username) => {
    const response = await api.get(`/users/${username}`);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Update username
  updateUsername: async (username) => {
    const response = await api.put('/users/username', { username });
    return response.data;
  },

  // Update avatar
  updateAvatar: async (formData) => {
    const response = await api.put('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Follow user
  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  // Get followers
  getFollowers: async (username, page = 1, limit = 20) => {
    const response = await api.get(`/users/${username}/followers?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get following
  getFollowing: async (username, page = 1, limit = 20) => {
    const response = await api.get(`/users/${username}/following?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get suggestions
  getSuggestions: async (limit = 5) => {
    const response = await api.get(`/users/me/suggestions?limit=${limit}`);
    return response.data;
  },

  // Get saved posts
  getSavedPosts: async (page = 1, limit = 12) => {
    const response = await api.get(`/users/me/saved?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get notifications
  getNotifications: async (page = 1, limit = 20) => {
    const response = await api.get(`/users/me/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Mark notifications as read
  markNotificationsRead: async () => {
    const response = await api.put('/users/me/notifications/read');
    return response.data;
  },
};

export default userApi;

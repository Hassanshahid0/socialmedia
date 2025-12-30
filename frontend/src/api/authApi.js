import api from './axios';

export const authApi = {
  // Register new user
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Check if username is available
  checkUsername: async (username) => {
    const response = await api.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // Check if email is available
  checkEmail: async (email) => {
    const response = await api.get(`/auth/check-email/${email}`);
    return response.data;
  },
};

export default authApi;

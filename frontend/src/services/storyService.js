import api from './api';

export const storyService = {
  // Get stories for feed (from followed users + own)
  getFeedStories: async () => {
    const response = await api.get('/stories');
    return response.data;
  },

  // Get current user's stories
  getMyStories: async () => {
    const response = await api.get('/stories/my');
    return response.data;
  },

  // Get user's stories
  getUserStories: async (userId) => {
    const response = await api.get(`/stories/user/${userId}`);
    return response.data;
  },

  // Get single story
  getStory: async (storyId) => {
    const response = await api.get(`/stories/${storyId}`);
    return response.data;
  },

  // Create a new story
  createStory: async (formData) => {
    const response = await api.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Mark story as viewed
  viewStory: async (storyId) => {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  },

  // Get story viewers (owner only)
  getStoryViewers: async (storyId) => {
    const response = await api.get(`/stories/${storyId}/viewers`);
    return response.data;
  },

  // Delete a story
  deleteStory: async (storyId) => {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  },
};

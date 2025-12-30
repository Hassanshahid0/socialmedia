import api from './api';

export const postService = {
  // Create a new post
  createPost: async (formData) => {
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Create post response:', response.data);
    return response.data;
  },

  // Get feed posts
  getFeedPosts: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/feed?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get explore posts
  getExplorePosts: async (page = 1, limit = 20) => {
    const response = await api.get(`/posts/explore?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get user posts
  getUserPosts: async (userId, page = 1, limit = 12) => {
    const response = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  // Toggle like
  toggleLike: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Add comment
  addComment: async (postId, text) => {
    const response = await api.post(`/posts/${postId}/comment`, { text });
    return response.data;
  },

  // Get comments
  getComments: async (postId) => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    const response = await api.delete(`/posts/${postId}/comment/${commentId}`);
    return response.data;
  },

  // Share post
  sharePost: async (postId, sharedTo) => {
    const response = await api.post(`/posts/${postId}/share`, { sharedTo });
    return response.data;
  },

  // Save post
  savePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/save`);
    return response.data;
  },

  // Unsave post
  unsavePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/save`);
    return response.data;
  },

  // Get saved posts
  getSavedPosts: async (page = 1, limit = 12) => {
    const response = await api.get(`/posts/saved?page=${page}&limit=${limit}`);
    return response.data;
  },
};

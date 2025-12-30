import api from './axios';

export const postApi = {
  // Create new post
  createPost: async (formData) => {
    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get feed posts
  getFeed: async (page = 1, limit = 10) => {
    const response = await api.get(`/posts/feed/me?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Get user's posts
  getUserPosts: async (username, page = 1, limit = 12) => {
    const response = await api.get(`/posts/user/${username}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get explore posts
  getExplorePosts: async (page = 1, limit = 20) => {
    const response = await api.get(`/posts/explore?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Like/unlike post
  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  // Save/unsave post
  savePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/save`);
    return response.data;
  },

  // Share post
  sharePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data;
  },

  // Add comment
  addComment: async (postId, text) => {
    const response = await api.post(`/posts/${postId}/comments`, { text });
    return response.data;
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  // Delete post
  deletePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },
};

export default postApi;

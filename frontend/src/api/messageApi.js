import api from './axios';

export const messageApi = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Get messages with a specific user
  getMessages: async (userId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${userId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (userId, messageData) => {
    const isFormData = messageData instanceof FormData;
    const response = await api.post(`/messages/${userId}`, messageData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId, forEveryone = false) => {
    const response = await api.delete(`/messages/${messageId}?forEveryone=${forEveryone}`);
    return response.data;
  },

  // Mark messages as seen
  markAsSeen: async (userId) => {
    const response = await api.put(`/messages/${userId}/seen`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  },
};

export default messageApi;

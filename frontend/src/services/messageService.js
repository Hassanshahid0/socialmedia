import api from './api';

export const messageService = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  // Get single conversation
  getConversation: async (conversationId) => {
    const response = await api.get(`/messages/conversations/${conversationId}`);
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(
      `/messages/${conversationId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Send a message
  sendMessage: async (data) => {
    // If sending an image, use FormData
    if (data.image) {
      const formData = new FormData();
      formData.append('image', data.image);
      if (data.conversationId) formData.append('conversationId', data.conversationId);
      if (data.recipientId) formData.append('recipientId', data.recipientId);
      if (data.text) formData.append('text', data.text);

      const response = await api.post('/messages/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.post('/messages/send', data);
    return response.data;
  },

  // Start a new conversation
  startConversation: async (recipientId, text = '', sharedPostId = null) => {
    const response = await api.post('/messages/conversations/start', {
      recipientId,
      text,
      sharedPostId,
    });
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await api.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
  },

  // Delete a message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};

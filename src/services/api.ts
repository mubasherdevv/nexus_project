import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.'));

const API_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const SOCKET_URL = isLocalhost ? 'http://localhost:5000' : window.location.origin;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('business_nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string; role: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  verify2FA: async (data: { userId: string; otp: string }) => {
    const response = await api.post('/auth/verify-2fa', data);
    return response.data;
  },

  toggle2FA: async (enabled: boolean) => {
    const response = await api.put('/auth/toggle-2fa', { enabled });
    return response.data;
  },
};

export const paymentAPI = {
  getWallet: async () => {
    const response = await api.get('/payments/wallet');
    return response.data;
  },
  deposit: async (data: { amount: number; description?: string }) => {
    const response = await api.post('/payments/deposit', data);
    return response.data;
  },
  withdraw: async (data: { amount: number; description?: string }) => {
    const response = await api.post('/payments/withdraw', data);
    return response.data;
  },
  transfer: async (data: { recipientEmail: string; amount: number; description?: string }) => {
    const response = await api.post('/payments/transfer', data);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },
};

export const profileAPI = {
  getEntrepreneurs: async () => {
    const response = await api.get('/profiles/entrepreneurs');
    return response.data;
  },

  getInvestors: async () => {
    const response = await api.get('/profiles/investors');
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/profiles/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/profiles/${id}`, data);
    return response.data;
  },
};

export const meetingAPI = {
  schedule: async (data: Record<string, unknown>) => {
    const response = await api.post('/meetings', data);
    return response.data;
  },
  getMeetings: async () => {
    const response = await api.get('/meetings');
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/meetings/${id}/status`, { status });
    return response.data;
  },
};

export const documentAPI = {
  upload: async (formData: FormData) => {
    const response = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },
  sign: async (id: string, signatureImage: string) => {
    const response = await api.post(`/documents/${id}/sign`, { signatureImage });
    return response.data;
  },
};

export const messageAPI = {
  getMessages: async (userId: string) => {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
  },
  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },
};

export const notificationAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export default api;

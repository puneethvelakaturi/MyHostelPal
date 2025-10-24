import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// Tickets API
export const ticketsAPI = {
  createTicket: (ticketData) => {
    const formData = new FormData();
    formData.append('title', ticketData.title);
    formData.append('description', ticketData.description);
    formData.append('location', JSON.stringify(ticketData.location || {}));
    
    if (ticketData.images) {
      ticketData.images.forEach((image, index) => {
        formData.append('images', image);
      });
    }
    
    return api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getMyTickets: (params) => api.get('/tickets/my-tickets', { params }),
  getTicket: (id) => api.get(`/tickets/${id}`),
  addComment: (id, message) => api.post(`/tickets/${id}/comments`, { message }),
  updateStatus: (id, status, assignedTo, resolutionDescription) => 
    api.put(`/tickets/${id}/status`, { status, assignedTo, resolutionDescription }),
  getAllTickets: (params) => api.get('/tickets', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: (params) => api.get('/admin/dashboard', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getReports: (params) => api.get('/admin/reports/daily', { params }),
  getNotifications: (params) => api.get('/admin/notifications', { params }),
};

// AI API
export const aiAPI = {
  analyzeComplaint: (description) => api.post('/ai/analyze', { description }),
  generateReport: (startDate, endDate, reportType) => 
    api.post('/ai/generate-report', { startDate, endDate, reportType }),
};

export default api;

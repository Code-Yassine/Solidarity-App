import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solidarity_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('solidarity_token');
      localStorage.removeItem('solidarity_user');
      // Avoid redirect loop on auth pages
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  remove: (id) => api.delete(`/campaigns/${id}`),
  getManageable: () => api.get('/campaigns/manage'),
  updateStatus: (id, data) => api.patch(`/campaigns/${id}/status`, data),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
};

export default api;

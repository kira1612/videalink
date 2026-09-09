import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('iot_token');
      localStorage.removeItem('iot_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  activity: () => api.get('/dashboard/activity'),
};

// Devices
export const devicesApi = {
  list: () => api.get('/devices'),
  get: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
};

// Buckets
export const bucketsApi = {
  list: () => api.get('/buckets'),
  get: (id) => api.get(`/buckets/${id}`),
  create: (data) => api.post('/buckets', data),
  delete: (id) => api.delete(`/buckets/${id}`),
  toggle: (id) => api.patch(`/buckets/${id}/toggle`),
  records: (id) => api.get(`/buckets/${id}/records`),
  updateWidgets: (id, widgets) => api.put(`/buckets/${id}/widgets`, { widgets }),
};

// MQTT
export const mqttApi = {
  publish: (topic, message) => api.post('/mqtt/publish', { topic, message: typeof message === 'string' ? message : JSON.stringify(message) }),
};

// Endpoints
export const endpointsApi = {
  list: () => api.get('/endpoints'),
  create: (data) => api.post('/endpoints', data),
  delete: (id) => api.delete(`/endpoints/${id}`),
  toggle: (id) => api.patch(`/endpoints/${id}/toggle`),
  trigger: (id) => api.post(`/endpoints/${id}/trigger`),
};

// User Profile & Management
export const userApi = {
  list: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  delete: (id) => api.delete(`/users/${id}`),
  update: (data) => api.put('/user', data),
  updatePassword: (data) => api.put('/user/password', data),
};

export default api;

import api from './axios';

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// ─── Buses ─────────────────────────────────────────────────────────────────
export const busAPI = {
  getAll: () => api.get('/buses'),
  getDriverBuses: () => api.get('/buses/driver'),
  getActive: () => api.get('/buses/active'),
  getOne: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
  assignRoute: (id, routeId) => api.put(`/buses/${id}/assign-route`, { routeId }),
};

// ─── Routes ────────────────────────────────────────────────────────────────
export const routeAPI = {
  getAll: () => api.get('/routes'),
  getOne: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// ─── Students ──────────────────────────────────────────────────────────────
export const studentAPI = {
  getAll: () => api.get('/users/students'),
  getOne: (id) => api.get(`/users/students/${id}`),
  create: (data) => api.post('/users/students', data),
  update: (id, data) => api.put(`/users/students/${id}`, data),
  delete: (id) => api.delete(`/users/students/${id}`),
  assignBus: (id, busId) => api.put(`/users/students/${id}/assign-bus`, { busId }),
};

// ─── Drivers ───────────────────────────────────────────────────────────────
export const driverAPI = {
  getAll: () => api.get('/users/drivers'),
  getOne: (id) => api.get(`/users/drivers/${id}`),
  create: (data) => api.post('/users/drivers', data),
  update: (id, data) => api.put(`/users/drivers/${id}`, data),
  delete: (id) => api.delete(`/users/drivers/${id}`),
  assignBus: (id, busId) => api.put(`/users/drivers/${id}/assign-bus`, { busId }),
};

// ─── Trips ─────────────────────────────────────────────────────────────────
export const tripAPI = {
  getAll: (params) => api.get('/trips', { params }),
  startTrip: (data) => api.post('/trips/start', data),
  endTrip: (id) => api.put(`/trips/${id}/end`),
  updateLocation: (id, data) => api.put(`/trips/${id}/location`, data),
  getMyTrip: () => api.get('/trips/my-trip'),
  getTripByBus: (busId) => api.get(`/trips/bus/${busId}`),
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  create: (data) => api.post('/notifications', data),
};

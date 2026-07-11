import axios from 'axios';

// In development this goes through Vite's /api proxy to the local backend.
// A deployed frontend can set VITE_API_URL to its deployed API endpoint.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the logged-in user's token to protected API requests.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cbt_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;

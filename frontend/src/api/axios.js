import axios from 'axios';

const API_BASE = "https://bus-tracker-backend-0t26.onrender.com/api";

console.log("HARDCODED =", API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
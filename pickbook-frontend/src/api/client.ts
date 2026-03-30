import axios from 'axios';

// Створюємо екземпляр axios із базовим URL
// Якщо є VITE_API_URL (на Vercel), беремо лінку Render + /api.
// Якщо ні (на локалці), використовуємо '/api' для локального проксі з vite.config.ts.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
});

// Інтерцептор — автоматично додає JWT токен до кожного запиту
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Якщо сервер повертає 401 — розлогінюємось
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
import axios from 'axios';

// Створюємо екземпляр axios із базовим URL
const api = axios.create({ baseURL: '/api' });

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

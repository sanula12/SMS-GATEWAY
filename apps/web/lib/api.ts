import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
       api.post('/auth/logout').catch(() => {});
      const publicPaths = ['/', '/login', '/register', '/forbidden'];
      const isPublic = publicPaths.includes(window.location.pathname);
      if (typeof window !== 'undefined' && !isPublic) {
        window.location.href = '/login';
      }
    }

   

    if (error.response?.status === 403) {
       api.post('/auth/logout').catch(() => {});
      if (typeof window !== 'undefined' && window.location.pathname !== '/forbidden') {
        window.location.href = '/forbidden';
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl && import.meta.env.PROD) {
  // In production builds VITE_API_URL must be set at build time.
  throw new Error('VITE_API_URL is not set. Configure it before building for production.');
}

const apiClient = axios.create({
  baseURL: apiBaseUrl || 'http://localhost:5000/api',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    const isAuthCheck = url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthCheck && typeof window !== 'undefined') {
      const here = window.location.pathname + window.location.search;
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace(`/login?redirect=${encodeURIComponent(here)}`);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

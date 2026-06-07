import axios from 'axios';
import type { ApiError } from '../types/api';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor — log in development
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors into ApiError shape
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: ApiError = {
      detail: 'An unexpected error occurred',
      status: 500,
    };

    if (error.response) {
      apiError.status = error.response.status;
      apiError.detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        error.response.statusText ||
        'Server error';
    } else if (error.request) {
      apiError.detail = 'Unable to reach the server. Please check your connection.';
      apiError.status = 0;
    } else {
      apiError.detail = error.message || 'Request configuration error';
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;

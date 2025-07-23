import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // Redirect to login or refresh token
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for CSRF token
let csrfToken: string | null = null;

apiClient.interceptors.request.use(
  async (config) => {
    // Skip CSRF for GET requests
    if (config.method?.toLowerCase() !== 'get') {
      if (!csrfToken) {
        // Fetch CSRF token if not available
        try {
          const response = await axios.get(`${API_URL}/csrf-token`, {
            withCredentials: true,
          });
          csrfToken = response.data.csrfToken;
        } catch (error) {
          console.error('Failed to fetch CSRF token:', error);
        }
      }
      
      if (csrfToken && config.headers) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Clear CSRF token on 403 (forbidden) responses
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 403) {
      // Clear CSRF token to fetch a new one
      csrfToken = null;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
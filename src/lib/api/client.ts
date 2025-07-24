import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Only append if array has items
            if (value.length > 0) {
              searchParams.append(key, value.join(','));
            }
            // Don't append empty arrays
          } else if (value !== '' || typeof value === 'number') {
            // Always include numbers, even if they're 0
            searchParams.append(key, String(value));
          }
        }
      });
      return searchParams.toString();
    }
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // Only redirect if we're not already on a public page
      if (typeof window !== 'undefined') {
        const publicPaths = ['/', '/login', '/register', '/study-materials'];
        const currentPath = window.location.pathname;
        const isPublicPath = publicPaths.some(path => currentPath === path || currentPath.startsWith(path + '/'));
        
        if (!isPublicPath && !currentPath.includes('/auth/')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for CSRF token
let csrfToken: string | null = null;

// Function to clear CSRF token
export const clearCsrfToken = () => {
  csrfToken = null;
  console.log('[CSRF] Token cleared manually');
};

apiClient.interceptors.request.use(
  async (config) => {
    // Pass through Playwright test header if present
    if (typeof window !== 'undefined') {
      const isPlaywrightTest = document.querySelector('meta[name="x-playwright-test"]')?.getAttribute('content') === 'true';
      if (isPlaywrightTest && config.headers) {
        config.headers['x-playwright-test'] = 'true';
      }
    }
    
    // Skip CSRF for GET requests and csrf-token endpoint
    if (config.method?.toLowerCase() !== 'get' && !config.url?.includes('csrf-token')) {
      if (!csrfToken) {
        // Fetch CSRF token if not available
        try {
          console.log('[CSRF] Fetching new CSRF token...');
          const response = await axios.get(`${API_URL}/csrf-token`, {
            withCredentials: true,
          });
          csrfToken = response.data.csrfToken;
          console.log('[CSRF] Token fetched:', csrfToken);
        } catch (error) {
          console.error('[CSRF] Failed to fetch CSRF token:', error);
        }
      }
      
      if (csrfToken && config.headers) {
        config.headers['x-csrf-token'] = csrfToken;
        console.log('[CSRF] Added token to request headers');
      } else {
        console.warn('[CSRF] No token available for request');
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Update CSRF token from responses and handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Update CSRF token if present in response
    if (response.data?.csrfToken) {
      csrfToken = response.data.csrfToken;
      console.log('[CSRF] Updated token from response');
    }
    
    // Clear CSRF token on successful logout
    if (response.config.url?.includes('/auth/logout') && response.status === 200) {
      csrfToken = null;
      console.log('[CSRF] Token cleared after successful logout');
    }
    
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 403) {
      // Clear CSRF token to fetch a new one
      csrfToken = null;
      console.log('[CSRF] Cleared token due to 403 error');
    }
    
    // If CSRF token error, try to get a new token
    if (error.response?.data && typeof error.response.data === 'object' && 
        'error' in error.response.data && 
        (error.response.data as any).error?.includes('CSRF')) {
      console.log('[CSRF] CSRF error detected, clearing token');
      csrfToken = null;
      
      // Update token from error response if available
      if ((error.response.data as any).csrfToken) {
        csrfToken = (error.response.data as any).csrfToken;
        console.log('[CSRF] Updated token from error response');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
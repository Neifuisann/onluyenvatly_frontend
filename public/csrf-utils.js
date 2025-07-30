/**
 * CSRF Token Utilities for Admin Editor
 * Provides getCSRFToken function required by admin-new-v2.js
 */

// Prevent duplicate loading
if (window.csrfUtilsLoaded) {
  console.log('[CSRF] CSRF utilities already loaded, skipping...');
} else {
  window.csrfUtilsLoaded = true;

// Global CSRF token cache
let globalCsrfToken = null;

/**
 * Get CSRF token from the server
 * @returns {Promise<string>} CSRF token
 */
async function getCSRFToken() {
  if (globalCsrfToken) {
    return globalCsrfToken;
  }

  try {
    const API_URL = window.location.origin.includes('localhost:3000')
      ? 'http://localhost:3003/api'
      : '/api';

    const response = await fetch(`${API_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.csrfToken) {
      globalCsrfToken = data.csrfToken;
      console.log('[CSRF] Token fetched successfully');
      return globalCsrfToken;
    } else {
      throw new Error('Invalid CSRF token response');
    }
  } catch (error) {
    console.error('[CSRF] Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Clear the cached CSRF token
 */
function clearCSRFToken() {
  globalCsrfToken = null;
  console.log('[CSRF] Token cleared');
}

/**
 * Make authenticated API request with CSRF token
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function authenticatedFetch(url, options = {}) {
  const token = await getCSRFToken();
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': token,
      ...options.headers
    }
  };

  return fetch(url, { ...defaultOptions, ...options });
}

// Make functions globally available
window.getCSRFToken = getCSRFToken;
window.clearCSRFToken = clearCSRFToken;
window.authenticatedFetch = authenticatedFetch;

console.log('[CSRF] CSRF utilities loaded');

} // End of duplicate loading prevention

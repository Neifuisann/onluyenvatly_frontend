'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';

export default function TestPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loginResult, setLoginResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test CSRF token fetch
    apiClient.get('/csrf-token')
      .then(res => {
        setCsrfToken(res.data.csrfToken);
        console.log('CSRF Token fetched:', res.data.csrfToken);
      })
      .catch(err => {
        setError('Failed to fetch CSRF token: ' + err.message);
        console.error('CSRF fetch error:', err);
      });
  }, []);

  const testLogin = async () => {
    try {
      const response = await apiClient.post('/auth/login', {
        phone_number: '0375931007',
        password: '140207',
        deviceId: 'test-device-123'
      });
      setLoginResult(response.data);
      console.log('Login success:', response.data);
    } catch (err: any) {
      setError('Login failed: ' + (err.response?.data?.message || err.message));
      console.error('Login error:', err);
    }
  };

  return (
    <div className="p-4">
      <h1>API Test Page</h1>
      <div>
        <p>CSRF Token: {csrfToken || 'Not fetched'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Login Result: {loginResult ? JSON.stringify(loginResult) : 'Not attempted'}</p>
      </div>
      <button 
        onClick={testLogin}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Login
      </button>
    </div>
  );
}
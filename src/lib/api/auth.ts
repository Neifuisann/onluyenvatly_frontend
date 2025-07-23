import apiClient from './client';

export interface LoginCredentials {
  username?: string;
  password: string;
  phone_number?: string;
  deviceId?: string;
}

export interface RegisterData {
  full_name: string;
  phone_number: string;
  email?: string;
  password: string;
  birth_date?: string;
  parent_phone?: string;
  address?: string;
  school?: string;
  grade?: number;
  target_school?: string;
  referral_source?: string;
}

export interface User {
  id: number;
  username?: string;
  full_name?: string;
  phone_number?: string;
  email?: string;
  role: 'admin' | 'student';
  isLoggedIn: boolean;
}

export const authApi = {
  // Admin login
  adminLogin: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/admin/login', credentials);
    return response.data;
  },

  // Student login
  studentLogin: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Student register
  studentRegister: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/student/register', data);
    return response.data;
  },

  // Check auth status
  checkAuth: async (): Promise<User> => {
    const response = await apiClient.get('/auth/check');
    const data = response.data.data;
    
    if (!data.authenticated) {
      throw new Error('Not authenticated');
    }
    
    // Transform backend response to frontend User type
    return {
      id: data.user.id || (data.user.type === 'admin' ? 1 : 0),
      username: data.user.name || data.user.type,
      full_name: data.user.name,
      phone_number: data.user.phone_number,
      email: data.user.email,
      role: data.user.type as 'admin' | 'student',
      isLoggedIn: true
    };
  },

  // Logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
};
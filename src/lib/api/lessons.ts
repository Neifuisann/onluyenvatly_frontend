import apiClient from './client';

export interface Lesson {
  id: number;
  title: string;
  subject: string;
  grade: number;
  description?: string;
  thumbnail?: string;
  lessonImage?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  question_count?: number;
  avg_score?: number;
  attempt_count?: number;
  views?: number;
  completed?: boolean;
  completedAt?: string | null;
}

export interface LessonFilters {
  grade?: number;
  subject?: string;
  difficulty?: string;
  tags?: string[] | string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'az' | 'za' | 'popular';
  page?: number;
  limit?: number;
}

export interface LessonDetail extends Lesson {
  content?: string;
  questions?: any[]; // Encrypted questions
  materials?: any[];
  statistics?: {
    totalAttempts: number;
    averageScore: number;
    averageTime: number;
    completionRate: number;
  };
}

export const lessonsApi = {
  // Get all lessons with filters
  getLessons: async (filters?: LessonFilters) => {
    const response = await apiClient.get('/lessons', { params: filters });
    return response.data;
  },

  // Get single lesson detail
  getLessonById: async (id: number): Promise<LessonDetail> => {
    const response = await apiClient.get(`/lessons/${id}`);
    return response.data;
  },

  // Search lessons
  searchLessons: async (query: string) => {
    const response = await apiClient.get('/lessons/search', { params: { q: query } });
    return response.data;
  },

  // Get lesson statistics
  getLessonStats: async (id: number) => {
    const response = await apiClient.get(`/lessons/${id}/statistics`);
    return response.data;
  },

  // Get user's lesson progress
  getUserLessonProgress: async () => {
    const response = await apiClient.get('/progress/lessons');
    return response.data;
  },

  // Get recommended lessons
  getRecommendedLessons: async () => {
    const response = await apiClient.get('/lessons/recommended');
    return response.data;
  },

  // Get trending lessons
  getTrendingLessons: async () => {
    const response = await apiClient.get('/lessons/trending');
    return response.data;
  },
};
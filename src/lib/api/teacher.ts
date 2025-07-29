import apiClient from "./client";

export interface TeacherLesson {
  id: number;
  title: string;
  subject: string;
  grade: number;
  description?: string;
  thumbnail?: string;
  tags: string[];
  studentCount?: number;
  completionRate?: string;
  lastActivity?: string;
  created_at: string;
  updated_at: string;
}

export interface TagData {
  tag: string;
  lessonCount: number;
  totalViews: number;
  recentActivity: number;
  popularityScore: number;
}

export interface DashboardStats {
  totalLessons: number;
  activeLessons: number;
  totalStudents: number;
  recentActivity: number;
}

export interface LessonsResponse {
  lessons: TeacherLesson[];
  total: number;
  page: number;
  limit: number;
}

export const teacherApi = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/teacher/dashboard-stats");
    return response.data.data || {
      totalLessons: 0,
      activeLessons: 0,
      totalStudents: 0,
      recentActivity: 0,
    };
  },

  // Get popular tags
  getPopularTags: async (limit: number = 8): Promise<TagData[]> => {
    try {
      const response = await apiClient.get(`/tags/complete?limit=${limit}`);
      if (response.data.success && response.data.tags) {
        return response.data.tags;
      }
    } catch (error) {
      console.error("Failed to fetch complete tags, falling back to popular tags");
    }

    // Fallback to popular tags
    try {
      const response = await apiClient.get(`/tags/popular?limit=${limit}`);
      if (response.data.success && response.data.tags) {
        return response.data.tags;
      }
    } catch (error) {
      console.error("Failed to fetch popular tags");
    }

    return [];
  },

  // Get teacher's lessons with filters
  getTeacherLessons: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    tags?: string[];
  }): Promise<LessonsResponse> => {
    const response = await apiClient.get("/lessons", {
      params: {
        ...params,
        includeStats: "true",
      },
    });
    return response.data;
  },



  // Delete lesson
  deleteLesson: async (id: number): Promise<any> => {
    const response = await apiClient.delete(`/teacher/lessons/${id}`);
    return response.data;
  },

  // Create review lesson
  createReviewLesson: async (data: {
    name: string;
    lessons: { lessonId: number; questionCount: number }[];
  }): Promise<any> => {
    const response = await apiClient.post("/teacher/review-lessons", data);
    return response.data;
  },

  // Get lesson statistics
  getLessonStatistics: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/teacher/lessons/${id}/statistics`);
    return response.data;
  },

  // Duplicate lesson
  duplicateLesson: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/teacher/lessons/${id}/duplicate`);
    return response.data;
  },

  // Generate lesson image
  generateLessonImage: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/teacher/lessons/${id}/generate-image`);
    return response.data;
  },
};
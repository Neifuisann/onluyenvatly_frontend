import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import { useToast } from "./useToast";

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  content?: string;
  grade?: number;
  subject?: string;
  tags?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  studentCount?: number;
  completionRate?: string;
  lastActivity?: string;
}

interface LessonsResponse {
  success: boolean;
  lessons: Lesson[];
  total: number;
  currentPage?: number;
  totalPages?: number;
}

interface LessonFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "newest" | "oldest" | "az" | "za" | "popular";
  tags?: string[];
  includeStats?: boolean;
}

interface DashboardStats {
  totalLessons: number;
  activeLessons: number;
  totalStudents: number;
  recentActivity: number;
}

/**
 * Hook to fetch lessons with filters
 */
export function useLessons(filters: LessonFilters = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    sort = "newest",
    tags = [],
    includeStats = true,
  } = filters;

  return useQuery<LessonsResponse>({
    queryKey: ["lessons", { page, limit, search, sort, tags, includeStats }],
    queryFn: async () => {
      const params: any = {
        page,
        limit,
        sort,
        includeStats,
      };

      if (search) {
        params.search = search;
      }

      if (tags.length > 0) {
        params.tags = tags.join(",");
      }

      const response = await apiClient.get("/lessons", { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard-stats");
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new lesson
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (lesson: Partial<Lesson>) => {
      const response = await apiClient.post("/lessons", lesson);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Đã tạo bài học mới thành công");
    },
    onError: (error: any) => {
      toast.error(
        "Không thể tạo bài học",
        error.response?.data?.message || error.message,
      );
    },
  });
}

/**
 * Hook to update a lesson
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Lesson> & { id: number }) => {
      const response = await apiClient.put(`/lessons/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Đã cập nhật bài học");
    },
    onError: (error: any) => {
      toast.error(
        "Không thể cập nhật bài học",
        error.response?.data?.message || error.message,
      );
    },
  });
}

/**
 * Hook to delete a lesson
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/lessons/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Đã xóa bài học thành công");
    },
    onError: (error: any) => {
      toast.error(
        "Không thể xóa bài học",
        error.response?.data?.message || error.message,
      );
    },
  });
}

/**
 * Hook to reorder lessons
 */
export function useReorderLessons() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (lessonIds: number[]) => {
      const response = await apiClient.post("/lessons/reorder", { lessonIds });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      toast.success("Đã cập nhật thứ tự bài học");
    },
    onError: (error: any) => {
      toast.error(
        "Không thể cập nhật thứ tự",
        error.response?.data?.message || error.message,
      );
    },
  });
}

/**
 * Hook to fetch lesson statistics
 */
export function useLessonStatistics(lessonId: number | null) {
  return useQuery({
    queryKey: ["lesson-statistics", lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const response = await apiClient.get(`/lessons/${lessonId}/statistics`);
      return response.data;
    },
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

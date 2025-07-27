import apiClient from "./client";

export interface LeaderboardEntry {
  id: number;
  studentId: number;
  studentName: string;
  rating: number;
  tier: string;
  rank: number;
  totalLessons: number;
  accuracy: number;
  currentStreak: number;
  totalXp: number;
  achievements?: number;
  lastActive?: string;
  avatar?: string;
  grade?: number;
}

export interface LeaderboardFilters {
  grade?: number;
  subject?: string;
  timePeriod?: "all" | "weekly" | "monthly" | "daily";
  search?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface UserPosition {
  userId: number;
  rank: number;
  rating: number;
  percentile: number;
}

// Helper function to map backend entry to frontend format
const mapLeaderboardEntry = (entry: any): LeaderboardEntry => {
  return {
    id: entry.id || entry.student_id,
    studentId: entry.student_id || entry.studentId,
    studentName:
      entry.students?.full_name ||
      entry.student_name ||
      entry.studentName ||
      "Unknown",
    rating: entry.rating || entry.currentRating || 0,
    tier: entry.tier?.tier || entry.tier || "",
    rank: entry.rank || 0,
    totalLessons: entry.stats?.totalLessons || entry.totalLessons || 0,
    accuracy: entry.stats?.accuracy || entry.accuracy || 0,
    currentStreak: entry.stats?.currentStreak || entry.currentStreak || 0,
    totalXp:
      entry.stats?.totalXP ||
      entry.stats?.totalXp ||
      entry.totalXP ||
      entry.totalXp ||
      0,
    achievements: entry.achievements || 0,
    lastActive: entry.lastActive || entry.last_active,
    avatar: entry.avatar,
    grade: entry.grade,
  };
};

export const leaderboardApi = {
  // Get overall leaderboard
  getOverallLeaderboard: async (
    page: number = 1,
    limit: number = 20,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardResponse> => {
    const response = await apiClient.get("/ratings/leaderboard/overall", {
      params: {
        page,
        limit,
        ...filters,
      },
    });

    // Map backend response to frontend format
    return {
      entries: (response.data.leaderboard || []).map(mapLeaderboardEntry),
      total: response.data.pagination?.total || response.data.count || 0,
      page: response.data.pagination?.page || page,
      limit: response.data.pagination?.limit || limit,
    };
  },

  // Get weekly leaderboard
  getWeeklyLeaderboard: async (
    page: number = 1,
    limit: number = 20,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardResponse> => {
    const response = await apiClient.get("/ratings/leaderboard/weekly", {
      params: {
        page,
        limit,
        ...filters,
      },
    });

    // Map backend response to frontend format
    return {
      entries: (response.data.leaderboard || []).map(mapLeaderboardEntry),
      total: response.data.pagination?.total || response.data.count || 0,
      page: response.data.pagination?.page || page,
      limit: response.data.pagination?.limit || limit,
    };
  },

  // Get monthly leaderboard
  getMonthlyLeaderboard: async (
    page: number = 1,
    limit: number = 20,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardResponse> => {
    const response = await apiClient.get("/ratings/leaderboard/monthly", {
      params: {
        page,
        limit,
        ...filters,
      },
    });

    // Map backend response to frontend format
    return {
      entries: (response.data.leaderboard || []).map(mapLeaderboardEntry),
      total: response.data.pagination?.total || response.data.count || 0,
      page: response.data.pagination?.page || page,
      limit: response.data.pagination?.limit || limit,
    };
  },

  // Get subject-specific leaderboard
  getSubjectLeaderboard: async (
    subject: string,
    page: number = 1,
    limit: number = 20,
    filters?: LeaderboardFilters,
  ): Promise<LeaderboardResponse> => {
    const response = await apiClient.get(`/ratings/leaderboard/subject`, {
      params: {
        subject,
        page,
        limit,
        ...filters,
      },
    });

    // Map backend response to frontend format
    return {
      entries: (response.data.leaderboard || []).map(mapLeaderboardEntry),
      total: response.data.pagination?.total || response.data.count || 0,
      page: response.data.pagination?.page || page,
      limit: response.data.pagination?.limit || limit,
    };
  },

  // Get user's position in leaderboard
  getUserPosition: async (userId: number): Promise<UserPosition> => {
    const response = await apiClient.get(`/ratings/student/${userId}/position`);

    // Map backend response to frontend format
    const data = response.data;
    return {
      userId: userId,
      rank: data.position?.rank || 0,
      rating: data.position?.rating || 0,
      percentile: data.position?.percentile || 0,
    };
  },

  // Search users in leaderboard
  searchUsers: async (query: string): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get("/ratings/leaderboard/search", {
      params: { query: query },
    });

    // Map backend response to frontend format
    return (response.data.results || []).map(mapLeaderboardEntry);
  },
};

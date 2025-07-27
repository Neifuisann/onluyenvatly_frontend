import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  leaderboardApi,
  LeaderboardFilters,
  LeaderboardResponse,
  UserPosition,
} from "@/lib/api/leaderboard";
import { useAuthStore } from "@/lib/stores/auth";

const LEADERBOARD_QUERY_KEY = "leaderboard";
const USER_POSITION_QUERY_KEY = "userPosition";
const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

interface UseLeaderboardOptions {
  page?: number;
  limit?: number;
  filters?: LeaderboardFilters;
  enableAutoRefresh?: boolean;
}

export function useLeaderboard({
  page = 1,
  limit = 20,
  filters = {},
  enableAutoRefresh = true,
}: UseLeaderboardOptions = {}) {
  const queryClient = useQueryClient();

  // Determine which API endpoint to use based on filters
  const getLeaderboardFn = () => {
    if (filters.timePeriod === "weekly") {
      return leaderboardApi.getWeeklyLeaderboard(page, limit, filters);
    } else if (filters.timePeriod === "monthly") {
      return leaderboardApi.getMonthlyLeaderboard(page, limit, filters);
    } else if (filters.subject) {
      return leaderboardApi.getSubjectLeaderboard(
        filters.subject,
        page,
        limit,
        filters,
      );
    }
    return leaderboardApi.getOverallLeaderboard(page, limit, filters);
  };

  const query = useQuery<LeaderboardResponse>({
    queryKey: [LEADERBOARD_QUERY_KEY, page, limit, filters],
    queryFn: getLeaderboardFn,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: enableAutoRefresh ? REFRESH_INTERVAL : false,
    refetchIntervalInBackground: true,
  });

  // Prefetch next page
  useEffect(() => {
    if (query.data && page * limit < query.data.total) {
      queryClient.prefetchQuery({
        queryKey: [LEADERBOARD_QUERY_KEY, page + 1, limit, filters],
        queryFn: () => {
          if (filters.timePeriod === "weekly") {
            return leaderboardApi.getWeeklyLeaderboard(
              page + 1,
              limit,
              filters,
            );
          } else if (filters.timePeriod === "monthly") {
            return leaderboardApi.getMonthlyLeaderboard(
              page + 1,
              limit,
              filters,
            );
          } else if (filters.subject) {
            return leaderboardApi.getSubjectLeaderboard(
              filters.subject,
              page + 1,
              limit,
              filters,
            );
          }
          return leaderboardApi.getOverallLeaderboard(page + 1, limit, filters);
        },
      });
    }
  }, [query.data, page, limit, filters, queryClient]);

  return query;
}

export function useUserPosition() {
  const { user } = useAuthStore();

  return useQuery<UserPosition>({
    queryKey: [USER_POSITION_QUERY_KEY, user?.id],
    queryFn: () => leaderboardApi.getUserPosition(user!.id),
    enabled: !!user?.id && user.role === "student",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });
}

export function useLeaderboardSearch(
  searchQuery: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: [LEADERBOARD_QUERY_KEY, "search", searchQuery],
    queryFn: () => leaderboardApi.searchUsers(searchQuery),
    enabled: enabled && searchQuery.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook to manually refresh leaderboard data
export function useLeaderboardRefresh() {
  const queryClient = useQueryClient();

  const refreshLeaderboard = () => {
    queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY] });
  };

  const refreshUserPosition = () => {
    queryClient.invalidateQueries({ queryKey: [USER_POSITION_QUERY_KEY] });
  };

  const refreshAll = () => {
    refreshLeaderboard();
    refreshUserPosition();
  };

  return {
    refreshLeaderboard,
    refreshUserPosition,
    refreshAll,
  };
}

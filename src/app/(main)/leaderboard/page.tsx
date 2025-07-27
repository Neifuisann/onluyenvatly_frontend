"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import LeaderboardTable from "@/components/features/leaderboard/LeaderboardTable";
import { FilterBar } from "@/components/features/leaderboard/FilterBar";
import { RankCard } from "@/components/features/leaderboard/RankCard";
import { StatsCard } from "@/components/features/leaderboard/StatsCard";
import { UserProfileModal } from "@/components/features/leaderboard/UserProfileModal";
import { LeaderboardEntry, LeaderboardFilters } from "@/lib/api/leaderboard";
import {
  useLeaderboard,
  useUserPosition,
  useLeaderboardSearch,
  useLeaderboardRefresh,
} from "@/lib/hooks/useLeaderboard";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { refreshAll } = useLeaderboardRefresh();

  // State for filters and pagination
  const [filters, setFilters] = useState<LeaderboardFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // State for user profile modal
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(
    null,
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Determine if we should use search API
  const shouldSearch = searchQuery.length >= 2;

  // React Query hooks
  const {
    data: leaderboardData,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    isFetching: isFetchingLeaderboard,
  } = useLeaderboard({
    page,
    limit,
    filters: { ...filters, search: shouldSearch ? undefined : searchQuery },
    enableAutoRefresh: true,
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useLeaderboardSearch(searchQuery, shouldSearch);

  const {
    data: userPosition,
    isLoading: isLoadingPosition,
    error: positionError,
  } = useUserPosition();

  // Combine search results with leaderboard data
  const displayEntries = useMemo(() => {
    if (shouldSearch && searchResults) {
      return searchResults;
    }
    return leaderboardData?.entries || [];
  }, [shouldSearch, searchResults, leaderboardData]);

  // Find current user's entry for stats
  const currentUserEntry = useMemo(() => {
    if (!user || user.role !== "student") return null;
    return displayEntries.find((entry) => entry.studentId === user.id);
  }, [displayEntries, user]);

  // Loading state
  const isLoading = isLoadingLeaderboard || isSearching;

  // Error state
  const error = leaderboardError || searchError || positionError;

  // Handlers
  const handleUserClick = useCallback(
    (userId: string) => {
      // Find the user entry from the display entries
      const userEntry = displayEntries.find(
        (entry) => entry.studentId.toString() === userId,
      );
      if (userEntry) {
        setSelectedUser(userEntry);
        setIsProfileModalOpen(true);
      }
    },
    [displayEntries],
  );

  const handleFilterChange = useCallback((newFilters: LeaderboardFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const handleCloseProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
    setSelectedUser(null);
  }, []);

  // Auto-refresh indicator
  const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
  useEffect(() => {
    if (isFetchingLeaderboard && !isLoadingLeaderboard) {
      setShowRefreshIndicator(true);
      const timer = setTimeout(() => setShowRefreshIndicator(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isFetchingLeaderboard, isLoadingLeaderboard]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bảng xếp hạng</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${showRefreshIndicator ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* User stats cards for logged-in students */}
      {user?.role === "student" && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Rank Card */}
          {isLoadingPosition ? (
            <Skeleton className="h-[200px]" />
          ) : userPosition ? (
            <RankCard
              rank={userPosition.rank}
              totalUsers={leaderboardData?.total || 0}
              className="h-full"
            />
          ) : null}

          {/* Stats Card */}
          {currentUserEntry ? (
            <StatsCard
              totalXP={currentUserEntry.totalXp}
              accuracy={currentUserEntry.accuracy}
              currentStreak={currentUserEntry.currentStreak}
              lessonsCompleted={currentUserEntry.totalLessons}
              className="h-full"
            />
          ) : (
            <Skeleton className="h-[200px]" />
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Đã xảy ra lỗi khi tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        className="mb-6"
      />

      {/* Leaderboard Table */}
      <LeaderboardTable
        entries={displayEntries}
        isLoading={isLoading}
        onUserClick={handleUserClick}
        currentPage={!shouldSearch && leaderboardData ? page : undefined}
        totalPages={
          !shouldSearch && leaderboardData
            ? Math.ceil(leaderboardData.total / limit)
            : undefined
        }
        totalEntries={
          !shouldSearch && leaderboardData ? leaderboardData.total : undefined
        }
        onPageChange={
          !shouldSearch && leaderboardData ? handlePageChange : undefined
        }
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        user={selectedUser}
      />
    </div>
  );
}

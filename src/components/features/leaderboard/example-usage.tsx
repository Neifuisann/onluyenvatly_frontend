// Example usage of RankCard and StatsCard components
// This file is for demonstration purposes only

import { RankCard } from "./RankCard";
import { StatsCard } from "./StatsCard";

export function LeaderboardDashboard() {
  // Example data - in real usage, this would come from API
  const userRankData = {
    rank: 42,
    previousRank: 48,
    totalUsers: 1250,
  };

  const userStatsData = {
    totalXP: 15750,
    accuracy: 87,
    currentStreak: 12,
    lessonsCompleted: 68,
    weeklyXPChange: 15,
    accuracyChange: 3,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bảng xếp hạng</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rank Card */}
        <RankCard
          rank={userRankData.rank}
          previousRank={userRankData.previousRank}
          totalUsers={userRankData.totalUsers}
        />

        {/* Stats Card */}
        <StatsCard
          totalXP={userStatsData.totalXP}
          accuracy={userStatsData.accuracy}
          currentStreak={userStatsData.currentStreak}
          lessonsCompleted={userStatsData.lessonsCompleted}
          weeklyXPChange={userStatsData.weeklyXPChange}
          accuracyChange={userStatsData.accuracyChange}
        />
      </div>
    </div>
  );
}

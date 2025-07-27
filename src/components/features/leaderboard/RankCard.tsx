"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RankCardProps {
  rank: number;
  previousRank?: number;
  totalUsers: number;
  className?: string;
}

const getTierInfo = (rank: number, totalUsers: number) => {
  const percentile = ((totalUsers - rank + 1) / totalUsers) * 100;

  if (percentile >= 95) {
    return {
      tier: "Huyền thoại",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
      icon: Trophy,
      iconColor: "text-purple-600",
    };
  } else if (percentile >= 85) {
    return {
      tier: "Kim cương",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-300",
      icon: Medal,
      iconColor: "text-blue-600",
    };
  } else if (percentile >= 70) {
    return {
      tier: "Bạch kim",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      borderColor: "border-cyan-300",
      icon: Award,
      iconColor: "text-cyan-600",
    };
  } else if (percentile >= 50) {
    return {
      tier: "Vàng",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      borderColor: "border-yellow-300",
      icon: Award,
      iconColor: "text-yellow-600",
    };
  } else if (percentile >= 30) {
    return {
      tier: "Bạc",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-300",
      icon: Award,
      iconColor: "text-gray-600",
    };
  } else {
    return {
      tier: "Đồng",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
      icon: Award,
      iconColor: "text-orange-600",
    };
  }
};

export function RankCard({
  rank,
  previousRank,
  totalUsers,
  className,
}: RankCardProps) {
  const rankChange = previousRank ? previousRank - rank : 0;
  const percentile = Math.round(((totalUsers - rank + 1) / totalUsers) * 100);
  const tierInfo = getTierInfo(rank, totalUsers);
  const TierIcon = tierInfo.icon;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        tierInfo.borderColor,
        "border-2",
        className,
      )}
    >
      <div className={cn("absolute inset-0 opacity-10", tierInfo.bgColor)} />

      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Thứ hạng hiện tại
          </CardTitle>
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
              tierInfo.bgColor,
              tierInfo.color,
            )}
          >
            <TierIcon className="h-4 w-4" />
            <span>{tierInfo.tier}</span>
          </div>
        </div>
        <CardDescription>Vị trí của bạn trong bảng xếp hạng</CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-4xl font-bold tabular-nums">#{rank}</p>
            <p className="text-sm text-muted-foreground">
              trong tổng số {totalUsers.toLocaleString("vi-VN")} học sinh
            </p>
          </div>

          {rankChange !== 0 && previousRank && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                rankChange > 0
                  ? "text-green-600"
                  : rankChange < 0
                    ? "text-red-600"
                    : "text-muted-foreground",
              )}
            >
              {rankChange > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>+{rankChange}</span>
                </>
              ) : rankChange < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span>{rankChange}</span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4" />
                  <span>0</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Phần trăm xếp hạng</span>
            <span className="font-medium">Top {percentile}%</span>
          </div>

          <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={cn(
                "absolute left-0 top-0 h-full transition-all duration-500",
                percentile >= 95
                  ? "bg-purple-500"
                  : percentile >= 85
                    ? "bg-blue-500"
                    : percentile >= 70
                      ? "bg-cyan-500"
                      : percentile >= 50
                        ? "bg-yellow-500"
                        : percentile >= 30
                          ? "bg-gray-500"
                          : "bg-orange-500",
              )}
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

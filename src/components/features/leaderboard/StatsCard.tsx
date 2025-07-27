"use client";

import * as React from "react";
import { Zap, Target, Flame, BookOpen, TrendingUp, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change?: {
    value: number;
    type: "increase" | "decrease" | "neutral";
  };
}

interface StatsCardProps {
  totalXP: number;
  accuracy: number;
  currentStreak: number;
  lessonsCompleted: number;
  weeklyXPChange?: number;
  accuracyChange?: number;
  className?: string;
}

export function StatsCard({
  totalXP,
  accuracy,
  currentStreak,
  lessonsCompleted,
  weeklyXPChange,
  accuracyChange,
  className,
}: StatsCardProps) {
  const stats: Stat[] = [
    {
      label: "Tổng điểm XP",
      value: totalXP.toLocaleString("vi-VN"),
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: weeklyXPChange
        ? {
            value: weeklyXPChange,
            type:
              weeklyXPChange > 0
                ? "increase"
                : weeklyXPChange < 0
                  ? "decrease"
                  : "neutral",
          }
        : undefined,
    },
    {
      label: "Độ chính xác",
      value: `${accuracy}%`,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: accuracyChange
        ? {
            value: accuracyChange,
            type:
              accuracyChange > 0
                ? "increase"
                : accuracyChange < 0
                  ? "decrease"
                  : "neutral",
          }
        : undefined,
    },
    {
      label: "Chuỗi ngày học",
      value: currentStreak,
      icon: Flame,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Bài học hoàn thành",
      value: lessonsCompleted,
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Thống kê học tập
        </CardTitle>
        <CardDescription>Tổng quan về tiến độ học tập của bạn</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {stat.value}
                    </p>

                    {stat.change && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          stat.change.type === "increase"
                            ? "text-green-600"
                            : stat.change.type === "decrease"
                              ? "text-red-600"
                              : "text-muted-foreground",
                        )}
                      >
                        {stat.change.type === "increase" && (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            <span>+{stat.change.value}%</span>
                          </>
                        )}
                        {stat.change.type === "decrease" && (
                          <>
                            <TrendingUp className="h-3 w-3 rotate-180" />
                            <span>{stat.change.value}%</span>
                          </>
                        )}
                        {stat.change.type === "neutral" && (
                          <span>Không đổi</span>
                        )}
                        <span className="text-muted-foreground">
                          so với tuần trước
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={cn("rounded-lg p-2", stat.bgColor)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                </div>

                {/* Achievement indicator for milestones */}
                {((stat.label === "Tổng điểm XP" && totalXP >= 10000) ||
                  (stat.label === "Độ chính xác" && accuracy >= 90) ||
                  (stat.label === "Chuỗi ngày học" && currentStreak >= 7) ||
                  (stat.label === "Bài học hoàn thành" &&
                    lessonsCompleted >= 50)) && (
                  <div className="absolute -top-1 -right-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary message */}
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            {accuracy >= 90 && currentStreak >= 7 ? (
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Xuất sắc! Bạn đang duy trì hiệu suất học tập tuyệt vời.
              </span>
            ) : accuracy >= 80 && currentStreak >= 3 ? (
              "Tốt lắm! Hãy tiếp tục duy trì chuỗi ngày học của bạn."
            ) : (
              "Hãy cố gắng học mỗi ngày để cải thiện thứ hạng của bạn."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

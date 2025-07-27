"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
  Target,
  Flame,
  Award,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  Star,
  Zap,
  X,
} from "lucide-react";
import { LeaderboardEntry } from "@/lib/api/leaderboard";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LeaderboardEntry | null;
  isLoading?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earnedAt: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface RecentActivity {
  id: string;
  type: "lesson" | "quiz" | "achievement" | "streak";
  title: string;
  description: string;
  timestamp: string;
  points?: number;
}

const tierConfig = {
  Bronze: {
    color: "bg-amber-700",
    textColor: "text-white",
    gradient: "from-amber-600 to-amber-800",
  },
  Silver: {
    color: "bg-gray-400",
    textColor: "text-white",
    gradient: "from-gray-300 to-gray-500",
  },
  Gold: {
    color: "bg-yellow-500",
    textColor: "text-white",
    gradient: "from-yellow-400 to-yellow-600",
  },
  Platinum: {
    color: "bg-blue-500",
    textColor: "text-white",
    gradient: "from-blue-400 to-blue-600",
  },
  Diamond: {
    color: "bg-purple-600",
    textColor: "text-white",
    gradient: "from-purple-500 to-purple-700",
  },
  Master: {
    color: "bg-red-600",
    textColor: "text-white",
    gradient: "from-red-500 to-red-700",
  },
};

const rarityConfig = {
  common: { color: "bg-gray-500", label: "Thường" },
  rare: { color: "bg-blue-500", label: "Hiếm" },
  epic: { color: "bg-purple-500", label: "Cực hiếm" },
  legendary: { color: "bg-yellow-500", label: "Huyền thoại" },
};

// Mock data for achievements - in real app, fetch from API
const mockAchievements: Achievement[] = [
  {
    id: "1",
    name: "Người mới bắt đầu",
    description: "Hoàn thành bài học đầu tiên",
    icon: <BookOpen className="h-5 w-5" />,
    earnedAt: "2024-01-15",
    rarity: "common",
  },
  {
    id: "2",
    name: "Chuỗi 7 ngày",
    description: "Duy trì chuỗi học 7 ngày liên tiếp",
    icon: <Flame className="h-5 w-5" />,
    earnedAt: "2024-01-22",
    rarity: "rare",
  },
  {
    id: "3",
    name: "Bậc thầy chính xác",
    description: "Đạt độ chính xác 95% trong 10 bài quiz liên tiếp",
    icon: <Target className="h-5 w-5" />,
    earnedAt: "2024-02-01",
    rarity: "epic",
  },
];

// Mock data for recent activities
const mockActivities: RecentActivity[] = [
  {
    id: "1",
    type: "lesson",
    title: "Hoàn thành: Định luật Newton",
    description: "Lớp 10 - Chương 2",
    timestamp: "2 giờ trước",
    points: 50,
  },
  {
    id: "2",
    type: "quiz",
    title: "Quiz: Chuyển động thẳng đều",
    description: "Đạt 9/10 điểm",
    timestamp: "5 giờ trước",
    points: 90,
  },
  {
    id: "3",
    type: "streak",
    title: "Chuỗi học tập",
    description: "Đã học 15 ngày liên tiếp!",
    timestamp: "1 ngày trước",
    points: 150,
  },
];

const StatCard = ({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const rarity = rarityConfig[achievement.rarity];

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg text-white", rarity.color)}>
            {achievement.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm">{achievement.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {rarity.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {achievement.description}
            </p>
            <p className="text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 inline mr-1" />
              {new Date(achievement.earnedAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "lesson":
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "quiz":
        return <Target className="h-4 w-4 text-green-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "streak":
        return <Flame className="h-4 w-4 text-orange-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="p-2 bg-gray-50 rounded-lg">{getActivityIcon()}</div>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{activity.title}</h4>
        <p className="text-xs text-muted-foreground">{activity.description}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {activity.timestamp}
          </p>
          {activity.points && (
            <span className="text-xs font-semibold text-primary">
              +{activity.points} XP
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export function UserProfileModal({
  isOpen,
  onClose,
  user,
  isLoading = false,
}: UserProfileModalProps) {
  if (!isOpen) return null;

  const tierColors = user
    ? tierConfig[user.tier as keyof typeof tierConfig]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Hồ sơ người dùng</DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Đóng</span>
            </Button>
          </DialogClose>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-48" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4 p-6 pb-0">
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br",
                  tierColors?.gradient || "from-blue-500 to-purple-600",
                )}
              >
                {user.studentName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.studentName}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge
                    className={cn(
                      "font-semibold",
                      tierColors?.color,
                      tierColors?.textColor,
                    )}
                  >
                    {user.tier}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Hạng #{user.rank} • {user.rating} điểm
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6">
              <StatCard
                icon={<Zap className="h-5 w-5 text-yellow-500" />}
                label="Tổng XP"
                value={user.totalXp.toLocaleString()}
              />
              <StatCard
                icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                label="Bài học"
                value={user.totalLessons}
                subValue="Đã hoàn thành"
              />
              <StatCard
                icon={<Target className="h-5 w-5 text-green-500" />}
                label="Độ chính xác"
                value={`${user.accuracy}%`}
              />
              <StatCard
                icon={<Flame className="h-5 w-5 text-orange-500" />}
                label="Chuỗi hiện tại"
                value={user.currentStreak}
                subValue="ngày"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="achievements" className="px-6 pb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="achievements">Thành tựu</TabsTrigger>
                <TabsTrigger value="activity">Hoạt động gần đây</TabsTrigger>
              </TabsList>

              <TabsContent value="achievements" className="mt-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Thành tựu đạt được</h3>
                  <Badge variant="outline">
                    {mockAchievements.length} thành tựu
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {mockAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Hoạt động gần đây</h3>
                  <Badge variant="outline">Tuần này</Badge>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    {mockActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            Không tìm thấy thông tin người dùng
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

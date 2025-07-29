"use client";

import { motion } from "motion/react";
import { Book, CheckCircle, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatWidgetProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
}

function StatWidget({
  title,
  value,
  icon: Icon,
  color,
  onClick,
}: StatWidgetProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden p-6 cursor-pointer transition-all duration-300",
          "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
          "hover:shadow-lg hover:bg-white/70 dark:hover:bg-gray-800/70",
          "border border-gray-200/50 dark:border-gray-700/50",
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold mt-2">
              {displayValue.toLocaleString("vi-VN")}
            </p>
          </div>
          <div className={cn("p-3 rounded-full", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 pointer-events-none" />
      </Card>
    </motion.div>
  );
}

interface StatsOverviewProps {
  stats: {
    totalLessons: number;
    activeLessons: number;
    totalStudents: number;
    recentActivity: number;
  };
  onStatClick?: (stat: string) => void;
}

export function StatsOverview({ stats, onStatClick }: StatsOverviewProps) {
  const widgets = [
    {
      title: "Tổng bài học",
      value: stats.totalLessons,
      icon: Book,
      color: "bg-blue-600",
      key: "total",
    },
    {
      title: "Hoạt động",
      value: stats.activeLessons,
      icon: CheckCircle,
      color: "bg-green-600",
      key: "active",
    },
    {
      title: "Học sinh",
      value: stats.totalStudents,
      icon: Users,
      color: "bg-purple-600",
      key: "students",
    },
    {
      title: "Hoạt động gần đây",
      value: stats.recentActivity,
      icon: Clock,
      color: "bg-orange-600",
      key: "recent",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {widgets.map((widget, index) => (
        <motion.div
          key={widget.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatWidget {...widget} onClick={() => onStatClick?.(widget.key)} />
        </motion.div>
      ))}
    </div>
  );
}

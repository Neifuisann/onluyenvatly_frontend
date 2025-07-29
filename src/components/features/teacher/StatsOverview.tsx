import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Book, CheckCircle, Users, Clock } from "lucide-react";
import { DashboardStats } from "@/lib/api/teacher";

interface StatsOverviewProps {
  stats: DashboardStats;
  onStatClick?: (statType: string) => void;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  type: string;
  color: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, type, color, onClick }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 50;
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className={`mb-2 inline-flex rounded-lg p-3 ${color}`}>
              {icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {displayValue.toLocaleString("vi-VN")}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-full ${color}`} />
    </motion.div>
  );
}

export function StatsOverview({ stats, onStatClick }: StatsOverviewProps) {
  const statCards = [
    {
      type: "total",
      icon: <Book className="h-5 w-5 text-blue-600" />,
      label: "Tổng bài học",
      value: stats.totalLessons,
      color: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      type: "active",
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      label: "Hoạt động",
      value: stats.activeLessons,
      color: "bg-green-100 dark:bg-green-900/30",
    },
    {
      type: "students",
      icon: <Users className="h-5 w-5 text-purple-600" />,
      label: "Học sinh",
      value: stats.totalStudents,
      color: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      type: "recent",
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      label: "Hoạt động gần đây",
      value: stats.recentActivity,
      color: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard
            {...stat}
            onClick={onStatClick ? () => onStatClick(stat.type) : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}

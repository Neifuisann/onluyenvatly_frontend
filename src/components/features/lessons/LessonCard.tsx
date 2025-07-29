"use client";


import { motion } from "motion/react";
import { Edit, Trash2, Eye, Share2, ChevronDown, BarChart3, Users, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Lesson } from "@/lib/hooks/useLessons";

interface LessonCardProps {
  lesson: Lesson;
  index: number;
  onView: (lesson: Lesson) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onShare: (lesson: Lesson) => void;
  onViewStats: (lesson: Lesson) => void;
}

export function LessonCard({
  lesson,
  index,
  onView,
  onEdit,
  onDelete,
  onShare,
  onViewStats,
}: LessonCardProps) {

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
    >
      <Card className="relative overflow-hidden group h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">

        
        {/* Lesson number badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            #{index + 1}
          </Badge>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold line-clamp-2 pr-12">{lesson.title}</h3>
            {lesson.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>{lesson.studentCount ?? "N/A"} học sinh</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <BarChart3 className="h-4 w-4" />
              <span>{lesson.completionRate ?? "N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>{formatDate(lesson.updatedAt)}</span>
            </div>
          </div>

          {/* Tags */}
          {lesson.tags && lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {lesson.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-auto">


            <Button size="sm" variant="outline" onClick={() => onView(lesson)} className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Xem
            </Button>

            {/* Edit dropdown */}
            <DropdownMenu
              trigger={
                <div className="flex">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(lesson)}
                    className="rounded-r-none"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="outline" className="px-2 rounded-l-none border-l-0">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              }
            >
              <DropdownMenuItem onClick={() => onEdit(lesson)}>
                <Edit className="h-4 w-4 mr-2" />
                Giao diện mới
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/admin/edit-legacy/${lesson.id}`, "_blank")}>
                <Edit className="h-4 w-4 mr-2" />
                Giao diện cũ
              </DropdownMenuItem>
            </DropdownMenu>

            <Button size="sm" variant="outline" onClick={() => onViewStats(lesson)}>
              <BarChart3 className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" onClick={() => onShare(lesson)}>
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(lesson)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
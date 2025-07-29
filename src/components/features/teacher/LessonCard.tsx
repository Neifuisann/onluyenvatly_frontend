import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  BarChart,
  Clock,
  Edit,
  Trash2,
  Share2,
  MoreVertical,
  Copy,
  ChartBar,
  Image as ImageIcon
} from "lucide-react";
import { TeacherLesson } from "@/lib/api/teacher";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LessonCardProps {
  lesson: TeacherLesson;
  index: number;
  onEdit: (lesson: TeacherLesson) => void;
  onDelete: (lesson: TeacherLesson) => void;
  onShare: (lesson: TeacherLesson) => void;
  onViewStats: (lesson: TeacherLesson) => void;
  onDuplicate?: (lesson: TeacherLesson) => void;
  onGenerateImage?: (lesson: TeacherLesson) => void;
  view?: "list" | "grid";
}

export function LessonCard({
  lesson,
  index,
  onEdit,
  onDelete,
  onShare,
  onViewStats,
  onDuplicate,
  onGenerateImage,
  view = "list",
}: LessonCardProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Vừa xong";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} ngày trước`;
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const cardContent = (
    <>


      {/* Lesson number */}
      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {index + 1}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="mb-2 pr-12 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {lesson.title}
        </h3>

        {/* Stats */}
        <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{lesson.studentCount || 0} học sinh</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span>{lesson.completionRate || "0%"} hoàn thành</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{lesson.lastActivity ? formatDate(lesson.lastActivity) : "N/A"}</span>
          </div>
        </div>

        {/* Tags */}
        {lesson.tags && lesson.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              title="Đổi màu"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-full left-0 z-10 mb-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="mb-2 h-8 w-full cursor-pointer"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleColorChange}
                    className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="rounded bg-gray-200 px-3 py-1 text-xs hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main actions */}
          <button
            onClick={() => onEdit(lesson)}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            <span>Sửa</span>
          </button>

          <button
            onClick={() => onViewStats(lesson)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <ChartBar className="h-4 w-4" />
            <span>Thống kê</span>
          </button>

          <button
            onClick={() => onShare(lesson)}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Share2 className="h-4 w-4" />
            <span>Chia sẻ</span>
          </button>

          {/* More options dropdown */}
          <DropdownMenu
            trigger={
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            align="end"
          >
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(lesson)}>
                <Copy className="h-4 w-4" />
                <span>Nhân bản</span>
              </DropdownMenuItem>
            )}
            {onGenerateImage && (
              <DropdownMenuItem onClick={() => onGenerateImage(lesson)}>
                <ImageIcon className="h-4 w-4" />
                <span>Tạo ảnh AI</span>
              </DropdownMenuItem>
            )}
            {(onDuplicate || onGenerateImage) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => onDelete(lesson)} destructive>
              <Trash2 className="h-4 w-4" />
              <span>Xóa</span>
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
    </>
  );

  if (view === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative overflow-hidden rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80"
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative overflow-hidden rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80"
    >
      {cardContent}
    </motion.div>
  );
}
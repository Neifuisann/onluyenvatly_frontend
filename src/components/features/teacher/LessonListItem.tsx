import React from "react";
import { motion } from "motion/react";
import { Users, BarChart, Clock } from "lucide-react";
import { TeacherLesson } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";

interface LessonListItemProps {
  lesson: TeacherLesson;
  index: number;
  selected: boolean;
  onSelect: (id: number, checked: boolean) => void;
  onClick: (lesson: TeacherLesson) => void;
}

export function LessonListItem({
  lesson,
  index,
  selected,
  onSelect,
  onClick,
}: LessonListItemProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative flex items-center gap-4 rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80",
        selected &&
          "border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20",
      )}
    >
      {/* Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(lesson.id, e.target.checked);
          }}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Main content - clickable area */}
      <div className="flex-1 cursor-pointer" onClick={() => onClick(lesson)}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
              {lesson.title}
            </h3>

            {/* Tags */}
            {lesson.tags && lesson.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {lesson.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="ml-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{lesson.studentCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>{lesson.completionRate || "0%"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {lesson.lastActivity ? formatDate(lesson.lastActivity) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

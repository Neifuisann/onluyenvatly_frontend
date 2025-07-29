import React from "react";
import { motion } from "motion/react";
import { Clock, Users, BarChart, TrendingUp } from "lucide-react";
import { TeacherLesson } from "@/lib/api/teacher";
import { useRouter } from "next/navigation";

interface FeaturedLessonsProps {
  lessons: TeacherLesson[];
}

export function FeaturedLessons({ lessons }: FeaturedLessonsProps) {
  const router = useRouter();

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

  if (lessons.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bài học mới nhất
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {lessons.slice(0, 4).map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => router.push(`/teacher/lessons/${lesson.id}/edit`)}
            className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-4 transition-all hover:shadow-lg hover:scale-[1.02] dark:border-gray-800 dark:bg-gray-900/80"
          >
            <div className="mb-3 h-1 w-full rounded-full bg-blue-400" />

            <h3 className="mb-2 font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
              {lesson.title}
            </h3>

            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{lesson.studentCount || 0} học sinh</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart className="h-3 w-3" />
                <span>{lesson.completionRate || "0%"} hoàn thành</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {lesson.created_at ? formatDate(lesson.created_at) : "N/A"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

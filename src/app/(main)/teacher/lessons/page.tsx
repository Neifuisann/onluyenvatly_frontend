"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { motion } from "motion/react";

interface Lesson {
  id: number;
  title: string;
  description: string;
  grade: number;
  subject: string;
  updatedAt: string;
}

export default function TeacherLessonsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    // Simulate loading lessons
    setTimeout(() => {
      setLessons([
        {
          id: 1,
          title: "Chương 1: Dao động cơ",
          description: "Giới thiệu về dao động điều hòa, con lắc lò xo và con lắc đơn",
          grade: 12,
          subject: "Vật lý",
          updatedAt: "2024-01-15",
        },
        {
          id: 2,
          title: "Chương 2: Sóng cơ và sóng âm",
          description: "Tìm hiểu về sóng cơ, sóng âm và các đặc trưng của sóng",
          grade: 12,
          subject: "Vật lý",
          updatedAt: "2024-01-20",
        },
        {
          id: 3,
          title: "Chương 3: Dòng điện xoay chiều",
          description: "Các khái niệm về dòng điện xoay chiều và mạch điện xoay chiều",
          grade: 12,
          subject: "Vật lý",
          updatedAt: "2024-01-25",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [user, router]);

  const handleAddLesson = () => {
    alert("Tính năng thêm bài học mới sẽ được triển khai sau!");
  };

  const handleEditLesson = (lesson: Lesson) => {
    alert(`Tính năng chỉnh sửa bài học "${lesson.title}" sẽ được triển khai sau!`);
  };

  const handleViewLesson = (lesson: Lesson) => {
    alert(`Tính năng xem chi tiết bài học "${lesson.title}" sẽ được triển khai sau!`);
  };

  const handleDeleteClick = (lesson: Lesson) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}"?`);
    if (confirmed) {
      alert(`Bài học "${lesson.title}" sẽ được xóa (tính năng sẽ được triển khai sau)`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách bài học...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý bài học</h1>
          <p className="text-gray-600">Quản lý và chỉnh sửa các bài học cho học sinh</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Lọc theo lớp
            </Button>
            <Button variant="outline" disabled>
              Lọc theo môn
            </Button>
          </div>
          <Button onClick={handleAddLesson} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Thêm bài học mới
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  <CardDescription>
                    Lớp {lesson.grade} • {lesson.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Cập nhật lần cuối: {new Date(lesson.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewLesson(lesson)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditLesson(lesson)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(lesson)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {lessons.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Chưa có bài học nào được tạo</p>
            <Button onClick={handleAddLesson} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Tạo bài học đầu tiên
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
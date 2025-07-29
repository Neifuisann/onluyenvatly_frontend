"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { StatsOverview } from "@/components/features/teacher/StatsOverview";
import { LessonFilters } from "@/components/features/teacher/LessonFilters";
import { LessonCard } from "@/components/features/teacher/LessonCard";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/useToast";
import { teacherApi, TeacherLesson, DashboardStats, TagData } from "@/lib/api/teacher";

const LESSONS_PER_PAGE = 10;

export default function TeacherLessonsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { toast, success, error } = useToast();

  // Get initial state from URL params
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page) : 1;
  });

  const [currentSearch, setCurrentSearch] = useState(() => 
    searchParams.get("search") || ""
  );

  const [currentSort, setCurrentSort] = useState(() => 
    searchParams.get("sort") || "newest"
  );

  const [currentTags, setCurrentTags] = useState<string[]>(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",") : [];
  });

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (currentSearch) params.set("search", currentSearch);
    if (currentSort !== "newest") params.set("sort", currentSort);
    if (currentTags.length > 0) params.set("tags", currentTags.join(","));

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/teacher/lessons${newUrl}`, { scroll: false });
  }, [currentPage, currentSearch, currentSort, currentTags, router]);

  // Fetch dashboard stats
  const { data: stats = {
    totalLessons: 0,
    activeLessons: 0,
    totalStudents: 0,
    recentActivity: 0,
  } } = useQuery<DashboardStats>({
    queryKey: ["teacher-dashboard-stats"],
    queryFn: teacherApi.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<TagData[]>({
    queryKey: ["teacher-tags"],
    queryFn: () => teacherApi.getPopularTags(8),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch lessons
  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ["teacher-lessons", currentPage, currentSearch, currentSort, currentTags],
    queryFn: () => teacherApi.getTeacherLessons({
      page: currentPage,
      limit: LESSONS_PER_PAGE,
      search: currentSearch,
      sort: currentSort,
      tags: currentTags,
    }),
  });

  const lessons = lessonsData?.lessons || [];
  const totalLessons = lessonsData?.total || 0;
  const totalPages = Math.ceil(totalLessons / LESSONS_PER_PAGE);

  // Mutations

  const deleteLessonMutation = useMutation({
    mutationFn: (id: number) => teacherApi.deleteLesson(id),
    onSuccess: () => {
      success("Đã xóa bài học thành công");
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard-stats"] });
    },
    onError: () => {
      error("Không thể xóa bài học");
    },
  });

  // Handlers
  const handleStatClick = (statType: string) => {
    switch (statType) {
      case "total":
        setCurrentSearch("");
        setCurrentTags([]);
        setCurrentSort("newest");
        break;
      case "active":
        setCurrentSort("popular");
        break;
      case "students":
        router.push("/teacher/students");
        break;
      case "recent":
        router.push("/teacher/activity");
        break;
    }
  };

  const handleEditLesson = (lesson: TeacherLesson) => {
    router.push(`/teacher/lessons/${lesson.id}/edit`);
  };

  const handleDeleteLesson = (lesson: TeacherLesson) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}"?\n\nHành động này không thể hoàn tác.`)) {
      deleteLessonMutation.mutate(lesson.id);
    }
  };



  const handleShareLesson = async (lesson: TeacherLesson) => {
    const shareUrl = `${window.location.origin}/share/lesson/${lesson.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      success("Đã sao chép link chia sẻ!");
    } catch (err) {
      error("Không thể sao chép link");
    }
  };

  const handleViewStats = (lesson: TeacherLesson) => {
    router.push(`/teacher/lessons/${lesson.id}/statistics`);
  };

  const handleCreateReview = () => {
    toast({ 
      title: "Tính năng đang phát triển",
      description: "Chức năng tạo bài ôn tập sẽ sớm được triển khai",
      variant: "warning" 
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading state
  if (isLoadingLessons && lessons.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="flex gap-8">
          <div className="w-80">
            <Skeleton className="h-96" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-64" />
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 dark:text-gray-100">
            Quản lý bài học
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý và chỉnh sửa các bài học cho học sinh
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview stats={stats} onStatClick={handleStatClick} />
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <LessonFilters
            tags={tags}
            currentSearch={currentSearch}
            currentSort={currentSort}
            currentTags={currentTags}
            onSearchChange={setCurrentSearch}
            onSortChange={setCurrentSort}
            onTagChange={setCurrentTags}
            onCreateReview={handleCreateReview}
          />

          {/* Lessons List */}
          <div className="flex-1">
            {/* Content Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Danh sách bài học
                {totalLessons > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({totalLessons} bài)
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    title="Xem dạng danh sách"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    title="Xem dạng lưới"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>

                {/* Add Lesson Button */}
                <Button
                  onClick={() => router.push("/teacher/lessons/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bài học mới
                </Button>
              </div>
            </div>

            {/* Lessons Container */}
            {lessons.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-12 text-center dark:border-gray-800 dark:bg-gray-900/80">
                <p className="mb-4 text-gray-500">
                  {currentSearch || currentTags.length > 0
                    ? "Không tìm thấy bài học nào phù hợp."
                    : "Chưa có bài học nào được tạo"}
                </p>
                {!currentSearch && currentTags.length === 0 && (
                  <Button
                    onClick={() => router.push("/teacher/lessons/create")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bài học đầu tiên
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid gap-4 md:grid-cols-2"
                    : "space-y-4"
                }
              >
                {lessons.map((lesson: TeacherLesson, index: number) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={(currentPage - 1) * LESSONS_PER_PAGE + index}
                    view={viewMode}
                    onEdit={handleEditLesson}
                    onDelete={handleDeleteLesson}
                    onShare={handleShareLesson}
                    onViewStats={handleViewStats}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
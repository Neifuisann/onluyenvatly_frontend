"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, Trash2, Share2, Download } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { LessonFilters } from "@/components/features/teacher/LessonFilters";
import { FeaturedLessons } from "@/components/features/teacher/FeaturedLessons";
import { LessonListItem } from "@/components/features/teacher/LessonListItem";
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

  const [selectedLessons, setSelectedLessons] = useState<Set<number>>(new Set());

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
    },
    onError: () => {
      error("Không thể xóa bài học");
    },
  });

  // Handlers
  const handleLessonClick = (lesson: TeacherLesson) => {
    router.push(`/teacher/lessons/${lesson.id}/edit`);
  };

  const handleSelectLesson = (id: number, checked: boolean) => {
    setSelectedLessons(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLessons(new Set(lessons.map(l => l.id)));
    } else {
      setSelectedLessons(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedLessons.size === 0) return;
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedLessons.size} bài học?\n\nHành động này không thể hoàn tác.`)) {
      // TODO: Implement bulk delete API
      selectedLessons.forEach(id => {
        deleteLessonMutation.mutate(id);
      });
      setSelectedLessons(new Set());
    }
  };

  const handleBulkShare = async () => {
    if (selectedLessons.size === 0) return;
    
    const shareUrls = Array.from(selectedLessons).map(id => 
      `${window.location.origin}/share/lesson/${id}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(shareUrls);
      success(`Đã sao chép ${selectedLessons.size} link chia sẻ!`);
    } catch (err) {
      error("Không thể sao chép link");
    }
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
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="flex gap-8">
          <div className="w-80">
            <Skeleton className="h-96" />
          </div>
          <div className="flex-1 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
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

        {/* Featured Lessons */}
        <FeaturedLessons lessons={lessons} />

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
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Danh sách bài học
                  {totalLessons > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                      ({totalLessons} bài)
                    </span>
                  )}
                </h2>

                {/* Add Lesson Button */}
                <Button
                  onClick={() => router.push("/teacher/lessons/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm bài học mới
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedLessons.size > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium">
                    Đã chọn {selectedLessons.size} bài học
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              )}
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
              <>
                {/* Select All */}
                <div className="mb-2 flex items-center gap-4 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLessons.size === lessons.length && lessons.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Chọn tất cả
                  </span>
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  {lessons.map((lesson: TeacherLesson, index: number) => (
                    <LessonListItem
                      key={lesson.id}
                      lesson={lesson}
                      index={(currentPage - 1) * LESSONS_PER_PAGE + index}
                      selected={selectedLessons.has(lesson.id)}
                      onSelect={handleSelectLesson}
                      onClick={handleLessonClick}
                    />
                  ))}
                </div>
              </>
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
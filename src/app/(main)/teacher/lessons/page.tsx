"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Plus, Clock, Users, BarChart } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/ui/button";
import { LessonFilters } from "@/components/features/teacher/LessonFilters";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/lib/hooks/useToast";
import { teacherApi, TeacherLesson, TagData } from "@/lib/api/teacher";

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

  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [allTags, setAllTags] = useState<Map<string, number>>(new Map());
  const [allLessons, setAllLessons] = useState<TeacherLesson[]>([]);

  // Calculate available tags based on current lessons
  const calculateAvailableTags = useCallback((lessonsData: TeacherLesson[]) => {
    const tagCount = new Map<string, number>();

    lessonsData.forEach((lesson) => {
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach((tag) => {
          if (tag) {
            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
          }
        });
      }
    });

    // Sort tags by popularity (count)
    const sortedTags = new Map(
      [...tagCount.entries()].sort((a, b) => b[1] - a[1]),
    );
    setAllTags(sortedTags);
  }, []);

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

  // Fetch featured lessons (4 newest)
  const { data: featuredLessonsData, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["teacher-featured-lessons"],
    queryFn: () => teacherApi.getTeacherLessons({
      page: 1,
      limit: 4,
      search: "",
      sort: "newest",
      tags: [],
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch lessons
  const { data: lessonsData, isLoading: isLoadingLessons } = useQuery({
    queryKey: ["teacher-lessons", currentPage, currentSearch, currentSort, currentTags],
    queryFn: async () => {
      const lessonsResponse = await teacherApi.getTeacherLessons({
        page: currentPage,
        limit: LESSONS_PER_PAGE,
        search: currentSearch,
        sort: currentSort,
        tags: currentTags,
      });

      // Always fetch all lessons once to maintain tag state
      if (allLessons.length === 0 || currentTags.length === 0) {
        const allLessonsResponse = await teacherApi.getTeacherLessons({
          page: 1,
          limit: 100,
          search: "",
          sort: "newest",
          tags: [],
        });
        if (allLessonsResponse.lessons) {
          setAllLessons(allLessonsResponse.lessons);
          calculateAvailableTags(allLessonsResponse.lessons);
        }
      }

      return lessonsResponse;
    },
  });

  const lessons = lessonsData?.lessons || [];
  const totalLessons = lessonsData?.total || 0;
  const totalPages = Math.ceil(totalLessons / LESSONS_PER_PAGE);
  const featuredLessons = featuredLessonsData?.lessons || [];

  // Available tags for filtering (with bidirectional support)
  const availableTags = useMemo(() => {
    if (allLessons.length === 0) {
      return [];
    }

    // Create a map to store original tag order and counts
    const tagOrderMap = new Map<string, number>();
    let orderIndex = 0;

    // First pass: collect all tags with their original order
    allLessons.forEach((lesson) => {
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach((tag) => {
          if (tag && !tagOrderMap.has(tag)) {
            tagOrderMap.set(tag, orderIndex++);
          }
        });
      }
    });

    if (currentTags.length === 0) {
      // Show all tags sorted by popularity from allTags
      return Array.from(allTags.entries()).map(([tag, count]) => ({
        name: tag,
        count,
        visible: true,
        order: tagOrderMap.get(tag) || 0,
      }));
    }

    // When tags are selected, calculate which tags would be compatible
    const compatibleTagsMap = new Map<string, number>();

    // Filter lessons that have ALL selected tags
    const filteredLessons = allLessons.filter((lesson) => {
      if (!lesson.tags || lesson.tags.length === 0) return false;
      return currentTags.every((selectedTag) =>
        lesson.tags.includes(selectedTag),
      );
    });

    // Count tags from filtered lessons
    filteredLessons.forEach((lesson) => {
      lesson.tags.forEach((tag) => {
        if (tag) {
          compatibleTagsMap.set(tag, (compatibleTagsMap.get(tag) || 0) + 1);
        }
      });
    });

    // Map all tags with visibility and counts
    return Array.from(allTags.entries()).map(([tag, originalCount]) => ({
      name: tag,
      count: compatibleTagsMap.get(tag) || originalCount,
      visible: currentTags.includes(tag) || compatibleTagsMap.has(tag),
      order: tagOrderMap.get(tag) || 0,
    }));
  }, [allTags, currentTags, allLessons]);

  // Mutations

  const deleteLessonMutation = useMutation({
    mutationFn: (id: number) => teacherApi.deleteLesson(id),
    onSuccess: () => {
      success("Đã xóa bài học thành công");
      queryClient.invalidateQueries({ queryKey: ["teacher-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-featured-lessons"] });
    },
    onError: () => {
      error("Không thể xóa bài học");
    },
  });

  // Handlers
  const handleEditLesson = (lesson: TeacherLesson) => {
    router.push(`/teacher/lessons/${lesson.id}/edit`);
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

  // Bulk selection handlers
  const handleSelectLesson = (lessonId: number, checked: boolean) => {
    if (checked) {
      setSelectedLessons(prev => [...prev, lessonId]);
    } else {
      setSelectedLessons(prev => prev.filter(id => id !== lessonId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLessons(lessons.map(lesson => lesson.id));
    } else {
      setSelectedLessons([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLessons.length === 0) return;
    
    const lessonTitles = lessons
      .filter(lesson => selectedLessons.includes(lesson.id))
      .map(lesson => lesson.title)
      .join(', ');
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedLessons.length} bài học?

${lessonTitles}

Hành động này không thể hoàn tác.`)) {
      selectedLessons.forEach(id => deleteLessonMutation.mutate(id));
      setSelectedLessons([]);
    }
  };

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

        {/* Featured Lessons Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Bài học được đề xuất
          </h2>
          {isLoadingFeatured ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : featuredLessons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredLessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80"
                  onClick={() => handleEditLesson(lesson)}
                >
                  <div className="absolute right-3 top-3 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Mới
                  </div>
                  <h3 className="mb-2 pr-8 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{lesson.studentCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(lesson.lastActivity || lesson.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800 dark:bg-gray-900/50">
              <p className="text-gray-500 dark:text-gray-400">
                Chưa có bài học nào được tạo
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <LessonFilters
            tags={tags}
            availableTags={availableTags}
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
                Tất cả bài học
                {totalLessons > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                    ({totalLessons} bài)
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2">
                {/* Bulk Actions */}
                {selectedLessons.length > 0 && (
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Đã chọn {selectedLessons.length} bài học
                    </span>
                    <Button
                      onClick={handleBulkDelete}
                      variant="destructive"
                      size="sm"
                    >
                      Xóa đã chọn
                    </Button>
                  </div>
                )}

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
              <div className="rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
                {/* Table Header */}
                <div className="flex items-center border-b border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex items-center mr-4">
                    <Checkbox
                      checked={selectedLessons.length === lessons.length && lessons.length > 0}
                      onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                    />
                  </div>
                  <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tên bài học</div>
                  <div className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300">Học sinh</div>
                  <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">Hoàn thành</div>
                  <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">Cập nhật</div>
                </div>

                {/* Lessons List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {lessons.map((lesson: TeacherLesson, index: number) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => handleEditLesson(lesson)}
                    >
                      <div className="flex items-center mr-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLessons.includes(lesson.id)}
                          onCheckedChange={(checked: boolean) => handleSelectLesson(lesson.id, checked)}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {lesson.title}
                        </h3>
                        {lesson.tags && lesson.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lesson.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                {tag}
                              </span>
                            ))}
                            {lesson.tags.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{lesson.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="w-24 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {lesson.studentCount || 0}
                      </div>
                      
                      <div className="w-32 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <BarChart className="h-4 w-4 mr-1" />
                        {lesson.completionRate || "0%"}
                      </div>
                      
                      <div className="w-32 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(lesson.lastActivity || lesson.created_at)}
                      </div>
                    </motion.div>
                  ))}
                </div>
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
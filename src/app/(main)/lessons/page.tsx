'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { lessonsApi, type Lesson } from '@/lib/api/lessons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, BookOpen, Clock, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStockImage } from '@/lib/stock-images';

export default function LessonsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'popular'>(
    (searchParams.get('sort') as 'newest' | 'oldest' | 'az' | 'za' | 'popular') || 'newest'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tags = searchParams.get('tags');
    return tags ? tags.split(',') : [];
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [allTags, setAllTags] = useState<Map<string, number>>(new Map());
  const [allLessons, setAllLessons] = useState<Lesson[]>([]); // Store all lessons for tag calculation

  const LESSONS_PER_PAGE = 12;

  // Calculate available tags based on current lessons
  const calculateAvailableTags = useCallback((lessonsData: Lesson[]) => {
    const tagCount = new Map<string, number>();
    
    lessonsData.forEach(lesson => {
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach(tag => {
          if (tag) {
            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
          }
        });
      }
    });

    // Sort tags by popularity (count)
    const sortedTags = new Map([...tagCount.entries()].sort((a, b) => b[1] - a[1]));
    setAllTags(sortedTags);
  }, []);

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback((query: string) => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    const timer = setTimeout(() => {
      fetchLessons({ search: query, page: 1 });
    }, 500);

    setSearchDebounceTimer(timer);
  }, [searchDebounceTimer]);

  // Fetch lessons from API
  const fetchLessons = useCallback(async (options?: {
    search?: string;
    sort?: string;
    tags?: string[];
    page?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        search: options?.search ?? searchQuery,
        sort: (options?.sort ?? sortBy) as 'newest' | 'oldest' | 'az' | 'za' | 'popular',
        tags: options?.tags ?? selectedTags,
        page: options?.page ?? currentPage,
        limit: LESSONS_PER_PAGE,
      };

      const response = await lessonsApi.getLessons(params);
      
      if (response.success || response.lessons) {
        const lessonsData = response.lessons || [];
        setLessons(lessonsData);

        setTotalPages(Math.ceil((response.total || 0) / LESSONS_PER_PAGE));
        setCurrentPage(response.page || 1);
        
        // Always fetch all lessons once to maintain tag state
        if (allLessons.length === 0 || selectedTags.length === 0) {
          const allLessonsResponse = await lessonsApi.getLessons({ limit: 100 });
          if (allLessonsResponse.lessons) {
            setAllLessons(allLessonsResponse.lessons);
            calculateAvailableTags(allLessonsResponse.lessons);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Không thể tải danh sách bài học. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, selectedTags, currentPage, calculateAvailableTags]);

  // Update URL params
  const updateUrlParams = useCallback((params: Record<string, string | string[]>) => {
    const url = new URL(window.location.href);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '')) {
        if (Array.isArray(value)) {
          url.searchParams.set(key, value.join(','));
        } else {
          url.searchParams.set(key, value);
        }
      } else {
        url.searchParams.delete(key);
      }
    });

    router.push(url.pathname + url.search);
  }, [router]);

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
    updateUrlParams({ search: value, page: '1' });
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value as 'newest' | 'oldest' | 'az' | 'za' | 'popular');
    setCurrentPage(1);
    fetchLessons({ sort: value, page: 1 });
    updateUrlParams({ sort: value, page: '1' });
  };

  // Handle tag selection
  const handleTagClick = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    setCurrentPage(1);
    fetchLessons({ tags: newTags, page: 1 });
    updateUrlParams({ tags: newTags, page: '1' });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLessons({ page });
    updateUrlParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle lesson card click
  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  // Handle confirm button in popup
  const handleConfirmLesson = () => {
    if (selectedLesson) {
      router.push(`/lesson/${selectedLesson.id}`);
    }
  };

  // Initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchLessons();
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }
    };
  }, [searchDebounceTimer]);

  // Sort options for select
  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ nhất' },
    { value: 'az', label: 'A-Z' },
    { value: 'za', label: 'Z-A' },
    { value: 'popular', label: 'Xem nhiều nhất' },
  ];

  // Available tags for filtering (with bidirectional support)
  const availableTags = useMemo(() => {
    if (allLessons.length === 0) {
      return [];
    }

    // Create a map to store original tag order and counts
    const tagOrderMap = new Map<string, number>();
    let orderIndex = 0;
    
    // First pass: collect all tags with their original order
    allLessons.forEach(lesson => {
      if (lesson.tags && Array.isArray(lesson.tags)) {
        lesson.tags.forEach(tag => {
          if (tag && !tagOrderMap.has(tag)) {
            tagOrderMap.set(tag, orderIndex++);
          }
        });
      }
    });

    if (selectedTags.length === 0) {
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
    const filteredLessons = allLessons.filter(lesson => {
      if (!lesson.tags || lesson.tags.length === 0) return false;
      return selectedTags.every(selectedTag => lesson.tags.includes(selectedTag));
    });

    // Count tags from filtered lessons
    filteredLessons.forEach(lesson => {
      lesson.tags.forEach(tag => {
        if (tag) {
          compatibleTagsMap.set(tag, (compatibleTagsMap.get(tag) || 0) + 1);
        }
      });
    });

    // Map all tags with visibility and counts
    return Array.from(allTags.entries()).map(([tag, originalCount]) => ({
      name: tag,
      count: compatibleTagsMap.get(tag) || originalCount,
      visible: selectedTags.includes(tag) || compatibleTagsMap.has(tag),
      order: tagOrderMap.get(tag) || 0,
    }));
  }, [allTags, selectedTags, allLessons]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">Bài học Vật lý</h1>
          <p className="text-gray-600 mb-8">Khám phá kho tàng kiến thức Vật lý lớp 12</p>
        </motion.div>

        {/* Search and Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Tìm kiếm bài học..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </div>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[200px]" data-testid="sort-select">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Lesson Confirmation Dialog */}
        <Dialog open={!!selectedLesson} onOpenChange={(open) => !open && setSelectedLesson(null)}>
          <DialogContent className="max-w-2xl" data-testid="lesson-dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl" data-testid="popup-title">
                {selectedLesson?.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
              {selectedLesson && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedLesson.thumbnail || selectedLesson.lessonImage || getStockImage(selectedLesson.id)}
                    alt={selectedLesson.title || ''}
                    className="w-full h-full object-cover"
                    data-testid="popup-thumbnail"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = getStockImage(selectedLesson.id);
                    }}
                  />
                </>
              )}
            </div>
            
            <DialogDescription className="text-base" data-testid="popup-description">
              {selectedLesson?.description || 'Không có mô tả cho bài học này.'}
            </DialogDescription>
            
            {selectedLesson?.tags && selectedLesson.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedLesson.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedLesson(null)}
                data-testid="return-button"
              >
                Quay lại
              </Button>
              <Button 
                onClick={handleConfirmLesson}
                data-testid="confirm-button"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Bắt đầu học
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium mb-3">Lọc theo chủ đề:</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags
                .sort((a, b) => {
                  // Keep selected tags in their original position
                  if (selectedTags.includes(a.name) && selectedTags.includes(b.name)) {
                    return a.order - b.order;
                  }
                  // If not selected, sort by popularity (count) then by original order
                  if (!selectedTags.includes(a.name) && !selectedTags.includes(b.name)) {
                    if (b.count !== a.count) {
                      return b.count - a.count;
                    }
                    return a.order - b.order;
                  }
                  // Selected tags maintain their position relative to each other
                  return a.order - b.order;
                })
                .map(({ name, count, visible }) => (
                  visible && (
                    <Badge
                      key={name}
                      variant={selectedTags.includes(name) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTags.includes(name) && "bg-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => handleTagClick(name)}
                      data-testid={`tag-${name}`}
                      data-selected={selectedTags.includes(name) ? "true" : undefined}
                    >
                      {name} ({count})
                    </Badge>
                  )
                ))}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800"
          >
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: LESSONS_PER_PAGE }).map((_, index) => (
              <Card key={index} className="overflow-hidden" data-testid="loading-skeleton">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Lessons Grid */}
        {!loading && lessons.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          >
            <AnimatePresence>
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                    onClick={() => handleLessonClick(lesson)}
                    data-testid="lesson-card"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lesson.thumbnail || lesson.lessonImage || getStockImage(lesson.id)}
                        alt={lesson.title}
                        className="w-full h-full object-cover"
                        data-testid="lesson-thumbnail"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getStockImage(lesson.id);
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm" data-testid="lesson-views">
                        <Eye className="inline-block h-3 w-3 mr-1" />
                        {lesson.views || 0}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2" data-testid="lesson-title">
                        {lesson.title}
                      </CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4" />
                          <span data-testid="lesson-subject">{lesson.subject || 'Vật lý'}</span>
                          <span className="text-gray-400">•</span>
                          <span data-testid="lesson-grade">Lớp {lesson.grade || 12}</span>
                        </div>
                        <p className="line-clamp-2 mt-2" data-testid="lesson-description">
                          {lesson.description || 'Không có mô tả'}
                        </p>
                      </CardDescription>
                    </CardHeader>
                    {lesson.tags && lesson.tags.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {lesson.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {lesson.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{lesson.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && lessons.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy bài học nào</h3>
            <p className="text-gray-600">
              {searchQuery || selectedTags.length > 0
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                : 'Chưa có bài học nào được tạo'}
            </p>
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center items-center gap-2"
          >
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              data-testid="prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[40px]"
                    data-testid={`page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              data-testid="next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
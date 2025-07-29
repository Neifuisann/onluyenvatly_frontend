import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Tags, BookOpen } from "lucide-react";
import { TagData } from "@/lib/api/teacher";
import { cn } from "@/lib/utils";

interface LessonFiltersProps {
  tags: TagData[];
  currentSearch: string;
  currentSort: string;
  currentTags: string[];
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onTagChange: (tags: string[]) => void;
  onCreateReview?: () => void;
}

const formatTagName = (tag: string): string => {
  const tagMap: { [key: string]: string } = {
    "dao-dong": "Dao động cơ",
    "song-co": "Sóng cơ",
    "dien-xoay-chieu": "Điện xoay chiều",
    "dao-dong-dien-tu": "Dao động điện từ",
    "song-anh-sang": "Sóng ánh sáng",
    "luong-tu": "Lượng tử",
    "hat-nhan": "Hạt nhân",
    "dien-tu": "Điện từ",
    "co-hoc": "Cơ học",
    "nhiet-hoc": "Nhiệt học",
  };
  return tagMap[tag] || tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, " ");
};

export function LessonFilters({
  tags,
  currentSearch,
  currentSort,
  currentTags,
  onSearchChange,
  onSortChange,
  onTagChange,
  onCreateReview,
}: LessonFiltersProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const handleTagClick = (tag: string) => {
    if (tag === "all") {
      onTagChange([]);
    } else {
      if (currentTags.includes(tag)) {
        onTagChange(currentTags.filter((t) => t !== tag));
      } else {
        onTagChange([tag]);
      }
    }
  };

  return (
    <aside className="w-80 space-y-6">
      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
      >
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Tìm kiếm</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm bài học hoặc tag..."
            className="w-full rounded-lg border border-gray-200 bg-white px-10 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </motion.div>

      {/* Sort & Filter Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Lọc & Sắp xếp</h3>
        </div>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sắp xếp theo
          </label>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="az">Tên A-Z</option>
            <option value="za">Tên Z-A</option>
            <option value="popular">Phổ biến</option>
          </select>
        </div>
      </motion.div>

      {/* Tags Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80"
      >
        <div className="mb-4 flex items-center gap-2">
          <Tags className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold">Tags phổ biến</h3>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => handleTagClick("all")}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              currentTags.length === 0
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <span>Tất cả</span>
          </button>
          {tags.map((tagData) => {
            const tagName = typeof tagData === "string" ? tagData : tagData.tag;
            const lessonCount = typeof tagData === "object" ? tagData.lessonCount : 0;
            const isActive = currentTags.includes(tagName);

            return (
              <button
                key={tagName}
                onClick={() => handleTagClick(tagName)}
                title={`${lessonCount} bài học`}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span>{formatTagName(tagName)}</span>
                {lessonCount > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lessonCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      {onCreateReview && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            onClick={onCreateReview}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <BookOpen className="h-5 w-5" />
            Tạo bài ôn tập
          </button>
        </motion.div>
      )}
    </aside>
  );
}
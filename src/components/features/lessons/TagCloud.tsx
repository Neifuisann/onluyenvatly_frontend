"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TagData, formatTagName } from "@/lib/hooks/useTags";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/useToast";

interface TagCloudProps {
  tags: TagData[] | string[];
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onClearTags: () => void;
}

export function TagCloud({ tags, selectedTags, onTagSelect, onTagRemove, onClearTags }: TagCloudProps) {
  const toast = useToast();
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Open lessons page filtered by this tag in new tab
      window.open(`/lessons?tags=${encodeURIComponent(tag)}`, "_blank");
      return;
    }

    if (tag === "all") {
      onClearTags();
    } else if (selectedTags.includes(tag)) {
      onTagRemove(tag);
    } else {
      onTagSelect(tag);
    }
  };


  const normalizedTags = tags.map((tag) => 
    typeof tag === "string" ? { tag, lessonCount: 0, totalViews: 0, recentActivity: 0, popularityScore: 0 } : tag
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* All button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={selectedTags.length === 0 ? "default" : "outline"}
            size="sm"
            onClick={(e) => handleTagClick("all", e)}
            className={cn(
              "transition-all duration-200",
              selectedTags.length === 0 && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            Tất cả
          </Button>
        </motion.div>

        {/* Tag buttons */}
        {normalizedTags.slice(0, 8).map((tagData, index) => {
          const isSelected = selectedTags.includes(tagData.tag);
          const hasCount = tagData.lessonCount > 0;

          return (
            <motion.div
              key={tagData.tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setHoveredTag(tagData.tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={(e) => handleTagClick(tagData.tag, e)}
                className={cn(
                  "transition-all duration-200 relative",
                  isSelected && "bg-blue-600 hover:bg-blue-700"
                )}
                title={hasCount ? `${tagData.lessonCount} bài học • ${tagData.totalViews} lượt xem` : undefined}
              >
                <span>{formatTagName(tagData.tag)}</span>
                {hasCount && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-xs bg-white/20 text-white"
                  >
                    {tagData.lessonCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Selected tags info */}
      {selectedTags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          Đang lọc theo {selectedTags.length} tag
        </motion.div>
      )}
    </div>
  );
}
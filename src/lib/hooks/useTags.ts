import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";

export interface TagData {
  tag: string;
  lessonCount: number;
  totalViews: number;
  recentActivity: number;
  popularityScore: number;
}

interface CompleteTagsResponse {
  success: boolean;
  tags: TagData[];
  tagToLessons: Record<string, number[]>;
}

interface PopularTagsResponse {
  success: boolean;
  tags: TagData[];
}

/**
 * Hook to fetch complete tags data
 */
export function useCompleteTags(limit: number = 8) {
  return useQuery<CompleteTagsResponse>({
    queryKey: ["tags", "complete", limit],
    queryFn: async () => {
      const response = await apiClient.get("/tags/complete", {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1, // Only retry once if failed
  });
}

/**
 * Hook to fetch popular tags
 */
export function usePopularTags(limit: number = 8) {
  return useQuery<PopularTagsResponse>({
    queryKey: ["tags", "popular", limit],
    queryFn: async () => {
      const response = await apiClient.get("/tags/popular", {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all tags
 */
export function useAllTags() {
  return useQuery<{ success: boolean; tags: string[] }>({
    queryKey: ["tags", "all"],
    queryFn: async () => {
      const response = await apiClient.get("/tags");
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch related tags
 */
export function useRelatedTags(tag: string | null) {
  return useQuery({
    queryKey: ["tags", "related", tag],
    queryFn: async () => {
      if (!tag) return null;
      const response = await apiClient.get(`/tags/related/${tag}`);
      return response.data;
    },
    enabled: !!tag,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Format tag name for display
 */
export function formatTagName(tag: string): string {
  const tagMap: Record<string, string> = {
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
}
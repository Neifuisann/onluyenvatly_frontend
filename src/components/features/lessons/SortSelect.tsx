"use client";

import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "az", label: "Tên A-Z" },
  { value: "za", label: "Tên Z-A" },
  { value: "popular", label: "Phổ biến" },
];

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={className}
    >
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
        Sắp xếp theo
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "w-full",
            "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
            "border-gray-200/50 dark:border-gray-700/50",
            "focus:bg-white dark:focus:bg-gray-800",
            "transition-all duration-200",
          )}
        >
          <SelectValue placeholder="Chọn cách sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}

"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { LeaderboardFilters } from "@/lib/api/leaderboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: LeaderboardFilters;
  onFilterChange: (filters: LeaderboardFilters) => void;
  onSearch: (query: string) => void;
  className?: string;
}

// Physics subjects extracted from materials
const PHYSICS_SUBJECTS = [
  { value: "all", label: "Tất cả môn học" },
  { value: "motion_kinematics", label: "Chuyển động và Động học" },
  { value: "forces_dynamics", label: "Lực và Động lực học" },
  { value: "energy", label: "Năng lượng" },
  { value: "momentum", label: "Động lượng" },
  { value: "oscillation", label: "Dao động" },
  { value: "waves", label: "Sóng" },
  { value: "electricity", label: "Điện" },
  { value: "electromagnetism", label: "Điện từ" },
  { value: "optics", label: "Quang học" },
  { value: "nuclear", label: "Hạt nhân" },
];

export function FilterBar({
  filters,
  onFilterChange,
  onSearch,
  className,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = React.useState(filters.search || "");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters.search, onSearch]);

  const handleGradeChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === "all") {
      delete newFilters.grade;
    } else {
      newFilters.grade = parseInt(value);
    }
    onFilterChange(newFilters);
  };

  const handleSubjectChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === "all") {
      delete newFilters.subject;
    } else {
      newFilters.subject = value;
    }
    onFilterChange(newFilters);
  };

  const handleTimePeriodChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === "all") {
      delete newFilters.timePeriod;
    } else {
      newFilters.timePeriod = value as "all" | "weekly" | "monthly" | "daily";
    }
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    onFilterChange({});
    onSearch("");
  };

  const hasActiveFilters =
    filters.grade || filters.subject || filters.timePeriod || searchQuery;

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn("gap-4", isMobile ? "space-y-4" : "flex items-center")}
      >
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm học sinh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Grade Filter */}
        <Select
          value={filters.grade?.toString() || "all"}
          onValueChange={handleGradeChange}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Chọn khối" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khối</SelectItem>
            <SelectItem value="10">Khối 10</SelectItem>
            <SelectItem value="11">Khối 11</SelectItem>
            <SelectItem value="12">Khối 12</SelectItem>
          </SelectContent>
        </Select>

        {/* Subject Filter */}
        <Select
          value={filters.subject || "all"}
          onValueChange={handleSubjectChange}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Chọn môn học" />
          </SelectTrigger>
          <SelectContent>
            {PHYSICS_SUBJECTS.map((subject) => (
              <SelectItem key={subject.value} value={subject.value}>
                {subject.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Period Filter */}
        <Select
          value={filters.timePeriod || "all"}
          onValueChange={handleTimePeriodChange}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thời gian</SelectItem>
            <SelectItem value="daily">Hôm nay</SelectItem>
            <SelectItem value="weekly">Tuần này</SelectItem>
            <SelectItem value="monthly">Tháng này</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className={cn("gap-2", isMobile ? "w-full" : "w-auto")}
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Đang lọc:</span>
          {searchQuery && (
            <span className="font-medium">Tìm kiếm "{searchQuery}"</span>
          )}
          {filters.grade && (
            <span className="font-medium">Khối {filters.grade}</span>
          )}
          {filters.subject && filters.subject !== "all" && (
            <span className="font-medium">
              {PHYSICS_SUBJECTS.find((s) => s.value === filters.subject)?.label}
            </span>
          )}
          {filters.timePeriod && filters.timePeriod !== "all" && (
            <span className="font-medium">
              {filters.timePeriod === "daily" && "Hôm nay"}
              {filters.timePeriod === "weekly" && "Tuần này"}
              {filters.timePeriod === "monthly" && "Tháng này"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i === l + 2) {
          rangeWithDots.push(l + 1);
        } else if (i !== l + 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i as number;
    });

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          currentPage === 1 && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Trước
      </button>

      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === "...") {
            return (
              <span
                key={`dots-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            );
          }

          const page = pageNum as number;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                "h-9 w-9 rounded-md text-sm font-medium transition-colors",
                page === currentPage
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          currentPage === totalPages && "pointer-events-none opacity-50",
        )}
      >
        Tiếp
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

interface SimplePaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  hasNextPage,
  onPageChange,
  className,
}: SimplePaginationProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          currentPage === 1 && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Trang trước
      </button>

      <span className="text-sm text-gray-600 dark:text-gray-400">
        Trang {currentPage}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          !hasNextPage && "pointer-events-none opacity-50",
        )}
      >
        Trang tiếp
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

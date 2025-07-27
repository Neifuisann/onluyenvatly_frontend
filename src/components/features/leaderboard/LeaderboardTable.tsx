"use client";

import { LeaderboardEntry } from "@/lib/api/leaderboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  onUserClick?: (userId: string) => void;
  currentPage?: number;
  totalPages?: number;
  totalEntries?: number;
  onPageChange?: (page: number) => void;
}

const tierColors: Record<string, string> = {
  Bronze: "bg-orange-500",
  Silver: "bg-gray-400",
  Gold: "bg-yellow-500",
  Platinum: "bg-cyan-500",
  Diamond: "bg-blue-500",
  Master: "bg-red-500",
};

const tierTextColors: Record<string, string> = {
  Bronze: "text-orange-700",
  Silver: "text-gray-700",
  Gold: "text-yellow-700",
  Platinum: "text-cyan-700",
  Diamond: "text-blue-700",
  Master: "text-red-700",
};

export default function LeaderboardTable({
  entries,
  isLoading,
  onUserClick,
  currentPage = 1,
  totalPages = 1,
  totalEntries = 0,
  onPageChange,
}: LeaderboardTableProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return rank;
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Không có dữ liệu xếp hạng</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => onUserClick?.(entry.studentId.toString())}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.studentName || "Unknown"}
                          </p>
                          <Badge
                            className={`${tierColors[entry.tier]} text-white`}
                          >
                            {entry.tier}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.rating}</p>
                        <p className="text-sm text-muted-foreground">Điểm</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{entry.totalLessons}</p>
                        <p className="text-muted-foreground">Bài học</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{entry.accuracy}%</p>
                        <p className="text-muted-foreground">Chính xác</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{entry.currentStreak}</p>
                        <p className="text-muted-foreground">Chuỗi</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Hạng</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead className="text-center">Điểm</TableHead>
              <TableHead className="text-center">Cấp độ</TableHead>
              <TableHead className="text-center">Bài học</TableHead>
              <TableHead className="text-center">Độ chính xác</TableHead>
              <TableHead className="text-center">Chuỗi ngày</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {entries.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onUserClick?.(entry.studentId.toString())}
                >
                  <TableCell className="font-bold">
                    {getRankIcon(entry.rank)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {entry.studentName?.charAt(0)?.toUpperCase() || "?"}
                      </motion.div>
                      <span className="font-medium">
                        {entry.studentName || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    <motion.div
                      key={entry.rating}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {entry.rating}
                    </motion.div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`${tierColors[entry.tier]} text-white`}>
                      {entry.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.totalLessons}
                  </TableCell>
                  <TableCell className="text-center">
                    {entry.accuracy}%
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1">
                      {entry.currentStreak}
                      {entry.currentStreak >= 7 && (
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          🔥
                        </motion.span>
                      )}
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          className="mt-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * 20 + 1} -{" "}
            {Math.min(currentPage * 20, totalEntries)} trong số {totalEntries}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {getPageNumbers().map((page, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: page !== "..." ? 1.1 : 1 }}
                whileTap={{ scale: page !== "..." ? 0.95 : 1 }}
              >
                {page === "..." ? (
                  <span className="px-2">...</span>
                ) : (
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange?.(page as number)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                )}
              </motion.div>
            ))}
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </>
  );
}

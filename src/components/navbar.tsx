"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { AvatarMenu } from "@/components/ui/avatar-menu";
import { useAuthStore } from "@/lib/stores/auth";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/lessons", label: "Bài học" },
  { href: "/study-materials", label: "Tài liệu" },
  { href: "/leaderboard", label: "Bảng xếp hạng" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, checkAuth } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    checkAuth();
  }, [checkAuth]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Link href="/" className="text-xl font-bold text-gray-900">
              Vật Lý 12
            </Link>
          </motion.div>

          {/* Desktop Navigation Links - Added margin-left to create space */}
          <div className="hidden md:flex items-center space-x-1 ml-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop Login Button / Avatar and Mobile Menu */}
          <div className="flex items-center space-x-4 ml-auto">
            {isClient && (
              <>
                {user ? (
                  <div className="hidden md:block">
                    <AvatarMenu />
                  </div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden md:block"
                  >
                    <Button asChild variant="default">
                      <Link href="/login">Đăng nhập</Link>
                    </Button>
                  </motion.div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Menu"
                  data-testid="mobile-menu-button"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col">
                  {/* Mobile navigation items */}
                  <div className="space-y-4">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "px-4 py-3 rounded-md text-base font-medium transition-colors",
                            isActive
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* Mobile auth section */}
                  {isClient && (
                    <div className="mt-4 pt-4 border-t">
                      {user ? (
                        <AvatarMenu isMobile />
                      ) : (
                        <Button asChild variant="default" className="w-full">
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            Đăng nhập
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
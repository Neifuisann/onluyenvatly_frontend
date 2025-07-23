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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 min-w-0"
          >
            <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Vật Lý 12
            </Link>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
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

          {/* Desktop Login Button / Avatar */}
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
          <div className="flex items-center space-x-2 md:hidden">
            {/* Mobile Login/Avatar */}
            {isClient && user && (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                <span className="text-xs font-medium">
                  {(user?.full_name || user?.username || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-10 w-10"
                  aria-label="Menu"
                  data-testid="mobile-menu-button"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[350px] max-w-[85vw] p-0 overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex-1 px-6 py-4">
                  {/* Mobile navigation items */}
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-4 py-3 rounded-lg text-base font-medium transition-colors",
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
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {user ? (
                        <AvatarMenu isMobile onClose={() => setIsOpen(false)} />
                      ) : (
                        <Button asChild variant="default" className="w-full h-12 text-base">
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            Đăng nhập
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
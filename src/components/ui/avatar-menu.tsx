"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth";
import { useLogout } from "@/lib/hooks/useAuth";

interface AvatarMenuProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function AvatarMenu({ isMobile = false, onClose }: AvatarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const logout = useLogout();

  const handleLogout = async () => {
    // Close mobile menu if present
    if (onClose) {
      onClose();
    }
    // Use the logout mutation from useLogout hook
    logout.mutate();
  };

  const menuItems = [
    {
      icon: Settings,
      label: "Cài đặt",
      href: "/settings",
      onClick: () => {
        setIsOpen(false);
        if (onClose) onClose();
      },
    },
    {
      icon: HelpCircle,
      label: "Trợ giúp",
      href: "/help",
      onClick: () => {
        setIsOpen(false);
        if (onClose) onClose();
      },
    },
    {
      icon: LogOut,
      label: "Đăng xuất",
      onClick: handleLogout,
    },
  ];

  if (isMobile) {
    // Mobile menu items (for mobile sheet menu)
    return (
      <div className="space-y-4">
        {/* User info section */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-gray-900 truncate">
              {user?.full_name || user?.username || "Học sinh"}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.phone_number || user?.email}
            </p>
          </div>
        </div>

        {/* Menu items */}
        <div className="space-y-1">
          {menuItems.map((item, index) =>
            item.href ? (
              <Link
                key={index}
                href={item.href}
                onClick={item.onClick}
                className="flex items-center space-x-3 px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                role="menuitem"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center space-x-3 px-4 py-3 text-base text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                role="menuitem"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ),
          )}
        </div>
      </div>
    );
  }

  // Desktop dropdown menu
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <Button
        variant="ghost"
        size="icon"
        className="relative w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600"
        data-testid="user-avatar"
      >
        <User className="w-5 h-5 text-white" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
          >
            <div className="py-1">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">
                  {user?.full_name || user?.username || "Học sinh"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.phone_number || user?.email}
                </p>
              </div>
              {menuItems.map((item, index) =>
                item.href ? (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={item.onClick}
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    role="menuitem"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    role="menuitem"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ),
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface LessonRouteGuardProps {
  children: React.ReactNode;
}

export function LessonRouteGuard({ children }: LessonRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Check if we're on a lesson detail page
    if (pathname.startsWith("/lesson/") && pathname !== "/lessons") {
      // Only check once to avoid re-checking on re-renders
      if (!hasChecked.current) {
        hasChecked.current = true;

        // Check if navigation was marked as valid in session storage
        const validNavigation = sessionStorage.getItem(
          "valid-lesson-navigation",
        );

        if (validNavigation === "true") {
          setIsAuthorized(true);
          // Delay removal to ensure the page loads properly
          setTimeout(() => {
            sessionStorage.removeItem("valid-lesson-navigation");
          }, 1000);
        } else {
          // Check if we have a referrer from the lessons page
          const referrer = document.referrer;
          const lessonsPattern = /\/lessons(\?|$|#)/;

          if (referrer && lessonsPattern.test(new URL(referrer).pathname)) {
            setIsAuthorized(true);
          } else {
            // Redirect to lessons page if not authorized
            router.replace("/lessons");
          }
        }
      }
    } else {
      // Not a lesson detail page, authorize by default
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, [pathname, router]);

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  // Redirect happens in useEffect, so don't render anything if not authorized
  if (
    !isAuthorized &&
    pathname.startsWith("/lesson/") &&
    pathname !== "/lessons"
  ) {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  suppressHydrationWarning?: boolean;
}

export function ClientOnly({
  children,
  fallback = null,
  suppressHydrationWarning = false,
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback as React.ReactElement;
  }

  return suppressHydrationWarning ? (
    <div suppressHydrationWarning>{children}</div>
  ) : (
    <>{children}</>
  );
}

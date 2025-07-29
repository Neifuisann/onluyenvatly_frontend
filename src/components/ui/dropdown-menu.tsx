import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export function DropdownMenu({ trigger, children, align = "start", className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[200px] rounded-lg border border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg dark:border-gray-800 dark:bg-gray-900/95",
            alignmentClasses[align],
            className
          )}
        >
          <div className="p-1">{children}</div>
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  className,
  disabled = false,
  destructive = false,
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={() => {
        if (!disabled && onClick) {
          onClick();
        }
      }}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        disabled && "opacity-50 cursor-not-allowed",
        destructive && "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />;
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4" />
    </button>
  )
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
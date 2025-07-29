import React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={`
        relative h-4 w-4 rounded border border-gray-300 bg-white transition-colors
        hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-blue-600 border-blue-600" : ""}
        ${className}
      `}
    >
      {checked && (
        <Check
          className="absolute inset-0 h-4 w-4 text-white"
          strokeWidth={3}
        />
      )}
    </button>
  );
}

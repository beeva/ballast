import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const fieldClasses =
  "rounded-lg border border-iron-700 bg-iron-900 px-3 py-2 text-sm text-iron-100 outline-none transition-colors focus:border-copper-500 focus:ring-1 focus:ring-copper-500 disabled:opacity-50";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn(fieldClasses, className)} {...props} />
);
Select.displayName = "Select";

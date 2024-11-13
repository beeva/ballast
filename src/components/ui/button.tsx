import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-copper-500 text-iron-950 hover:bg-copper-400 shadow-glow focus-visible:outline-copper-400",
  secondary: "bg-iron-800 text-iron-100 hover:bg-iron-700 focus-visible:outline-iron-400",
  ghost: "bg-transparent text-iron-200 hover:bg-iron-800/60 hover:text-iron-50 focus-visible:outline-iron-400",
  outline:
    "border border-iron-600 text-iron-100 hover:border-copper-500 hover:text-copper-400 focus-visible:outline-copper-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

function buttonClassName(variant: Variant, size: Size, className?: string): string {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors duration-150",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return <button ref={ref} className={buttonClassName(variant, size, className)} {...props} />;
  }
);
Button.displayName = "Button";

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

/**
 * A navigation link styled like Button - use this instead of wrapping a
 * <Button> in a <Link>, which nests a <button> inside an <a> (invalid HTML;
 * two interactive elements, one inside the other).
 */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant = "primary", size = "md", href, ...props }, ref) => {
    return <Link ref={ref} href={href} className={buttonClassName(variant, size, className)} {...props} />;
  }
);
LinkButton.displayName = "LinkButton";

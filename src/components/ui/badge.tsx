import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "copper" | "moss" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-iron-800 text-iron-200 border-iron-700",
  copper: "bg-copper-500/10 text-copper-400 border-copper-500/30",
  moss: "bg-moss-500/10 text-moss-400 border-moss-500/30",
  danger: "bg-red-500/10 text-red-400 border-red-500/30",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

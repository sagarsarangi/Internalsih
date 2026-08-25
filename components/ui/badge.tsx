import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors select-none font-mono",
        {
          "bg-[#3291FF]/15 text-[#3291FF] border border-[#3291FF]/30":
            variant === "default",
          "bg-[#1A1A1A] text-[#A1A1A1] border border-white/[0.08]":
            variant === "secondary",
          "bg-[#F1616B]/15 text-[#F1616B] border border-[#F1616B]/30":
            variant === "destructive",
          "border border-white/[0.12] text-[#EDEDED]": variant === "outline",
          "bg-[#141414] text-[#4CC38A] border border-white/[0.08]":
            variant === "success",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };

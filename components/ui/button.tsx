import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-[13px] font-medium transition-all focus-ring disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]",
          {
            "bg-[#EDEDED] text-[#0A0A0A] hover:bg-[#FFFFFF] shadow-sm":
              variant === "default",
            "bg-[#1A1A1A] text-[#EDEDED] hover:bg-[#262626] border border-white/[0.08]":
              variant === "secondary",
            "border border-white/[0.08] bg-transparent text-[#A1A1A1] hover:bg-[#1F1F1F] hover:text-[#EDEDED]":
              variant === "outline",
            "text-[#A1A1A1] hover:bg-[#1F1F1F] hover:text-[#EDEDED]":
              variant === "ghost",
            "bg-[#F1616B] text-white hover:bg-[#F1616B]/90":
              variant === "destructive",
          },
          {
            "h-10 px-5 py-2": size === "default",
            "h-8 px-3.5 text-[12px]": size === "sm",
            "h-12 px-7 text-[15px]": size === "lg",
            "h-9 w-9 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

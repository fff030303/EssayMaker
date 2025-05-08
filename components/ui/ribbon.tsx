"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Flame } from "lucide-react";

export interface RibbonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "new" | "hot" | "custom";
  text?: string;
  className?: string;
}

/**
 * 一个用于在卡片上显示标签的 Ribbon 组件
 */
export function Ribbon({
  variant = "new",
  text,
  className,
  ...props
}: RibbonProps) {
  const defaultText = {
    new: "🆕",
    hot: "🔥",
    custom: text || "",
  };

  const variantStyles = {
    new: "bg-blue-50 text-blue-600",
    hot: "bg-red-50 text-red-600",
    custom: "bg-purple-50 text-purple-600",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "w-8 h-8 text-xl",
        "rounded-full",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span>{text || defaultText[variant]}</span>
    </div>
  );
}

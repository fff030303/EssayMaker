import { cn } from "@/lib/utils";
import React from "react";

type GlowEffectMode = "static" | "animated";
type GlowEffectBlur = "none" | "light" | "medium" | "heavy";

interface GlowEffectProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  mode?: GlowEffectMode;
  blur?: GlowEffectBlur;
  width?: string;
  borderRadius?: string;
}

export function GlowEffect({
  children,
  className,
  containerClassName,
  colors = ["#4776E6", "#8E54E9", "#4776E6"],
  mode = "static",
  blur = "none",
  width = "2px",
  borderRadius = "1rem",
}: GlowEffectProps) {
  // 构建渐变背景
  const gradientColors = colors.join(", ");
  const gradientDirection = mode === "animated" ? "to right" : "to bottom";
  const backgroundImage = `linear-gradient(${gradientDirection}, ${gradientColors})`;

  // 根据模糊程度设置不同的滤镜效果
  const blurAmount =
    blur === "none"
      ? "0px"
      : blur === "light"
        ? "1px"
        : blur === "medium"
          ? "2px"
          : "4px"; // heavy

  // 动画样式
  const animationStyle =
    mode === "animated"
      ? {
          backgroundSize: "200% 100%",
          animation: "moveGradient 3s linear infinite",
        }
      : {};

  return (
    <div
      className={cn("relative p-[2px]", containerClassName)}
      style={{
        borderRadius: borderRadius,
      }}
    >
      {/* 渐变边框层 */}
      <div
        className={cn("absolute inset-0 z-0")}
        style={{
          backgroundImage,
          borderRadius,
          filter: `blur(${blurAmount})`,
          ...animationStyle,
        }}
      />

      {/* 内容层 */}
      <div
        className={cn("relative z-10 bg-white h-full w-full", className)}
        style={{
          borderRadius: `calc(${borderRadius} - ${width})`,
        }}
      >
        {children}
      </div>

      {/* 添加动画样式 */}
      <style jsx global>{`
        @keyframes moveGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 加载状态组件
 * 显示生成中的UI
 */

"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ColorScheme } from "./config";

interface LoadingStateProps {
  title: string;
  colorScheme: ColorScheme;
  ContentIcon: React.ComponentType<{ className?: string }>;
}

export function LoadingState({
  title,
  colorScheme,
  ContentIcon,
}: LoadingStateProps) {
  return (
    <Card
      className={`shadow-lg !border-0 ${colorScheme.gradient} relative w-full mx-auto mb-6 h-full mt-[30px] transition-all duration-300`}
      style={{
        border: "none !important",
        borderTop: "none !important",
        borderBottom: "none !important",
      }}
    >
      <CardHeader
        className="flex flex-row items-center gap-4 pb-4 pt-6 px-6 flex-shrink-0 border-b-0"
        style={{ borderBottom: "none", border: "none" }}
      >
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorScheme.iconBg} shadow-sm`}
        >
          <ContentIcon className={`h-6 w-6 ${colorScheme.iconColor}`} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {title}
          </CardTitle>
          <div className="text-sm text-gray-600 mt-1">正在为您生成内容...</div>
        </div>
      </CardHeader>

      {/* 生成中状态显示 */}
      <div
        className="flex items-center justify-center flex-grow h-full text-muted-foreground"
        style={{ minHeight: "400px" }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2
              className={`h-12 w-12 animate-spin ${colorScheme.loadingColor}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-8 w-8 rounded-full animate-ping ${colorScheme.ringColor}`}
              ></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="text-lg font-medium text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {Array.from("正在生成中...").map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  animate={{
                    y: [0, -5, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.1,
                    repeatType: "reverse",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
            <div className="text-sm text-gray-500">
              脑暴助理正在创作初稿
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

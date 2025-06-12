/**
 * 样式提供者组件
 * 负责注入 DraftResultDisplay 相关的全局样式
 */

"use client";

import React from "react";
import { GLOBAL_STYLES } from "./globalStyles";

interface StyleProviderProps {
  children: React.ReactNode;
}

export function StyleProvider({ children }: StyleProviderProps) {
  return (
    <>
      <style jsx global>
        {GLOBAL_STYLES}
      </style>
      {children}
    </>
  );
}

// 导出一个简化的注入钩子
export function useGlobalStyles() {
  React.useEffect(() => {
    // 创建 style 元素
    const styleElement = document.createElement("style");
    styleElement.id = "draft-result-global-styles";
    styleElement.textContent = GLOBAL_STYLES;

    // 检查是否已存在
    const existingStyle = document.getElementById("draft-result-global-styles");
    if (!existingStyle) {
      document.head.appendChild(styleElement);
    }

    // 清理函数
    return () => {
      const style = document.getElementById("draft-result-global-styles");
      if (style) {
        style.remove();
      }
    };
  }, []);
}

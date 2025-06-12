/**
 * DraftResultDisplay 配置文件
 * 包含颜色方案、图标配置等常量
 */

import { FileText, ScrollText, Send } from "lucide-react";

// 颜色方案类型
export interface ColorScheme {
  gradient: string;
  iconBg: string;
  iconColor: string;
  loadingColor: string;
  ringColor: string;
  buttonHover: string;
}

// 获取当前内容类型的配色方案
export const getColorScheme = (title: string): ColorScheme => {
  // 🎨 统一使用有质感的深灰色主题
  return {
    gradient: "bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90",
    iconBg: "bg-gradient-to-br from-stone-200 to-zinc-200/95",
    iconColor: "text-stone-700",
    loadingColor: "text-stone-600",
    ringColor: "bg-stone-200/85",
    buttonHover: "hover:bg-stone-100/70",
  };

  /* 原始的不同颜色配置已注释 - 现在统一使用有质感的深灰色主题
  if (title.includes("个人陈述") || title.includes("PS")) {
    return {
      gradient: "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100",
      iconBg: "bg-gradient-to-br from-green-100 to-emerald-100",
      iconColor: "text-green-600",
      loadingColor: "text-green-500",
      ringColor: "bg-green-100",
      buttonHover: "hover:bg-green-50",
    };
  } else if (title.includes("推荐信") || title.includes("RL")) {
    return {
      gradient: "bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100",
      iconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
      iconColor: "text-blue-600",
      loadingColor: "text-blue-500",
      ringColor: "bg-blue-100",
      buttonHover: "hover:bg-blue-50",
    };
  } else if (title.includes("简历") || title.includes("CV")) {
    return {
      gradient:
        "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100",
      iconBg: "bg-gradient-to-br from-purple-100 to-violet-100",
      iconColor: "text-purple-600",
      loadingColor: "text-purple-500",
      ringColor: "bg-purple-100",
      buttonHover: "hover:bg-purple-50",
    };
  } else {
    return {
      gradient: "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100",
      iconBg: "bg-gradient-to-br from-gray-100 to-slate-100",
      iconColor: "text-gray-600",
      loadingColor: "text-gray-500",
      ringColor: "bg-gray-100",
      buttonHover: "hover:bg-gray-50",
    };
  }
  */
};

// 获取内容类型对应的图标
export const getContentIcon = (title: string) => {
  if (title.includes("个人陈述") || title.includes("PS")) {
    return ScrollText;
  } else if (title.includes("推荐信") || title.includes("RL")) {
    return Send;
  } else if (title.includes("简历") || title.includes("CV")) {
    return FileText;
  } else {
    return FileText;
  }
};

// 配置常量
export const CONFIG = {
  previewLength: 50, // 收起时显示的字符数
  minContentHeight: "400px",
  cardHeight: "calc(90vh - 100px)",
} as const;

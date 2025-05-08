// 快速操作按钮组件，提供：
// - 一行两个，共四个操作按钮
// - 支持自定义按钮点击事件
// - 响应式布局适配不同屏幕大小
// - 支持自定义按钮文本和样式
// - 使用Tailwind CSS实现动画效果

"use client";

import { useState, useEffect } from "react";
import { DisplayResult } from "../types"; // 导入DisplayResult类型

// 定义按钮类型
type ButtonType = "draft" | "custom" | "schoolProfessor" | "question" | null;

interface QuickActionButtonsProps {
  onDraftClick?: () => void;
  onSchoolProfessorClick?: () => void;
  onQuestionClick?: () => void;
  onCustomClick?: () => void;
  onButtonChange?: (type: ButtonType) => void;
  setResult?: (result: DisplayResult | null) => void; // 修改类型为DisplayResult | null
}

export function QuickActionButtons({
  onDraftClick,
  onSchoolProfessorClick,
  onQuestionClick,
  onCustomClick,
  onButtonChange,
  setResult,
}: QuickActionButtonsProps) {
  // 跟踪当前选中的按钮
  const [selectedButton, setSelectedButton] = useState<ButtonType>(null);

  // 在组件加载时自动触发初稿界面
  useEffect(() => {
    if (onDraftClick) {
      onDraftClick();
    }
    if (onButtonChange) {
      onButtonChange("draft");
    }
    setSelectedButton("draft");
  }, []);

  // 处理按钮点击事件
  const handleButtonClick = (type: ButtonType, callback?: () => void) => {
    if (selectedButton !== type && onButtonChange) {
      onButtonChange(type);
    }
    
    // 当点击任何按钮时，将result设为null
    if (setResult) {
      setResult(null);
    }
    
    // 清空个人陈述初稿
    setSelectedButton(type);
    callback && callback();
    // 延迟清空，确保切换动画完成
    setTimeout(() => {
      if (setResult) {
        setResult(null);
      }
    }, 300);
  };

  // 获取按钮样式 - 基于按钮类型返回不同的渐变色
  const getButtonGradient = (type: ButtonType) => {
    switch(type) {
      case "draft":
        return "from-blue-50 via-cyan-50 to-teal-50";
      case "custom":
        return "from-indigo-50 via-purple-50 to-pink-50";
      case "schoolProfessor":
        return "from-orange-50 via-amber-50 to-yellow-50";
      case "question":
        return "from-emerald-50 via-green-50 to-lime-50";
      default:
        return "from-gray-50 via-gray-50 to-gray-50";
    }
  };

  // 获取按钮焦点环颜色
  const getRingColor = (type: ButtonType) => {
    switch(type) {
      case "draft":
        return "focus:ring-teal-300";
      case "custom":
        return "focus:ring-pink-300";
      case "schoolProfessor":
        return "focus:ring-yellow-300";
      case "question":
        return "focus:ring-lime-300";
      default:
        return "focus:ring-gray-300";
    }
  };

  return (
    <div className="w-full max-w-[600px] mx-auto mb-6 mt-6 text-base font-normal">
      <div className="flex justify-center">
      {/* 第一行 */}
        <button
          onClick={() => handleButtonClick("draft", onDraftClick)}
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getButtonGradient("draft")}
              text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
              hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${getRingColor("draft")}`}
        >
          PS初稿助理
        </button>

        {/* <button
          onClick={() => handleButtonClick("custom", onCustomClick)}
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getButtonGradient("custom")}
              text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
              hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${getRingColor("custom")}`}
        >
          PS分稿助理
        </button>

        <button
          onClick={() => handleButtonClick("schoolProfessor", onSchoolProfessorClick)}
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getButtonGradient("schoolProfessor")}
              text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
              hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${getRingColor("schoolProfessor")}`}
        >
          套瓷助理
        </button>

        <button
          onClick={() => handleButtonClick("question", onQuestionClick)}
          className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${getButtonGradient("question")}
              text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
              hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${getRingColor("question")}`}
        >
          随便问问
        </button> */}
      </div>
    </div>
  );
} 
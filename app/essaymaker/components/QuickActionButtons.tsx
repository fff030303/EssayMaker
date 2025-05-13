// 快速操作按钮组件，提供：
// - 一行两个，共四个操作按钮
// - 支持自定义按钮点击事件
// - 响应式布局适配不同屏幕大小
// - 支持自定义按钮文本和样式
// - 使用Tailwind CSS实现动画效果

"use client";

import { useState, useEffect, useRef } from "react";
import { DisplayResult } from "../types"; // 导入DisplayResult类型
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// 定义按钮类型
export type ButtonType =
  | "draft"
  | "custom"
  | "schoolProfessor"
  | "question"
  | "cv"
  | null;

interface QuickActionButtonsProps {
  onDraftClick?: () => void;
  onSchoolProfessorClick?: () => void;
  onQuestionClick?: () => void;
  onCustomClick?: () => void;
  onCvClick?: () => void; // 新增 CV 助理点击事件
  onButtonChange?: (type: ButtonType) => void;
  setResult?: (result: DisplayResult | null) => void; // 修改类型为DisplayResult | null
  setIsPSAssistant?: (isPS: boolean) => void; // 新增属性，设置是否为PS初稿助理
  setIsCVAssistant?: (isCV: boolean) => void; // 新增 CV 助理状态设置
  setShowStepNavigation?: (show: boolean) => void; // 新增属性，控制是否显示步骤导航
  setCurrentAssistantType?: (type: "draft" | "cv" | "ps" | "custom") => void; // 添加新的属性
}

export function QuickActionButtons({
  onDraftClick,
  onSchoolProfessorClick,
  onQuestionClick,
  onCustomClick,
  onCvClick,
  onButtonChange,
  setResult,
  setIsPSAssistant,
  setIsCVAssistant,
  setShowStepNavigation,
  setCurrentAssistantType, // 添加新的属性
}: QuickActionButtonsProps) {
  // 跟踪当前选中的按钮
  const [selectedButton, setSelectedButton] = useState<ButtonType>(null);
  // 创建一个ref用于PS初稿助理按钮
  const psAssistantButtonRef = useRef<HTMLButtonElement>(null);

  // 在组件加载时自动触发初稿界面
  useEffect(() => {
    if (onDraftClick) {
      onDraftClick();
    }
    if (onButtonChange) {
      onButtonChange("draft");
    }
    setSelectedButton("draft");

    // 自动设置为PS初稿助理并显示底边栏
    if (setIsPSAssistant) {
      setIsPSAssistant(true);
    }
    // 移除自动显示导航栏的代码，默认不显示
    if (setShowStepNavigation) {
      setShowStepNavigation(false);
    }

    // 自动聚焦到PS初稿助理按钮
    if (psAssistantButtonRef.current) {
      psAssistantButtonRef.current.focus();
    }
  }, []);

  // 处理按钮点击事件
  const handleButtonClick = (type: ButtonType, callback?: () => void) => {
    if (selectedButton !== type && onButtonChange) {
      onButtonChange(type);
    }

    // 设置当前助理类型
    if (setCurrentAssistantType) {
      if (type === "draft") {
        setCurrentAssistantType("draft");
      } else if (type === "cv") {
        setCurrentAssistantType("cv");
      } else if (type === "custom") {
        setCurrentAssistantType("ps");
      } else if (type === "schoolProfessor" || type === "question") {
        setCurrentAssistantType("custom");
      }
    }

    // 当点击任何按钮时，将result设为null
    if (setResult) {
      setResult(null);
    }

    // 根据按钮类型设置相应的状态
    if (setIsPSAssistant) {
      setIsPSAssistant(type === "draft");
    }
    if (setIsCVAssistant) {
      setIsCVAssistant(type === "cv");
    }
    if (setShowStepNavigation) {
      setShowStepNavigation(type === "draft" || type === "cv");
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

  // 获取按钮变体和颜色 - 基于按钮类型
  const getButtonVariant = (type: ButtonType) => {
    if (type === selectedButton) {
      return "default";
    }
    return "outline";
  };

  return (
    <Card className="w-full max-w-[650px] mx-auto my-2 border-0 shadow-none">
      <CardContent className="p-2">
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            ref={psAssistantButtonRef}
            onClick={() => handleButtonClick("draft", onDraftClick)}
            variant={getButtonVariant("draft")}
            size="sm"
            className="font-medium"
          >
            PS初稿助理
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-medium text-gray-400 cursor-not-allowed relative group"
            disabled
          >
            PS分稿助理
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
              还在开发中，敬请期待
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-medium text-gray-400 cursor-not-allowed relative group"
            disabled
          >
            套瓷助理
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
              还在开发中，敬请期待
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-medium text-gray-400 cursor-not-allowed relative group"
            disabled
          >
            随便问问
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
              还在开发中，敬请期待
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="font-medium text-gray-400 cursor-not-allowed relative group"
            disabled
          >
            CV助理
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
              还在开发中，敬请期待
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

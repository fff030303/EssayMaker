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
  | "rl"
  | null;

interface QuickActionButtonsProps {
  onDraftClick?: () => void;
  onSchoolProfessorClick?: () => void;
  onQuestionClick?: () => void;
  onCustomClick?: () => void;
  onCvClick?: () => void; // 新增 CV 助理点击事件
  onRlClick?: () => void; // 新增 RL 助理点击事件
  onButtonChange?: (type: ButtonType) => void;
  setResult?: (result: DisplayResult | null) => void; // 修改类型为DisplayResult | null
  setIsPSAssistant?: (isPS: boolean) => void; // 新增属性，设置是否为PS初稿助理
  setIsCVAssistant?: (isCV: boolean) => void; // 新增 CV 助理状态设置
  setIsRLAssistant?: (isRL: boolean) => void; // 新增 RL 助理状态设置
  setShowStepNavigation?: (show: boolean) => void; // 新增属性，控制是否显示步骤导航
  setCurrentAssistantType?: (type: "draft" | "cv" | "ps" | "custom" | "rl") => void; // 添加新的属性
}

export function QuickActionButtons({
  onDraftClick,
  onSchoolProfessorClick,
  onQuestionClick,
  onCustomClick,
  onCvClick,
  onRlClick,
  onButtonChange,
  setResult,
  setIsPSAssistant,
  setIsCVAssistant,
  setIsRLAssistant,
  setShowStepNavigation,
  setCurrentAssistantType, // 添加新的属性
}: QuickActionButtonsProps) {
  // 跟踪当前选中的按钮
  const [selectedButton, setSelectedButton] = useState<ButtonType>(null);
  // 创建一个ref用于PS初稿助理按钮
  const psAssistantButtonRef = useRef<HTMLButtonElement>(null);

  // 在组件加载时自动触发CV助理界面
  useEffect(() => {
    if (onCvClick) {
      onCvClick();
    }
    if (onButtonChange) {
      onButtonChange("cv");
    }
    setSelectedButton("cv");

    // 设置为CV助理
    if (setIsCVAssistant) {
      setIsCVAssistant(true);
    }
    if (setIsPSAssistant) {
      setIsPSAssistant(false);
    }
    if (setIsRLAssistant) {
      setIsRLAssistant(false);
    }
    // 显示导航栏
    if (setShowStepNavigation) {
      setShowStepNavigation(true);
    }

    // 设置当前助理类型
    if (setCurrentAssistantType) {
      setCurrentAssistantType("cv");
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
      } else if (type === "rl") {
        setCurrentAssistantType("rl");
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
    if (setIsRLAssistant) {
      setIsRLAssistant(type === "rl");
    }
    // 修改导航栏显示逻辑：PS初稿助理和CV助理都默认显示导航栏
    if (setShowStepNavigation) {
      // 对于PS初稿助理、CV助理和RL助理，始终显示导航栏
      setShowStepNavigation(type === "draft" || type === "cv" || type === "rl");
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
    <Card className="w-full max-w-[650px] mx-auto my-2 mt-7 border-0 shadow-none">
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
            onClick={() => handleButtonClick("custom", onCustomClick)}
            variant={getButtonVariant("custom")}
            size="sm"
            className="font-medium"
          >
            PS分稿助理
          </Button>

          <Button
            onClick={() => handleButtonClick("schoolProfessor", onSchoolProfessorClick)}
            variant={getButtonVariant("schoolProfessor")}
            size="sm"
            className="font-medium"
          >
            套瓷助理
          </Button>

          <Button
            onClick={() => handleButtonClick("question", onQuestionClick)}
            variant={getButtonVariant("question")}
            size="sm"
            className="font-medium"
          >
            随便问问
          </Button>

          <Button
            onClick={() => handleButtonClick("cv", onCvClick)}
            variant={getButtonVariant("cv")}
            size="sm"
            className="font-medium"
          >
            CV助理
          </Button>
          
          <Button
            onClick={() => handleButtonClick("rl", onRlClick)}
            variant={getButtonVariant("rl")}
            size="sm"
            className="font-medium"
          >
            推荐信助理
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

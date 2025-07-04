/**
 * QuickActionButtons 组件
 *
 * 功能：提供快速切换不同助理模式的按钮组
 *
 * 支持的助理类型：
 * - CV助理：简历生成和优化
 * - RL助理：推荐信生成
 * - PS初稿助理：个人陈述写作
 * - PS分稿助理：个人陈述分稿写作
 * - Cotton Upto助手：通用内容生成工具
 * - 自定义查询：通用查询功能
 * - 学校教授查询：专门的学术查询
 * - 问题咨询：一般性问题解答
 *
 * 核心特性：
 * 1. 状态管理：
 *    - 跟踪当前选中的按钮
 *    - 自动初始化为PS初稿助理
 *    - 防止重复初始化
 *
 * 2. 界面切换：
 *    - 清空之前的结果
 *    - 设置相应的助理状态
 *    - 控制导航栏显示
 *
 * 3. 视觉反馈：
 *    - 选中状态高亮
 *    - 响应式布局
 *    - 平滑过渡动画
 *
 * 4. 回调处理：
 *    - 支持自定义点击事件
 *    - 状态变更通知
 *    - 助理类型切换
 *
 * 布局特点：
 * - 响应式设计，适配不同屏幕尺寸
 * - 居中对齐，最大宽度限制
 * - 紧凑的按钮间距
 * - 无边框卡片容器
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DisplayResult } from "../types"; // 导入DisplayResult类型
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

// 定义按钮类型
export type ButtonType =
  | "draft"
  | "custom"
  | "schoolProfessor"
  | "question"
  | "cv"
  | "rl"
  | "sectional"
  | "cottonupto"
  | null;

interface QuickActionButtonsProps {
  onDraftClick?: () => void;
  onSchoolProfessorClick?: () => void;
  onQuestionClick?: () => void;
  onCustomClick?: () => void;
  onCvClick?: () => void; // 新增 CV 助理点击事件
  onRlClick?: () => void; // 新增 RL 助理点击事件
  onCottonUptoClick?: () => void; // 新增 Cotton Upto 助手点击事件
  onButtonChange?: (type: ButtonType) => void;
  setResult?: (result: DisplayResult | null) => void; // 修改类型为DisplayResult | null
  setIsPSAssistant?: (isPS: boolean) => void; // 新增属性，设置是否为PS初稿助理
  setIsCVAssistant?: (isCV: boolean) => void; // 新增 CV 助理状态设置
  setIsRLAssistant?: (isRL: boolean) => void; // 新增 RL 助理状态设置
  setIsSectionalAssistant?: (isSectional: boolean) => void; // 新增分稿助理状态设置
  setIsCottonUptoAssistant?: (isCottonUpto: boolean) => void; // 新增 Cotton Upto 助手状态设置
  setShowStepNavigation?: (show: boolean) => void; // 新增属性，控制是否显示步骤导航
  setCurrentAssistantType?: (
    type: "draft" | "cv" | "ps" | "custom" | "rl" | "sectional" | "cottonupto"
  ) => void; // 添加新的属性
}

export function QuickActionButtons({
  onDraftClick,
  onSchoolProfessorClick,
  onQuestionClick,
  onCustomClick,
  onCvClick,
  onRlClick,
  onCottonUptoClick,
  onButtonChange,
  setResult,
  setIsPSAssistant,
  setIsCVAssistant,
  setIsRLAssistant,
  setIsSectionalAssistant,
  setIsCottonUptoAssistant,
  setShowStepNavigation,
  setCurrentAssistantType, // 添加新的属性
}: QuickActionButtonsProps) {
  // 跟踪当前选中的按钮
  const [selectedButton, setSelectedButton] = useState<ButtonType>(null);
  // 创建一个ref用于PS初稿助理按钮
  const psAssistantButtonRef = useRef<HTMLButtonElement>(null);
  // 添加初始化标记，防止重复初始化
  const [hasInitialized, setHasInitialized] = useState(false);
  // 路由钩子
  const router = useRouter();

  // 在组件加载时自动触发PS初稿助理界面 - 只执行一次
  useEffect(() => {
    if (hasInitialized) {
      // console.log("[QUICK-BUTTONS] 已初始化，跳过重复初始化");
      return;
    }

    // console.log("[QUICK-BUTTONS] 开始初始化");
    if (onDraftClick) {
      onDraftClick();
    }
    if (onButtonChange) {
      onButtonChange("draft");
    }
    setSelectedButton("draft");

    // 设置为PS初稿助理
    if (setIsPSAssistant) {
      setIsPSAssistant(true);
    }
    if (setIsCVAssistant) {
      setIsCVAssistant(false);
    }
    if (setIsRLAssistant) {
      setIsRLAssistant(false);
    }
    if (setIsSectionalAssistant) {
      setIsSectionalAssistant(false);
    }
    if (setIsCottonUptoAssistant) {
      setIsCottonUptoAssistant(false);
    }
    // 显示导航栏
    if (setShowStepNavigation) {
      setShowStepNavigation(true);
    }

    // 设置当前助理类型
    if (setCurrentAssistantType) {
      setCurrentAssistantType("draft");
    }

    // 标记已初始化
    setHasInitialized(true);
    // console.log("[QUICK-BUTTONS] 初始化完成");
  }, [hasInitialized]); // 依赖hasInitialized而不是空数组

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
        setCurrentAssistantType("sectional");
      } else if (type === "cottonupto") {
        setCurrentAssistantType("cottonupto");
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
    if (setIsSectionalAssistant) {
      setIsSectionalAssistant(type === "custom");
    }
    if (setIsCottonUptoAssistant) {
      setIsCottonUptoAssistant(type === "cottonupto");
    }
    // 修改导航栏显示逻辑：PS初稿助理、CV助理、RL助理、分稿助理和Cotton Upto助手都默认显示导航栏
    if (setShowStepNavigation) {
      // 对于PS初稿助理、CV助理、RL助理、分稿助理和Cotton Upto助手，始终显示导航栏
      setShowStepNavigation(
        type === "draft" || type === "cv" || type === "rl" || type === "custom" || type === "cottonupto"
      );
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

  // 处理历史记录按钮点击
  const handleHistoryClick = () => {
    router.push("/console/essaymaker-history");
  };

  return (
    <Card className="w-full max-w-[750px] mx-auto my-2 mt-7 border-0 shadow-none relative">
      <CardContent className="p-2">
        <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-1 md:gap-2">
          {/* 主要功能按钮组 - 响应式换行 */}
          <Button
            onClick={() => handleButtonClick("cv", onCvClick)}
            variant={getButtonVariant("cv")}
            size="sm"
            className="font-medium text-xs md:text-sm"
          >
            CV助理
          </Button>

          <Button
            onClick={() => handleButtonClick("rl", onRlClick)}
            variant={getButtonVariant("rl")}
            size="sm"
            className="font-medium text-xs md:text-sm"
          >
            RL助理
          </Button>

          <Button
            ref={psAssistantButtonRef}
            onClick={() => handleButtonClick("draft", onDraftClick)}
            variant={getButtonVariant("draft")}
            size="sm"
            className="font-medium text-xs md:text-sm"
          >
            PS初稿助理
          </Button>

          {/* 临时禁用的按钮 - 如需恢复，请将 disabled={true} 改为 disabled={false} 或直接删除 disabled 属性 */}
          <Button
            onClick={() => handleButtonClick("custom", onCustomClick)}
            variant={getButtonVariant("custom")}
            size="sm"
            className="font-medium text-xs md:text-sm"
            disabled={false} // 设置为 false 或删除此行可恢复按钮
          >
            PS分稿助理
          </Button>

          <Button
            onClick={() => handleButtonClick("cottonupto", onCottonUptoClick)}
            variant={getButtonVariant("cottonupto")}
            size="sm"
            className="font-medium text-xs md:text-sm"
          >
            套瓷助理
          </Button>

          {/* <Button
            onClick={() =>
              handleButtonClick("schoolProfessor", onSchoolProfessorClick)
            }
            variant={getButtonVariant("schoolProfessor")}
            size="sm"
            className="font-medium text-xs md:text-sm"
            disabled={true} // 设置为 false 或删除此行可恢复按钮
          >
            套瓷助理
          </Button>

          <Button
            onClick={() => handleButtonClick("question", onQuestionClick)}
            variant={getButtonVariant("question")}
            size="sm"
            className="font-medium text-xs md:text-sm"
            disabled={true} // 设置为 false 或删除此行可恢复按钮
          >
            随便问问
          </Button> */}

          {/* 分隔线 - 响应式显示 */}
          <div className="h-5 w-px bg-gray-200 mx-1 md:mx-2"></div>

          {/* 历史记录按钮（附属功能） - 与主要按钮相同样式 */}
          <Button
            onClick={handleHistoryClick}
            variant="outline"
            size="sm"
            className="font-medium text-xs md:text-sm"
          >
            <History className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

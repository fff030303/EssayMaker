/**
 * SectionalAssistantMain 组件
 * 
 * 功能：分稿助理的主界面组件，协调分稿生成的完整流程
 * 
 * 核心特性：
 * 1. 流程管理：
 *    - 分稿生成流程
 *    - 步骤状态跟踪和切换
 *    - 进度指示和导航
 *    - 流程完成度检测
 * 
 * 2. 组件协调：
 *    - 文件上传组件集成
 *    - 结果展示组件集成
 *    - 状态在组件间传递
 *    - 统一的错误处理
 * 
 * 3. 状态管理：
 *    - 当前步骤状态
 *    - 结果数据管理
 *    - 加载状态控制
 *    - 用户交互状态
 * 
 * 4. 用户体验：
 *    - 平滑的步骤切换
 *    - 清晰的操作指引
 *    - 实时反馈机制
 *    - 错误提示和处理
 * 
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 内容溢出处理
 * 
 * 流程步骤：
 * 1. 文件上传：上传初稿文件和支持文件
 * 2. 结果展示：显示分稿策略和建议
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState } from "react";
import { DisplayResult } from "../../types";
import { SectionalFileUploadForm } from "./SectionalFileUploadForm";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { ResultSection } from "../ResultSection";
import { parseStepContent } from "../../utils/helpers";

interface SectionalAssistantMainProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  result?: DisplayResult | null;
  isLoading?: boolean;
  // 新增：分稿生成状态
  isSectionalGenerating?: boolean;
}

export function SectionalAssistantMain({
  onStepChange,
  setResult,
  result,
  isLoading,
  isSectionalGenerating = false,
}: SectionalAssistantMainProps) {
  // 本地状态管理
  const [localResult, setLocalResult] = useState<DisplayResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  // 使用传入的状态或本地状态
  const currentResult = result || localResult;

  // 处理结果更新
  const handleResultUpdate = (newResult: DisplayResult | null) => {
    if (setResult) {
      setResult(newResult);
    } else {
      setLocalResult(newResult);
    }
  };

  // 处理步骤点击
  const handleStepClick = (step: string, stepId: string) => {
    // 切换展开/折叠状态
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );

    // 解析步骤内容
    const stepData = parseStepContent(step);

    // 处理null/undefined的内容并确保有字符串类型
    const getFormattedContent = (): string => {
      // 分析查询类型，优先使用details（嵌入的内容）
      if (stepData.type === "analysis" && stepData.details) {
        return stepData.details;
      }
      // 生成内容类型，优先使用details
      else if (stepData.type === "generation") {
        // 检查内容是否重复（防止前后内容重复）
        const details = stepData.details || "";
        if (details.length > 0) {
          // 尝试查找重复部分
          const halfLength = Math.floor(details.length / 2);
          const firstHalf = details.substring(0, halfLength);
          const secondHalf = details.substring(halfLength);

          // 如果两半内容基本相同（超过80%相似），则只返回一半
          if (
            firstHalf.length > 100 &&
            secondHalf.includes(firstHalf.substring(0, firstHalf.length * 0.8))
          ) {
            return firstHalf;
          }
          return details;
        }
        return stepData.content || "";
      }
      // 搜索和网页内容类型，优先使用details
      else if (stepData.type === "search" || stepData.type === "web") {
        return stepData.details || stepData.content || "";
      }
      // 其他类型，带标题显示
      else if (stepData.content) {
        // 检查内容是否重复
        const content = stepData.content;
        if (content.length > 500) {
          // 尝试查找重复部分
          const halfLength = Math.floor(content.length / 2);
          const firstHalf = content.substring(0, halfLength);
          const secondHalf = content.substring(halfLength);

          // 如果两半内容基本相同，则只返回一半
          if (
            firstHalf.length > 100 &&
            secondHalf.includes(firstHalf.substring(0, firstHalf.length * 0.8))
          ) {
            return `## ${stepData.title}\n\n${firstHalf}`;
          }
        }
        return `## ${stepData.title}\n\n${content}`;
      }
      // 默认返回空字符串
      return "";
    };

    // 获取格式化后的内容
    const formattedContent = getFormattedContent();

    // 更新分稿助理的结果显示
    if (currentResult) {
      const updatedResult: DisplayResult = {
        ...currentResult,
        content: formattedContent, // 直接替换内容
        // 添加一个标记，表示这是步骤点击显示的内容，而不是流式生成的内容
        _isStepContent: true,
      };
      handleResultUpdate(updatedResult);
    }
  };

  return (
    <>
      {/* 分稿助理全屏加载动画 - 在第一步界面显示 */}
      {isSectionalGenerating && (
        <FullScreenLoadingAnimation 
          text="正在生成分稿策略，请勿切换页面..." 
        />
      )}

      <div className="w-full space-y-6">
        {/* 文件上传表单 */}
        <SectionalFileUploadForm
          onStepChange={onStepChange}
          setResult={handleResultUpdate}
        />

        {/* 使用 ResultSection 组件展示分稿内容 */}
        {currentResult && (
          <ResultSection
            result={currentResult}
            expandedSteps={expandedSteps}
            setExpandedSteps={setExpandedSteps}
            handleStepClick={handleStepClick}
            title="分稿过程"
          />
        )}
      </div>
    </>
  );
} 
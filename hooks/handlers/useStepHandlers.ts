"use client";

import { Dispatch, SetStateAction } from "react";
import { DisplayResult, StepContentResult } from "../../types";

interface UseStepHandlersProps {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  expandedSteps: string[];
  setExpandedSteps: Dispatch<SetStateAction<string[]>>;
  result: DisplayResult | null;
  setResult: Dispatch<SetStateAction<DisplayResult | null>>;
  secondStepResult: DisplayResult | null;
  setSecondStepResult: Dispatch<SetStateAction<DisplayResult | null>>;
  finalResult: DisplayResult | null;
  setFinalResult: Dispatch<SetStateAction<DisplayResult | null>>;
  parseStepContent: (step: string) => StepContentResult;
}

export function useStepHandlers({
  currentStep,
  setCurrentStep,
  expandedSteps,
  setExpandedSteps,
  result,
  setResult,
  secondStepResult,
  setSecondStepResult,
  finalResult,
  setFinalResult,
  parseStepContent,
}: UseStepHandlersProps) {
  // 处理步骤切换
  const handleStepChange = (step: number) => {
    setCurrentStep(step);

    // 添加自动滚动功能
    setTimeout(() => {
      // 滚动到页面顶部
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
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

    // 根据当前步骤更新相应的状态
    if (currentStep === 1) {
      // 第一步的结果显示 - 完全替换内容，而不是追加
      setResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: formattedContent, // 直接替换内容
          // 添加一个标记，表示这是步骤点击显示的内容，而不是流式生成的内容
          _isStepContent: true,
        };
      });
    } else if (currentStep === 2 && secondStepResult) {
      // 第二步的结果显示
      setSecondStepResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: formattedContent,
          _isStepContent: true,
        };
      });
    } else if (currentStep === 3 && finalResult) {
      // 第三步的结果显示
      setFinalResult((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          content: formattedContent,
          _isStepContent: true,
        };
      });
    }
  };

  return {
    handleStepChange,
    handleStepClick,
  };
}

"use client";

import { Dispatch, SetStateAction, useEffect } from "react";
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
  displayedContent: string;
  setDisplayedContent: Dispatch<SetStateAction<string>>;
  typingProgress: number;
  setTypingProgress: Dispatch<SetStateAction<number>>;
  previewLength: number;
  autoScroll: boolean;
  setIsCollapsed: Dispatch<SetStateAction<boolean>>;
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
  displayedContent,
  setDisplayedContent,
  typingProgress,
  setTypingProgress,
  previewLength,
  autoScroll,
  setIsCollapsed,
}: UseStepHandlersProps) {
  // 处理步骤切换
  const handleStepChange = (step: number) => {
    console.log("🔄 useStepHandlers - handleStepChange 被调用:", {
      fromStep: currentStep,
      toStep: step,
      timestamp: new Date().toISOString(),
    });

    setCurrentStep(step);
    console.log("✅ useStepHandlers - setCurrentStep 调用完成，新步骤:", step);

    // 添加自动滚动功能
    console.log("📜 useStepHandlers - 准备滚动到页面顶部");
    setTimeout(() => {
      // 滚动到页面顶部
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      console.log("✅ useStepHandlers - 滚动完成");
    }, 100);
  };

  // 🆕 新增：处理显示完整内容
  const handleShowFullContent = () => {
    // 获取当前活跃的结果对象
    const getCurrentResult = () => {
      if (currentStep === 1) return result;
      if (currentStep === 2) return secondStepResult;
      if (currentStep === 3) return finalResult;
      return null;
    };

    const currentResult = getCurrentResult();

    if (currentResult && (currentResult as any)._originalContent) {
      // 恢复原始完整内容
      const restoredResult: DisplayResult = {
        ...currentResult,
        content: (currentResult as any)._originalContent,
        _isStepContent: false,
        _selectedStepId: undefined,
        _stepTitle: undefined,
      } as DisplayResult;

      // 根据当前步骤更新相应的状态
      if (currentStep === 1) {
        setResult(restoredResult);
      } else if (currentStep === 2) {
        setSecondStepResult(restoredResult);
      } else if (currentStep === 3) {
        setFinalResult(restoredResult);
      }
    } else if (currentResult) {
      // 如果没有保存的原始内容，则清除步骤标记
      const restoredResult: DisplayResult = {
        ...currentResult,
        _isStepContent: false,
        _selectedStepId: undefined,
        _stepTitle: undefined,
      } as DisplayResult;

      // 根据当前步骤更新相应的状态
      if (currentStep === 1) {
        setResult(restoredResult);
      } else if (currentStep === 2) {
        setSecondStepResult(restoredResult);
      } else if (currentStep === 3) {
        setFinalResult(restoredResult);
      }
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

    // 🔧 修复：优先从步骤内容映射中获取具体内容
    let stepContent = "";
    let stepTitle = "";

    // 获取当前活跃的结果对象
    const getCurrentResult = () => {
      if (currentStep === 1) return result;
      if (currentStep === 2) return secondStepResult;
      if (currentStep === 3) return finalResult;
      return null;
    };

    const currentResult = getCurrentResult();

    // 使用类型断言来访问_stepContents属性
    const resultWithStepContents = currentResult as DisplayResult & {
      _stepContents?: Record<string, string>;
    };

    if (
      resultWithStepContents?._stepContents &&
      resultWithStepContents._stepContents[step]
    ) {
      // 🔧 修复：如果有保存的步骤内容，直接使用完整详细内容
      stepContent = resultWithStepContents._stepContents[step];
      stepTitle = step; // 使用步骤名称作为标题
      console.log(
        `从步骤内容映射中获取详细内容: ${step}`,
        stepContent.substring(0, 100) + "..."
      );
    } else {
      // 🔧 修复：如果没有保存的内容，使用解析后的内容（向后兼容）
      const stepData = parseStepContent(step);
      stepTitle = stepData.title || step; // 🔧 添加默认值，防止undefined

      console.log(`解析步骤内容: ${step}`, stepData);

      // 格式化内容的函数
      const getFormattedContent = (): string => {
        // 对于网页和搜索类型，优先使用details
        if (stepData.type === "web" && stepData.details) {
          return stepData.details;
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
              secondHalf.includes(
                firstHalf.substring(0, firstHalf.length * 0.8)
              )
            ) {
              return `## ${stepData.title}\n\n${firstHalf}`;
            }
          }
          return `## ${stepData.title}\n\n${content}`;
        }
        // 默认返回空字符串
        return "";
      };

      stepContent = getFormattedContent();
    }

    // 根据当前步骤更新相应的状态
    if (currentStep === 1) {
      // 第一步的结果显示 - 创建一个专门用于步骤显示的副本
      setResult((prev) => {
        if (!prev) return null;

        // 保存原始的完整内容
        const originalContent = (prev as any)._originalContent || prev.content;

        return {
          ...prev,
          content: stepContent, // 使用步骤特定的内容
          _isStepContent: true, // 标记这是步骤点击显示的内容
          _originalContent: originalContent, // 保存原始完整内容
          _selectedStepId: stepId, // 记录当前选择的步骤ID
          _stepTitle: stepTitle, // 保存步骤标题用于显示
        } as DisplayResult;
      });
    } else if (currentStep === 2 && secondStepResult) {
      // 第二步的结果显示
      setSecondStepResult((prev) => {
        if (!prev) return null;

        const originalContent = (prev as any)._originalContent || prev.content;

        return {
          ...prev,
          content: stepContent,
          _isStepContent: true,
          _originalContent: originalContent,
          _selectedStepId: stepId,
          _stepTitle: stepTitle,
        } as DisplayResult;
      });
    } else if (currentStep === 3 && finalResult) {
      // 第三步的结果显示
      setFinalResult((prev) => {
        if (!prev) return null;

        const originalContent = (prev as any)._originalContent || prev.content;

        return {
          ...prev,
          content: stepContent,
          _isStepContent: true,
          _originalContent: originalContent,
          _selectedStepId: stepId,
          _stepTitle: stepTitle,
        } as DisplayResult;
      });
    }
  };

  // 当结果完成时，确保显示全部内容并自动收起
  useEffect(() => {
    // 检查是否真正完成生成
    const isFullyComplete =
      result?.isComplete &&
      result.content &&
      !result.currentStep && // 确保没有正在执行的步骤
      result.content.length > 0 && // 确保有内容
      displayedContent === result.content; // 确保流式内容已完全显示

    if (isFullyComplete) {
      setDisplayedContent(result.content);
      setTypingProgress(result.content.length);

      // 当内容生成完毕且内容较长时，自动收起
      if (result.content.length > previewLength * 1.5) {
        // 延迟1秒收起，让用户能先看到完整内容
        const timer = setTimeout(() => {
          // 只有在用户没有手动滚动时才自动收起
          if (autoScroll) {
            setIsCollapsed(true);
          }
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [
    result?.isComplete,
    result?.content,
    result?.currentStep,
    previewLength,
    autoScroll,
    displayedContent,
  ]);

  return {
    handleStepChange,
    handleStepClick,
    handleShowFullContent,
  };
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { apiService } from "@/lib/api";
import { DisplayResult } from "../types";
import { debounce, parseStepContent } from "../utils/helpers";
import { Session } from "next-auth";

// 导入拆分后的钩子
import { useStepState } from "./states/useStepState";
import { useResultState } from "./states/useResultState";
import { useStepHandlers } from "./handlers/useStepHandlers";
import { useFirstStep } from "./steps/useFirstStep";
import { useSecondStep } from "./steps/useSecondStep";
import { useThirdStep } from "./steps/useThirdStep";

export function useEssayMaker(session: Session | null) {
  const { toast } = useToast();

  // 使用拆分的状态钩子
  const {
    query,
    setQuery,
    firstStepLoading,
    setFirstStepLoading,
    secondStepLoading,
    setSecondStepLoading,
    thirdStepLoading,
    setThirdStepLoading,
    showExamples,
    setShowExamples,
    isInputExpanded,
    setIsInputExpanded,
    expandedSteps,
    setExpandedSteps,
    currentStep,
    setCurrentStep,
    secondStepInput,
    setSecondStepInput,
  } = useStepState();

  // 使用拆分的结果状态钩子
  const {
    result,
    setResult,
    secondStepResult,
    setSecondStepResult,
    finalResult,
    setFinalResult,
  } = useResultState();

  // 添加ref用于滚动
  const firstStepRef = useRef<HTMLDivElement>(null);
  const secondStepRef = useRef<HTMLDivElement>(null);
  const thirdStepRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用拆分的步骤处理钩子
  const { handleStepChange, handleStepClick } = useStepHandlers({
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
  });

  // 使用拆分的第一步钩子
  const { handleStreamResponse } = useFirstStep({
    setFirstStepLoading,
    setResult,
    toast,
    session,
  });

  // 使用拆分的第二步钩子
  const { handleSecondStepSubmit, handleSecondStepInputChange } = useSecondStep(
    {
      result,
      secondStepInput,
      setSecondStepInput,
      setSecondStepLoading,
      setSecondStepResult,
      toast,
    }
  );

  // 使用拆分的第三步钩子
  const { handleFinalGeneration } = useThirdStep({
    result,
    secondStepInput,
    secondStepResult,
    setThirdStepLoading,
    setFinalResult,
    handleStepChange,
    toast,
  });

  // 处理案例点击
  const handleExampleClick = (content: string) => {
    setQuery(content);
  };

  // 定义handleSubmit函数
  const handleSubmit = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast({
        title: "错误",
        description: "请输入查询内容",
        variant: "destructive",
      });
      return;
    }

    setShowExamples(false);
    setIsInputExpanded(false); // 开始生成时自动收起输入框
    await handleStreamResponse(trimmedQuery);
  };

  // 处理快捷键
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 提交
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!firstStepLoading && query.trim()) {
          handleSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [firstStepLoading, query, handleSubmit, handleStreamResponse]);

  // 返回所有需要的状态和函数
  return {
    // 状态
    query,
    setQuery,
    firstStepLoading,
    secondStepLoading,
    thirdStepLoading,
    result,
    showExamples,
    setShowExamples,
    isInputExpanded,
    setIsInputExpanded,
    expandedSteps,
    setExpandedSteps,
    currentStep,
    secondStepInput,
    setSecondStepInput,
    secondStepResult,
    finalResult,

    // refs
    firstStepRef,
    secondStepRef,
    thirdStepRef,
    containerRef,

    // 函数
    handleExampleClick,
    handleSubmit,
    handleStepChange,
    handleSecondStepSubmit,
    handleStepClick,
    handleSecondStepInputChange,
    handleFinalGeneration,
  };
}

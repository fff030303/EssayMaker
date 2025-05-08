"use client";

import { useState } from "react";

export function useStepState() {
  // 查询和输入状态
  const [query, setQuery] = useState("");
  const [secondStepInput, setSecondStepInput] = useState("");

  // 加载状态
  const [firstStepLoading, setFirstStepLoading] = useState(false);
  const [secondStepLoading, setSecondStepLoading] = useState(false);
  const [thirdStepLoading, setThirdStepLoading] = useState(false);

  // UI状态
  const [showExamples, setShowExamples] = useState(true);
  const [isInputExpanded, setIsInputExpanded] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  // 步骤导航状态
  const [currentStep, setCurrentStep] = useState(1);

  return {
    // 查询和输入
    query,
    setQuery,
    secondStepInput,
    setSecondStepInput,

    // 加载状态
    firstStepLoading,
    setFirstStepLoading,
    secondStepLoading,
    setSecondStepLoading,
    thirdStepLoading,
    setThirdStepLoading,

    // UI状态
    showExamples,
    setShowExamples,
    isInputExpanded,
    setIsInputExpanded,
    expandedSteps,
    setExpandedSteps,

    // 步骤导航
    currentStep,
    setCurrentStep,
  };
}

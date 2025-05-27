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
import { usePSDraft } from "../components/psassistant/hooks/usePSDraft";

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
    detectedAgentType,
    setDetectedAgentType,
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
    displayedContent: result?.content || "",
    setDisplayedContent: () => {},
    typingProgress: result?.content?.length || 0,
    setTypingProgress: () => {},
    previewLength: 500,
    autoScroll: true,
    setIsCollapsed: () => {},
  });

  // 添加文件状态
  const [files, setFiles] = useState<File[]>([]);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // 添加最终初稿状态
  const [finalDraft, setFinalDraft] = useState<DisplayResult | null>(null);
  const [isGeneratingFinalDraft, setIsGeneratingFinalDraft] =
    useState<boolean>(false);

  // 跟踪files状态变化
  useEffect(() => {
    console.log("[ESSAY-MAKER] files状态更新 - 文件数量:", files.length);
  }, [files]);

  // 跟踪otherFiles状态变化
  useEffect(() => {
    console.log(
      "[ESSAY-MAKER] otherFiles状态更新 - 文件数量:",
      otherFiles.length
    );
    if (otherFiles.length > 0) {
      console.log(
        "[ESSAY-MAKER] otherFiles包含文件:",
        otherFiles.map((f) => f.name).join(", ")
      );
    }
  }, [otherFiles]);

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

  // 使用PS初稿生成钩子
  const { isGenerating: isDraftGenerating, handleDraftGeneration } = usePSDraft(
    {
      setFinalDraft,
      toast,
      session,
    }
  );

  // 同步isGeneratingFinalDraft状态
  useEffect(() => {
    setIsGeneratingFinalDraft(isDraftGenerating);
  }, [isDraftGenerating]);

  // 处理案例点击
  const handleExampleClick = (content: string) => {
    setQuery(content);
  };

  // 处理其他文件变化的回调
  const handleOtherFilesChange = (newFiles: File[]) => {
    console.log(
      `[ESSAY-MAKER] handleOtherFilesChange - 接收到${newFiles.length}个成绩单文件:`,
      newFiles.length > 0 ? newFiles.map((f) => f.name).join(", ") : "无"
    );

    // 设置otherFiles状态
    setOtherFiles(newFiles);
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

    console.log(
      "[ESSAY-MAKER] handleSubmit - 提交时初稿文件数量:",
      files.length
    );
    console.log(
      "[ESSAY-MAKER] handleSubmit - 提交时成绩单文件数量:",
      otherFiles.length
    );

    if (files.length > 0) {
      console.log(
        "[ESSAY-MAKER] handleSubmit - 初稿文件:",
        files.map((f) => f.name).join(", ")
      );
    }
    if (otherFiles.length > 0) {
      console.log(
        "[ESSAY-MAKER] handleSubmit - 成绩单文件:",
        otherFiles.map((f) => f.name).join(", ")
      );
    }

    setShowExamples(false);
    setIsInputExpanded(false); // 开始生成时自动收起输入框

    // 确保调用API前已有正确的文件数量
    console.log("[ESSAY-MAKER] handleSubmit - 准备调用API，传递参数:");
    console.log("[ESSAY-MAKER] - 查询文本:", trimmedQuery);
    console.log("[ESSAY-MAKER] - 初稿文件数量:", files.length);
    console.log("[ESSAY-MAKER] - 成绩单文件数量:", otherFiles.length);

    // 调用API处理
    await handleStreamResponse(trimmedQuery, files, otherFiles);
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

  // 生成最终初稿的流式处理函数
  const handleFinalDraftSubmit = async (
    draftQuery: string,
    draftFiles: File[],
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null // 添加成绩单解析参数
  ) => {
    console.log("[ESSAY-MAKER] 🚀 handleFinalDraftSubmit 开始执行");
    console.log("[ESSAY-MAKER] 参数:", {
      direction,
      requirements,
      purifiedContentLength: purifiedContent.length,
      transcriptAnalysisLength: transcriptAnalysis?.length || 0,
    });

    // 直接调用专门的初稿生成hook
    await handleDraftGeneration(
      purifiedContent,
      direction,
      requirements,
      transcriptAnalysis
    );
  };

  // 返回所有需要的状态和函数
  return {
    // 状态
    query,
    setQuery,
    firstStepLoading,
    secondStepLoading,
    thirdStepLoading,
    result,
    setResult,
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
    files,
    setFiles,
    otherFiles,
    setOtherFiles,
    finalDraft,
    isGeneratingFinalDraft,
    setFinalDraft,

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
    handleFinalDraftSubmit,
    handleOtherFilesChange,
    handleStreamResponse,
  };
}

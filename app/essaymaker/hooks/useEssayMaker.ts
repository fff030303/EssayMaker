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

  // 添加最终初稿状态
  const [finalDraft, setFinalDraft] = useState<DisplayResult | null>(null);
  const [isGeneratingFinalDraft, setIsGeneratingFinalDraft] = useState<boolean>(false);

  // 跟踪files状态变化
  useEffect(() => {
    console.log("useEssayMaker - files状态更新 - 文件数量:", files.length);
  }, [files]);

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

    console.log("useEssayMaker - handleSubmit - 提交时文件数量:", files.length);
    setShowExamples(false);
    setIsInputExpanded(false); // 开始生成时自动收起输入框
    await handleStreamResponse(trimmedQuery, files);
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
    requirements?: string
  ) => {
    try {
      // 检查参数
      if (!purifiedContent) {
        toast({
          title: "错误",
          description: "提纯内容不能为空",
          variant: "destructive",
        });
        return;
      }

      // 设置生成状态
      setIsGeneratingFinalDraft(true);
      
      // 构建定制需求组合文本
      const combinedRequirements = `申请方向：${direction}${requirements ? `，具体要求：${requirements}` : ''}`;
      
      // 初始化finalDraft状态
      setFinalDraft({
        content: "",
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep: "正在开始生成最终初稿...",
        isComplete: false,
      });

      console.log("useEssayMaker - handleFinalDraftSubmit - 提交时文件数量:", draftFiles.length);
      console.log("生成最终初稿参数:", {
        simplified_material_length: purifiedContent.length,
        transcript_files_count: draftFiles.length,
        combined_requirements: combinedRequirements,
      });

      // 使用新的API函数，适应新的参数格式
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), 30000); // 30秒超时
      });

      // 使用新的API服务函数
      const streamPromise = apiService.streamFinalDraftWithFiles({
        simplified_material: purifiedContent,
        transcript_files: draftFiles,
        combined_requirements: combinedRequirements,
      });
      
      // 使用 Promise.race 实现超时处理
      const stream = (await Promise.race([
        streamPromise,
        timeoutPromise,
      ])) as ReadableStream<Uint8Array> | null;

      if (!stream) {
        throw new Error("无法获取响应流");
      }

      try {
        // 处理流式响应
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let mergedSteps: string[] = [];
        let currentStep = "正在开始生成最终初稿...";
        let accumulatedContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 解码二进制数据为文本
            const chunkText = decoder.decode(value, { stream: true });
            buffer += chunkText;
            
            // 按行处理buffer
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // 最后一行可能不完整，保留到下一次处理
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  switch (data.type) {
                    case "step":
                      // 更新当前步骤
                      currentStep = data.content;
                      mergedSteps.push(data.content);

                      // 更新结果
                      setFinalDraft((prev) => ({
                        ...prev!,
                        currentStep,
                        steps: [...mergedSteps],
                      }));
                      break;

                    case "content":
                      // 获取新内容
                      const newContent = data.content || "";
                      
                      // 处理可能的重复内容
                      if (
                        newContent.length > 200 &&
                        accumulatedContent.includes(newContent)
                      ) {
                        console.log("检测到大段重复内容，忽略");
                        break; // 忽略这次更新
                      }

                      // 如果新内容包含已累积的内容，使用新内容替换
                      if (
                        newContent.length > 500 &&
                        newContent.includes(accumulatedContent) &&
                        accumulatedContent.length > 200
                      ) {
                        accumulatedContent = newContent;
                      } else {
                        // 正常累积内容
                        accumulatedContent += newContent;
                      }

                      // 更新UI
                      setFinalDraft((prev) => ({
                        ...prev!,
                        content: accumulatedContent,
                      }));
                      break;
                    
                    case "complete":
                      // 完成状态
                      setFinalDraft((prev) => ({
                        ...prev!,
                        isComplete: true,
                        currentStep: undefined,
                      }));
                      console.log("最终初稿生成完成");
                      break;
                  }
                } catch (error) {
                  console.error("JSON解析错误:", error);
                }
              }
            }
          }
        } catch (streamError) {
          console.error("读取流数据时出错:", streamError);
          throw streamError;
        } finally {
          reader.releaseLock();
        }
        
        // 确保设置完成状态
        setFinalDraft((prev) => ({
          ...prev!,
          isComplete: true,
          currentStep: undefined,
        }));
        
        console.log("最终初稿生成完成");
      } catch (error) {
        console.error("处理流式响应时出错:", error);
        throw error;
      }
    } catch (error) {
      console.error("生成最终初稿时出错:", error);
      toast({
        title: "生成失败",
        description: "生成最终初稿时出现错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFinalDraft(false);
    }
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
  };
}

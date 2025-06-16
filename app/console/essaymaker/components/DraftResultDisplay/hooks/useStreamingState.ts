/**
 * 流式生成状态管理 Hook
 * 管理自动滚动等状态
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ContentSegment } from "../contentUtils";

interface UseStreamingStateProps {
  effectiveResult: any;
  enableGlobalStreaming?: boolean;
  globalTask?: any;
  contentSegments: ContentSegment[];
}

export function useStreamingState({
  effectiveResult,
  enableGlobalStreaming,
  globalTask,
  contentSegments,
}: UseStreamingStateProps) {
  const { toast } = useToast();

  // 基础状态
  const [autoScroll, setAutoScroll] = useState(true);
  const [userManuallyScrolled, setUserManuallyScrolled] = useState(false);

  // reasoning相关状态
  const [shouldCollapseReasoning, setShouldCollapseReasoning] = useState(false);
  const [hasTriggeredAutoCollapse, setHasTriggeredAutoCollapse] =
    useState(false);

  // refs
  const lastUpdateRef = useRef<number>(Date.now());
  const previousTimestampRef = useRef<string>("");

  // 分离reasoning和非reasoning内容
  const reasoningSegments = contentSegments.filter(
    (seg) => seg.content_type === "reasoning"
  );
  const nonReasoningSegments = contentSegments.filter(
    (seg) => seg.content_type !== "reasoning"
  );

  // 监控resume内容生成，用于自动收起thinking
  useEffect(() => {
    if (nonReasoningSegments.length > 0 && !hasTriggeredAutoCollapse) {
      // 检查是否有实际的内容（不只是空白）
      const hasActualContent = nonReasoningSegments.some(
        (seg) => seg.content && seg.content.trim().length > 0
      );

      if (hasActualContent) {
        // console.log("首次检测到resume内容开始生成，准备自动收起thinking");
        setShouldCollapseReasoning(true);
        setHasTriggeredAutoCollapse(true);

        // 延迟重置shouldCollapseReasoning，给ReasoningCard足够时间响应
        setTimeout(() => {
          setShouldCollapseReasoning(false);
          // console.log("重置shouldCollapseReasoning，允许用户手动展开");
        }, 100);
      }
    }
  }, [nonReasoningSegments.length, hasTriggeredAutoCollapse]);

  // 每次result.timestamp变化时重置显示内容和状态 - 使用ref避免无限循环
  useEffect(() => {
    if (!effectiveResult?.timestamp) return;
    
    // 只有当timestamp真正变化时才重置状态
    if (previousTimestampRef.current !== effectiveResult.timestamp) {
      previousTimestampRef.current = effectiveResult.timestamp;
      setUserManuallyScrolled(false);
      setAutoScroll(true);
      setShouldCollapseReasoning(false);
      setHasTriggeredAutoCollapse(false);
      lastUpdateRef.current = Date.now();
    }
  }, [effectiveResult?.timestamp]);

  // 当结果完成时，确保显示全部内容
  useEffect(() => {
    if (effectiveResult?.isComplete && effectiveResult.content) {
      lastUpdateRef.current = Date.now();
    }
  }, [effectiveResult?.isComplete, effectiveResult?.content]);

  // 处理自动滚动按钮点击
  const handleAutoScrollClick = useCallback(() => {
    const newAutoScroll = !autoScroll;
    setAutoScroll(newAutoScroll);

    if (newAutoScroll) {
      setUserManuallyScrolled(false);
      // console.log("用户手动启用了自动滚动");
    } else {
      // console.log("用户手动关闭了自动滚动");
    }

    toast({
      title: newAutoScroll ? "已启用自动滚动" : "已禁用自动滚动",
      description: newAutoScroll
        ? "内容将自动滚动到底部"
        : "内容将保持当前位置",
    });
  }, [autoScroll, toast]);

  // 🆕 使用useCallback稳定状态更新函数引用
  const stableSetAutoScroll = useCallback((value: boolean) => {
    setAutoScroll(value);
  }, []);

  const stableSetUserManuallyScrolled = useCallback((value: boolean) => {
    setUserManuallyScrolled(value);
  }, []);

  const stableSetShouldCollapseReasoning = useCallback((value: boolean) => {
    setShouldCollapseReasoning(value);
  }, []);

  const stableSetHasTriggeredAutoCollapse = useCallback((value: boolean) => {
    setHasTriggeredAutoCollapse(value);
  }, []);

  // 判断是否正在生成中（流式输出开始前）
  const isGenerating =
    !effectiveResult || (effectiveResult && !effectiveResult.content);

  // 判断是否正在流式生成中
  const isStreaming =
    enableGlobalStreaming && globalTask?.status === "streaming";
  const isPaused = enableGlobalStreaming && globalTask?.status === "paused";

  return {
    // 状态
    autoScroll,
    userManuallyScrolled,
    shouldCollapseReasoning,
    hasTriggeredAutoCollapse,
    isGenerating,
    isStreaming,
    isPaused,

    // 分离的内容
    reasoningSegments,
    nonReasoningSegments,

    // 处理函数
    handleAutoScrollClick,
    setAutoScroll: stableSetAutoScroll,
    setUserManuallyScrolled: stableSetUserManuallyScrolled,
    setShouldCollapseReasoning: stableSetShouldCollapseReasoning,
    setHasTriggeredAutoCollapse: stableSetHasTriggeredAutoCollapse,
  };
}

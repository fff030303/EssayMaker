/**
 * DraftResultComponent 组件
 *
 * 功能：初稿结果显示的核心组件，支持流式生成和实时显示
 *
 * 🎨 现代化设计特性：
 * 1. 渐变背景效果：
 *    - 卡片采用现代渐变背景
 *    - 不同类型内容使用不同配色方案
 *    - 柔和的视觉层次感
 *
 * 2. 统一图标系统：
 *    - 使用Lucide React图标
 *    - 图标与内容类型智能匹配
 *    - 一致的视觉语言
 *
 * 3. 现代化交互：
 *    - 圆形按钮设计
 *    - 悬停动画效果
 *    - 响应式布局适配
 *
 * 核心特性：
 * 1. 智能内容渲染：
 *    - 自动检测HTML和Markdown格式
 *    - 动态选择最佳渲染方式
 *    - 支持混合格式内容处理
 *    - 实时内容更新和显示
 *
 * 2. 流式生成支持：
 *    - 实时接收流式数据
 *    - 逐字显示打字机效果
 *    - 平滑的内容更新动画
 *    - 自动滚动到最新内容
 *    - 支持跨页面后台生成
 *
 * 3. 内容处理：
 *    - HTML内容安全化处理
 *    - Markdown语法解析和渲染
 *    - 换行和格式优化
 *    - 重复内容清理
 *
 * 4. 用户交互：
 *    - 内容复制功能
 *    - 导出下载选项
 *    - 手动滚动控制
 *    - 加载状态指示
 *    - 暂停/恢复生成控制
 *
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 动态高度调整
 *    - 内容溢出处理
 *    - 优雅的布局适应
 *
 * 6. 性能优化：
 *    - 内容缓存机制
 *    - 虚拟滚动支持
 *    - 懒加载处理
 *    - 内存使用优化
 *
 * 7. 全局状态管理：
 *    - 跨页面状态保持
 *    - 后台生成支持
 *    - 任务恢复机制
 *    - 全局任务管理
 *
 * 技术实现：
 * - 使用ReactMarkdown进行Markdown渲染
 * - 使用DOMPurify进行HTML安全化
 * - 支持remarkGfm扩展语法
 * - 自定义组件样式和交互
 * - 集成全局流式生成上下文
 *
 * @author EssayMaker Team
 * @version 3.0.0 - 现代化设计升级，模块化重构
 */

"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  FileText,
  RefreshCcw,
  Download,
} from "lucide-react";

// 导入拆分出来的模块
import { parseMultiSegmentContent } from "./contentUtils";
import { getColorScheme, getContentIcon, CONFIG } from "./config";
import { LoadingState } from "./LoadingState";
import { useDraftResultHandlers } from "./hooks/useDraftResultHandlers";
import { useStreamingState } from "./hooks/useStreamingState";
import { useGlobalStreamingHandlers } from "./hooks/useGlobalStreamingHandlers";
import { ContentRenderer } from "./ContentRenderer";
import { ActionButtons } from "./ActionButtons";
import { ReasoningCard } from "./ReasoningCard";
import { useGlobalStyles } from "./StyleProvider";
import type { DraftResultDisplayProps } from "./types";

// 导入全局流式生成相关
import { useStreaming } from "../../contexts/StreamingContext";

export function DraftResultDisplay({
  result,
  title = "素材整理报告",
  headerActions,
  // 新增属性：支持全局流式生成
  enableGlobalStreaming = false,
  taskId,
  onTaskCreated,
}: DraftResultDisplayProps & {
  enableGlobalStreaming?: boolean;
  taskId?: string;
  onTaskCreated?: (taskId: string) => void;
}) {
  // 注入全局样式
  useGlobalStyles();

  // 全局流式生成相关
  const { getTask } = useStreaming();

  // 获取全局任务状态
  const globalTask = taskId ? getTask(taskId) : null;

  // 如果启用了全局流式生成且有任务ID，优先使用全局任务的结果
  const effectiveResult =
    enableGlobalStreaming && globalTask?.result ? globalTask.result : result;

  // 解析多段内容
  const contentSegments = effectiveResult?.content
    ? parseMultiSegmentContent(effectiveResult.content)
    : [];

  // 获取配色方案和图标
  const colorScheme = getColorScheme(title);
  const ContentIcon = getContentIcon(title);

  // 使用自定义hooks
  const streamingState = useStreamingState({
    effectiveResult,
    enableGlobalStreaming,
    globalTask,
    contentSegments,
  });

  const handlers = useDraftResultHandlers({
    contentSegments,
    effectiveResult,
    title,
  });

  const globalStreamingHandlers = useGlobalStreamingHandlers({
    taskId,
  });

  // refs
  const contentRef = useRef<HTMLDivElement>(null);

  // 添加日志查看后端返回的数据
  useEffect(() => {
    if (effectiveResult) {
      console.log("后端返回的数据:", effectiveResult);
      console.log("内容长度:", effectiveResult.content?.length || 0);
      console.log("解析的段落:", contentSegments);
      console.log(
        "reasoning段落数量:",
        streamingState.reasoningSegments.length
      );
      console.log(
        "非reasoning段落数量:",
        streamingState.nonReasoningSegments.length
      );
      console.log("是否完成:", effectiveResult.isComplete);
      console.log("当前步骤:", effectiveResult.currentStep);
      console.log("时间戳:", effectiveResult.timestamp);

      if (enableGlobalStreaming && globalTask) {
        console.log("全局任务状态:", globalTask.status);
        console.log("任务ID:", globalTask.id);
      }
    }
  }, [
    effectiveResult,
    enableGlobalStreaming,
    globalTask,
    contentSegments,
    streamingState.reasoningSegments,
    streamingState.nonReasoningSegments,
  ]);

  // 根据 autoScroll 状态控制自动滚动
  useEffect(() => {
    if (
      streamingState.autoScroll &&
      contentRef.current &&
      !streamingState.userManuallyScrolled &&
      effectiveResult?.content
    ) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [
    effectiveResult?.content,
    streamingState.autoScroll,
    streamingState.userManuallyScrolled,
  ]);

  // 用户手动滚动检测
  useEffect(() => {
    function globalWheelHandler() {
      if (streamingState.autoScroll) {
        streamingState.setAutoScroll(false);
        streamingState.setUserManuallyScrolled(true);
      }
    }

    // 全局添加滚轮事件监听
    window.addEventListener("wheel", globalWheelHandler, { capture: true });
    window.addEventListener("mousewheel", globalWheelHandler as any, {
      capture: true,
    });
    window.addEventListener("DOMMouseScroll", globalWheelHandler as any, {
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", globalWheelHandler, {
        capture: true,
      });
      window.removeEventListener("mousewheel", globalWheelHandler as any, {
        capture: true,
      });
      window.removeEventListener("DOMMouseScroll", globalWheelHandler as any, {
        capture: true,
      });
    };
  }, [streamingState.autoScroll]);

  // 单独检测内容区域的滚动
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    function containerScrollHandler() {
      if (!container) return;

      // 检查是否滚动到底部
      const isAtBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight
        ) < 70;

      if (isAtBottom && !streamingState.autoScroll) {
        // 如果滚动到底部，启用自动滚动
        streamingState.setAutoScroll(true);
        streamingState.setUserManuallyScrolled(false);
        console.log("滚动到底部，启用自动滚动");
      } else if (!isAtBottom && streamingState.autoScroll) {
        // 如果没有滚动到底部，禁用自动滚动
        streamingState.setAutoScroll(false);
        streamingState.setUserManuallyScrolled(true);
        console.log("滚动未到底部，禁用自动滚动");
      }
    }

    container.addEventListener("scroll", containerScrollHandler);

    return () => {
      container.removeEventListener("scroll", containerScrollHandler);
    };
  }, [streamingState.autoScroll]);

  // 如果正在生成中，显示加载状态
  if (streamingState.isGenerating) {
    return (
      <LoadingState
        title={title}
        colorScheme={colorScheme}
        ContentIcon={ContentIcon}
      />
    );
  }

  // 显示的内容（不再进行折叠处理）
  const displayContent = effectiveResult?.content || "";

  return (
    <div
      className="w-full max-w-4xl mx-auto h-full flex flex-col shadow-md"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Card
        className="bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 border flex flex-col h-full max-h-[800px] card-container"
        style={{ outline: "none !important" }}
      >
        <CardHeader
          className="bg-gradient-to-r from-stone-200/60 to-zinc-200/50 px-4 py-3"
          style={{ border: "none !important", boxShadow: "none !important" }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg shadow-sm">
              <FileText className="h-5 w-5 text-stone-700" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-semibold text-stone-800 tracking-tight">
                {title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <ActionButtons
                headerActions={headerActions}
                colorScheme={colorScheme}
                isComplete={effectiveResult?.isComplete || false}
                copying={false}
                isStreaming={streamingState.isStreaming || false}
                isPaused={streamingState.isPaused || false}
                enableGlobalStreaming={enableGlobalStreaming}
                taskId={taskId}
                handleCopy={handlers.handleCopy}
                handleDownload={handlers.handleDownload}
                handlePauseGlobalStream={
                  globalStreamingHandlers.handlePauseGlobalStream
                }
                handleResumeGlobalStream={
                  globalStreamingHandlers.handleResumeGlobalStream
                }
                handleStopGlobalStream={
                  globalStreamingHandlers.handleStopGlobalStream
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 bg-stone-50/50 flex-grow flex flex-col min-h-0 card-content">
          {streamingState.isGenerating ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6 bg-stone-200/60 flex-grow">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-stone-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-stone-800">
                  {title.includes("改写策略")
                    ? "正在生成改写策略"
                    : title.includes("素材整理")
                    ? "正在生成素材整理"
                    : "正在生成初稿"}
                </h3>
                <p className="text-stone-600 max-w-md">
                  {title.includes("改写策略")
                    ? "脑暴助理正在分析您的需求并生成个人陈述改写策略，请稍候..."
                    : title.includes("素材整理")
                    ? "脑暴助理正在分析您的需求并生成素材整理报告，请稍候..."
                    : "脑暴助理正在分析您的需求并生成个人陈述初稿，请稍候..."}
                </p>
              </div>
            </div>
          ) : effectiveResult?.content ? (
            <div
              ref={contentRef}
              className="flex-grow p-6 min-h-0 content-scroll-container"
              style={{
                height: "600px",
                overflowY: "scroll",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="prose prose-stone max-w-none leading-relaxed text-stone-700">
                <ContentRenderer
                  contentSegments={contentSegments}
                  nonReasoningSegments={streamingState.nonReasoningSegments}
                  reasoningSegments={streamingState.reasoningSegments}
                  contentToRender={effectiveResult.content}
                  isComplete={effectiveResult?.isComplete || false}
                  shouldCollapseReasoning={
                    streamingState.shouldCollapseReasoning
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-4 flex-grow">
              <div className="w-16 h-16 bg-stone-200/60 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-stone-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-stone-700">暂无结果</h3>
                <p className="text-stone-500 text-sm">
                  请先完成上方表单填写并提交生成请求
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

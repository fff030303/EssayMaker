/**
 * DraftResultComponent 组件
 * 
 * 功能：初稿结果显示的核心组件，支持流式生成和实时显示
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
 * @version 2.0.0
 */

"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  FileText,
  Loader2,
  CheckCircle,
  Copy,
  ClipboardCopy,
  Download,
  ChevronUp,
  ChevronDown,
  Code,
  ScrollText,
  Send,
  Pause,
  Play,
  Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// 导入拆分出来的模块
import { scrollbarStyles } from "./styles";
import {
  detectContentType,
  extractMarkdownFromHtml,
  sanitizeHtml,
  unwrapMarkdownCodeBlock,
  cleanMarkdownToPlainText,
  removeHtmlKeepMarkdown,
} from "./utils";
import { markdownComponents } from "./MarkdownComponents";
import type { DraftResultDisplayProps } from "./types";
import type { DisplayResult } from "../../types";

// 导入全局流式生成相关
import { useStreaming } from "../../contexts/StreamingContext";
import { useGlobalStreamResponse } from "../../hooks/useGlobalStreamResponse";

// 🆕 导入新的独立ReasoningCard组件
import { ReasoningCard } from "./ReasoningCard";

// 新增：内容类型接口
interface ContentSegment {
  content_type: 'reasoning' | 'resume' | 'default';
  content: string;
  isComplete?: boolean;
}

// 新增：解析多段内容的函数
const parseMultiSegmentContent = (content: string): ContentSegment[] => {
  if (!content) return [];

  // 🆕 处理混合格式：reasoning是JSON行，resume是纯文本
  const trimmedContent = content.trim();
  const lines = trimmedContent.split('\n');
  
  // 检查是否包含reasoning类型的JSON行
  const reasoningLines = lines.filter(line => {
    const trimmed = line.trim();
    return (trimmed.startsWith('data: {') || trimmed.startsWith('{')) && 
           trimmed.includes('"content_type": "reasoning"');
  });
  
  // 如果没有reasoning行，说明是纯文本内容
  if (reasoningLines.length === 0) {
    console.log("检测到纯文本内容（无reasoning），不进行JSON解析");
    return [{
      content_type: 'default',
      content: content,
      isComplete: false
    }];
  }

  console.log("检测到包含reasoning的混合格式，开始解析:", {
    reasoningLines: reasoningLines.length,
    totalLines: lines.length
  });

  // 🆕 分离reasoning（JSON格式）和其他内容（纯文本）
  const segments: ContentSegment[] = [];
  let nonReasoningContent = "";

  for (const line of lines) {
    let trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 🆕 处理SSE格式的'data: '前缀
    if (trimmedLine.startsWith('data: ')) {
      trimmedLine = trimmedLine.substring(6);
    }

    // 跳过SSE的其他控制消息
    if (trimmedLine === '' || trimmedLine.startsWith('event:') || trimmedLine.startsWith('id:')) {
      continue;
    }

    // 🆕 检查是否是reasoning的JSON行
    if (trimmedLine.startsWith('{') && trimmedLine.includes('"content_type": "reasoning"')) {
      try {
        const parsed = JSON.parse(trimmedLine);
        
        if (parsed.type === "content" && parsed.content_type === 'reasoning' && parsed.content) {
          segments.push({
            content_type: 'reasoning',
            content: parsed.content || '',
            isComplete: parsed.isComplete
          });
          continue;
        }
        
        // 处理简化格式
        if (parsed.content_type === 'reasoning' && parsed.content) {
          segments.push({
            content_type: 'reasoning',
            content: parsed.content || '',
            isComplete: parsed.isComplete
          });
          continue;
        }
      } catch (e) {
        console.log("reasoning JSON解析失败:", trimmedLine.substring(0, 50) + "...");
        // 解析失败，当作普通文本处理
        nonReasoningContent += line + "\n";
      }
    } else {
      // 🆕 非reasoning行，直接添加到普通内容中
      nonReasoningContent += line + "\n";
    }
  }

  // 🆕 如果有非reasoning内容，添加为default类型段落
  if (nonReasoningContent.trim()) {
    segments.push({
      content_type: 'default',
      content: nonReasoningContent.trim(),
      isComplete: false
    });
  }

  console.log("成功解析混合格式内容:", {
    reasoningSegments: segments.filter(s => s.content_type === 'reasoning').length,
    defaultSegments: segments.filter(s => s.content_type === 'default').length,
    segments: segments.map(s => ({ type: s.content_type, length: s.content.length }))
  });

  return segments;
};

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
  // 全局流式生成相关
  const { getTask, updateTaskResult } = useStreaming();
  const {
    pauseGlobalStream,
    resumeGlobalStream,
    stopGlobalStream,
    getTaskStatus,
  } = useGlobalStreamResponse();

  // 获取全局任务状态
  const globalTask = taskId ? getTask(taskId) : null;
  
  // 如果启用了全局流式生成且有任务ID，优先使用全局任务的结果
  const effectiveResult = enableGlobalStreaming && globalTask?.result 
    ? globalTask.result 
    : result;

  // 新增：解析多段内容
  const contentSegments = effectiveResult?.content 
    ? parseMultiSegmentContent(effectiveResult.content)
    : [];

  // 🆕 分离reasoning和非reasoning内容
  const reasoningSegments = contentSegments.filter(seg => seg.content_type === 'reasoning');
  const nonReasoningSegments = contentSegments.filter(seg => seg.content_type !== 'reasoning');

  // 🆕 监控resume内容生成，用于自动收起thinking
  const [shouldCollapseReasoning, setShouldCollapseReasoning] = useState(false);
  // 🆕 添加状态来跟踪是否已经触发过自动收起
  const [hasTriggeredAutoCollapse, setHasTriggeredAutoCollapse] = useState(false);
  
  // 🆕 监控非reasoning内容的出现，当有实际内容时收起reasoning（只触发一次）
  useEffect(() => {
    if (nonReasoningSegments.length > 0 && !hasTriggeredAutoCollapse) {
      // 检查是否有实际的内容（不只是空白）
      const hasActualContent = nonReasoningSegments.some(seg => 
        seg.content && seg.content.trim().length > 0
      );
      
      if (hasActualContent) {
        console.log("首次检测到resume内容开始生成，准备自动收起thinking");
        setShouldCollapseReasoning(true);
        setHasTriggeredAutoCollapse(true); // 🆕 标记已触发，避免重复
        
        // 🆕 延迟重置shouldCollapseReasoning，给ReasoningCard足够时间响应
        setTimeout(() => {
          setShouldCollapseReasoning(false);
          console.log("重置shouldCollapseReasoning，允许用户手动展开");
        }, 100);
      }
    }
  }, [nonReasoningSegments, hasTriggeredAutoCollapse]);

  // 添加日志查看后端返回的数据
  useEffect(() => {
    if (effectiveResult) {
      console.log("后端返回的数据:", effectiveResult);
      console.log("内容长度:", effectiveResult.content?.length || 0);
      console.log("解析的段落:", contentSegments);
      console.log("reasoning段落数量:", reasoningSegments.length);
      console.log("非reasoning段落数量:", nonReasoningSegments.length);
      console.log("是否完成:", effectiveResult.isComplete);
      console.log("当前步骤:", effectiveResult.currentStep);
      console.log("时间戳:", effectiveResult.timestamp);
      
      if (enableGlobalStreaming && globalTask) {
        console.log("全局任务状态:", globalTask.status);
        console.log("任务ID:", globalTask.id);
      }
    }
  }, [effectiveResult, enableGlobalStreaming, globalTask, contentSegments, reasoningSegments, nonReasoningSegments]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  // 添加收起/展开状态
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 添加预览文本长度限制
  const previewLength = 50; // 收起时显示的字符数
  // 是否允许自动滚动
  const [autoScroll, setAutoScroll] = useState(true);
  // 最后一次内容更新的时间戳
  const lastUpdateRef = useRef<number>(Date.now());
  // 添加一个状态来跟踪是否已经自动收起过
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);
  // 添加一个状态来跟踪用户是否手动展开过
  const [userManuallyExpanded, setUserManuallyExpanded] = useState(false);
  // 添加一个状态来跟踪用户是否手动滚动过
  const [userManuallyScrolled, setUserManuallyScrolled] = useState(false);

  // 🆕 渲染非reasoning内容段落的函数
  const renderNonReasoningSegment = (segment: ContentSegment, index: number) => {
    const unwrappedContent = unwrapMarkdownCodeBlock(segment.content);
    const contentType = detectContentType(unwrappedContent);

    console.log(`渲染段落 ${index}:`, {
      contentType,
      原始内容长度: segment.content.length,
      解包后长度: unwrappedContent.length,
      原始内容预览: segment.content.substring(0, 200) + "...",
      解包后预览: unwrappedContent.substring(0, 200) + "...",
    });

    if (contentType === "html") {
      return (
        <div
          key={index}
          className="html-content mb-4"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(unwrappedContent),
          }}
        />
      );
    } else {
      const extractedContent = extractMarkdownFromHtml(unwrappedContent);
      // 🆕 强制预处理：确保经历标题不被当作列表项
      const fixedContent = extractedContent
        // 在每个经历标题前添加足够的空行来打断列表结构
        .replace(/(\*\*经历[一二三四五六七八九十]：[^*]+\*\*)/g, '\n\n\n$1')
        // 移除多余的空行
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();

      console.log('内容修复处理:', {
        原始长度: extractedContent.length,
        修复后长度: fixedContent.length,
        经历标题数量: (fixedContent.match(/\*\*经历[一二三四五六七八九十]：/g) || []).length,
        修复前SEA行: extractedContent.split('\n').find(line => line.includes('SEA')) || '未找到',
        修复后SEA行: fixedContent.split('\n').find(line => line.includes('SEA')) || '未找到'
      });
      
      return (
        <div key={index} className="markdown-segment mb-4" style={{ 
          // 🆕 强制重置所有可能影响缩进的样式
          paddingLeft: 0, 
          marginLeft: 0,
          textIndent: 0 
        }}>
          <style jsx>{`
            .markdown-segment p {
              margin-left: 0 !important;
              padding-left: 0 !important;
              text-indent: 0 !important;
            }
            .markdown-segment strong {
              margin-left: 0 !important;
              padding-left: 0 !important;
            }
            .markdown-segment ul {
              margin-bottom: 2rem !important;
            }
          `}</style>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              ...markdownComponents,
              p: ({ children }: { children: React.ReactNode }) => {
                const childText = React.Children.toArray(children).join('');
                
                // 检查是否是经历标题
                const isExperienceTitle = /^经历[一二三四五六七八九十]：/.test(childText);
                
                if (isExperienceTitle) {
                  // 经历标题使用特殊样式，确保不缩进
                  return (
                    <p className="mb-3 mt-6 leading-relaxed text-gray-700 font-medium" style={{ 
                      marginLeft: 0, 
                      paddingLeft: 0,
                      textIndent: 0,
                      clear: 'both' // 清除浮动
                    }}>
                      {children}
                    </p>
                  );
                }
                
                return <p className="mb-4 leading-relaxed text-gray-700">{children}</p>;
              }
            } as any}
          >
            {fixedContent}
          </ReactMarkdown>
        </div>
      );
    }
  };

  // 新增: 每次result.timestamp变化时重置显示内容和状态
  useEffect(() => {
    if (!effectiveResult) return;
    setIsCollapsed(false);
    setHasAutoCollapsed(false); // 重置自动收起状态
    setUserManuallyExpanded(false); // 重置用户手动展开状态
    setUserManuallyScrolled(false); // 重置用户手动滚动状态
    setAutoScroll(true); // 重置自动滚动状态
    setShouldCollapseReasoning(false); // 🆕 重置thinking自动收起状态
    setHasTriggeredAutoCollapse(false); // 🆕 重置自动收起触发状态
    lastUpdateRef.current = Date.now();
  }, [effectiveResult?.timestamp]);

  // 新增: 根据 autoScroll 状态控制自动滚动
  useEffect(() => {
    if (
      autoScroll &&
      contentRef.current &&
      !userManuallyScrolled &&
      effectiveResult?.content
    ) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [effectiveResult?.content, autoScroll, userManuallyScrolled]);

  // 当结果完成时，确保显示全部内容
  useEffect(() => {
    if (effectiveResult?.isComplete && effectiveResult.content) {
      // 内容已完成，可以进行其他操作
      lastUpdateRef.current = Date.now();
    }
  }, [effectiveResult?.isComplete, effectiveResult?.content]);

  // 处理复制内容
  const handleCopy = async () => {
    if (!effectiveResult?.content) return;

    setCopying(true);
    try {
      // 新增：只复制resume类型的内容，忽略reasoning
      let contentToCopy = "";
      if (contentSegments.length > 0) {
        const resumeSegments = contentSegments.filter(seg => seg.content_type !== 'reasoning');
        contentToCopy = resumeSegments.map(seg => seg.content).join('\n\n');
      } else {
        contentToCopy = effectiveResult.content;
      }

      // 🆕 使用新的清理函数去除Markdown格式，获取纯文本
      const cleanContent = cleanMarkdownToPlainText(contentToCopy);

      // 尝试使用现代clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanContent);
      } else {
        // 回退到传统方法
        const textArea = document.createElement("textarea");
        textArea.value = cleanContent;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) throw new Error("document.execCommand复制失败");
      }

      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板（已去除格式）",
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板，请尝试手动复制",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  // 处理下载内容
  const handleDownload = async () => {
    if (!effectiveResult?.content) return;

    try {
      // 获取要下载的内容
      let contentToDownload = "";
      if (contentSegments.length > 0) {
        const resumeSegments = contentSegments.filter(seg => seg.content_type !== 'reasoning');
        contentToDownload = resumeSegments.map(seg => seg.content).join('\n\n');
      } else {
        contentToDownload = effectiveResult.content;
      }

      // 🆕 去除HTML代码，保留Markdown格式
      const processedContent = removeHtmlKeepMarkdown(contentToDownload);
      
      console.log('下载内容处理:', {
        原始内容长度: contentToDownload.length,
        处理后长度: processedContent.length,
        原始预览: contentToDownload.substring(0, 200) + "...",
        处理后预览: processedContent.substring(0, 200) + "..."
      });
      
      // 使用格式化Word生成器处理Markdown
      const { generateWordDocumentWithFormatting } = await import('../../utils/docxGenerator');
      await generateWordDocumentWithFormatting(processedContent, title);

      toast({
        title: "下载成功",
        description: `${title}已下载为Word文档`,
      });
    } catch (error) {
      console.error('下载Word文档失败:', error);
      
      // 如果格式化下载失败，尝试纯文本下载
      try {
        console.log('尝试使用纯文本生成器...');
        const { generateWordDocument } = await import('../../utils/docxGenerator');
        
        let contentToDownload = "";
        if (contentSegments.length > 0) {
          const resumeSegments = contentSegments.filter(seg => seg.content_type !== 'reasoning');
          contentToDownload = resumeSegments.map(seg => seg.content).join('\n\n');
        } else {
          contentToDownload = effectiveResult.content;
        }
        
        const cleanContent = cleanMarkdownToPlainText(contentToDownload);
        await generateWordDocument(cleanContent, title);

        toast({
          title: "下载成功（纯文本）",
          description: `${title}已下载为Word文档`,
        });
      } catch (fallbackError) {
        console.error('纯文本docx生成也失败:', fallbackError);
        toast({
          title: "下载失败",
          description: "文档下载失败，请稍后重试",
          variant: "destructive",
        });
      }
    }
  };

  // 处理收起/展开功能
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);

    // 如果用户手动展开，记录这个状态
    if (isCollapsed) {
      setUserManuallyExpanded(true);
    }

    // 如果是展开状态，滚动到顶部
    if (isCollapsed && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);
    }
  };

  // 全局流式生成控制函数
  const handlePauseGlobalStream = () => {
    if (taskId) {
      pauseGlobalStream(taskId);
      toast({
        title: "已暂停",
        description: "生成已暂停，您可以在其他页面恢复",
      });
    }
  };

  const handleResumeGlobalStream = () => {
    if (taskId) {
      resumeGlobalStream(taskId);
      toast({
        title: "正在恢复",
        description: "正在恢复生成，请稍候",
      });
    }
  };

  const handleStopGlobalStream = () => {
    if (taskId) {
      stopGlobalStream(taskId);
      toast({
        title: "已停止",
        description: "生成已停止并清理",
      });
    }
  };

  // 用户手动滚动检测
  useEffect(() => {
    function globalWheelHandler(e: WheelEvent) {
      if (autoScroll) {
        setAutoScroll(false);
        setUserManuallyScrolled(true);
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
  }, [autoScroll]);

  // 单独检测内容区域的滚动
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    function containerScrollHandler() {
      if (!container) return; // 再次检查确保容器存在

      // 检查是否滚动到底部
      const isAtBottom =
        Math.abs(
          container.scrollHeight - container.scrollTop - container.clientHeight
        ) < 70;

      if (isAtBottom && !autoScroll) {
        // 如果滚动到底部，启用自动滚动
        setAutoScroll(true);
        setUserManuallyScrolled(false);
        console.log("滚动到底部，启用自动滚动");
      } else if (!isAtBottom && autoScroll) {
        // 如果没有滚动到底部，禁用自动滚动
        setAutoScroll(false);
        setUserManuallyScrolled(true);
        console.log("滚动未到底部，禁用自动滚动");
      }
    }

    container.addEventListener("scroll", containerScrollHandler);

    return () => {
      container.removeEventListener("scroll", containerScrollHandler);
    };
  }, [autoScroll]);

  // 判断是否正在生成中（流式输出开始前）
  const isGenerating = !effectiveResult || (effectiveResult && !effectiveResult.content);
  
  // 判断是否正在流式生成中
  const isStreaming = enableGlobalStreaming && globalTask?.status === 'streaming';
  const isPaused = enableGlobalStreaming && globalTask?.status === 'paused';

  // 处理自动滚动按钮点击
  const handleAutoScrollClick = () => {
    const newAutoScroll = !autoScroll;
    setAutoScroll(newAutoScroll);

    if (newAutoScroll) {
      // 如果用户启用自动滚动，重置手动滚动状态
      setUserManuallyScrolled(false);
      console.log("用户手动启用了自动滚动");
    } else {
      console.log("用户手动关闭了自动滚动");
    }

    toast({
      title: newAutoScroll ? "已启用自动滚动" : "已禁用自动滚动",
      description: newAutoScroll
        ? "内容将自动滚动到底部"
        : "内容将保持当前位置",
    });
  };

  if (isGenerating) {
    return (
      <Card className="shadow-lg flex flex-col bg-white relative w-full mx-auto mb-6 h-full mt-[30px]">
        <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-5 flex-shrink-0">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              title === "个人陈述初稿" ? "bg-green-50" : "bg-blue-50"
            }`}
          >
            {title === "个人陈述初稿" ? (
              <ScrollText className="h-5 w-5 text-green-500" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
        </CardHeader>

        {/* 生成中状态显示 */}
        <div
          className="flex items-center justify-center flex-grow h-full text-muted-foreground"
          style={{ minHeight: "400px" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2
                className={`h-12 w-12 animate-spin ${
                  title === "个人陈述初稿" ? "text-green-500" : "text-blue-500"
                }`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`h-8 w-8 rounded-full animate-ping ${
                    title === "个人陈述初稿" ? "bg-green-50" : "bg-blue-50"
                  }`}
                ></div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="text-lg font-medium text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {Array.from("正在生成中...").map((char, index) => (
                  <motion.span
                    key={index}
                    className="inline-block"
                    animate={{
                      y: [0, -5, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: index * 0.1,
                      repeatType: "reverse",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
              
              
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 计算要显示的内容（根据收起状态）
  const displayContent = effectiveResult?.content || "";
  const contentToRender =
    isCollapsed && displayContent.length > previewLength
      ? displayContent.substring(0, previewLength) + "..."
      : displayContent;

  // 是否应该显示收起/展开按钮（只有在内容足够长时）
  const shouldShowToggle =
    effectiveResult?.isComplete && displayContent.length > previewLength;

  return (
    <Card className="shadow-lg flex flex-col bg-white relative w-full mx-auto mb-6 h-full mt-[30px]">
      <CardHeader className="flex flex-row items-center gap-2 pb-2 pt-4 px-5 flex-shrink-0">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            title === "个人陈述初稿" ? "bg-green-50" : "bg-blue-50"
          }`}
        >
          {title === "个人陈述初稿" ? (
            <ScrollText className="h-5 w-5 text-green-500" />
          ) : (
            <FileText className="h-5 w-5 text-blue-500" />
          )}
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {/* 显示全局任务状态 */}
          {enableGlobalStreaming && globalTask && (
            <div className="text-xs text-gray-500 mt-1">
              {isStreaming && "正在后台生成中..."}
              {isPaused && "已暂停，可在任意页面恢复"}
              {globalTask.status === 'completed' && "生成完成"}
              {globalTask.status === 'error' && "生成出错"}
            </div>
          )}
        </div>

        {/* 功能按钮区域 */}
        <div className="flex items-center gap-2">
          {headerActions}
          
          {/* 全局流式生成控制按钮 */}
          {enableGlobalStreaming && taskId && (
            <>
              {isStreaming && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full"
                  onClick={handlePauseGlobalStream}
                  title="暂停生成"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              
              {isPaused && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full"
                  onClick={handleResumeGlobalStream}
                  title="恢复生成"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              
              {(isStreaming || isPaused) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-full text-red-600 hover:text-red-700"
                  onClick={handleStopGlobalStream}
                  title="停止生成"
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          
          {/* 复制和下载按钮 - 仅在生成完成后显示 */}
          {effectiveResult && effectiveResult.isComplete && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
                onClick={handleCopy}
                disabled={copying}
                title="复制内容"
              >
                {copying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
                onClick={handleDownload}
                title="下载Word文档"
              >
                <Download className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* 收起/展开按钮 - 只在完成生成且内容足够长时显示 */}
          {shouldShowToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full"
              onClick={toggleCollapse}
              title={isCollapsed ? "展开全文" : "收起内容"}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      {/* 使用双层容器解决滚动条与圆角冲突问题 */}
      <div className="relative flex-grow rounded-b-lg overflow-hidden h-full">
        {/* 内容区域 - 处理滚动但不处理圆角 */}
        <CardContent
          ref={contentRef}
          className="px-5 py-4 h-full overflow-auto custom-scrollbar flex-grow"
          style={{ height: "calc(90vh - 100px)", minHeight: "400px" }}
        >
          <style jsx global>
            {scrollbarStyles}
          </style>
          
          {/* 🆕 新的内容渲染区域 */}
          <div className="content-segments">
            {/* 先显示reasoning卡片（如果有的话） */}
            <ReasoningCard 
              reasoningSegments={reasoningSegments}
              isComplete={effectiveResult?.isComplete || false}
              shouldAutoCollapse={shouldCollapseReasoning}
            />
            
            {/* 然后显示非reasoning内容 */}
            {nonReasoningSegments.length > 0 ? (
              nonReasoningSegments.map((segment, index) => renderNonReasoningSegment(segment, index))
            ) : contentSegments.length === 0 ? (
              // 回退到原始渲染方式（当没有解析到任何段落时）
              <div className="markdown-content">
                {(() => {
                  // 先解包可能被代码块包裹的 markdown 内容
                  const unwrappedContent = unwrapMarkdownCodeBlock(contentToRender);
                  const contentType = detectContentType(unwrappedContent);

                  if (contentType === "html") {
                    // 渲染HTML内容
                    return (
                      <div
                        className="html-content"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(unwrappedContent),
                        }}
                      />
                    );
                  } else {
                    // 渲染Markdown内容
                    const extractedContent = extractMarkdownFromHtml(unwrappedContent);
                    // 🆕 直接使用原始内容，不进行换行处理
                    return (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={markdownComponents as any}
                      >
                        {extractedContent}
                      </ReactMarkdown>
                    );
                  }
                })()}
              </div>
            ) : null}
          </div>

          {/* 收起/展开指示器 - 在内容中间显示 */}
          {shouldShowToggle && isCollapsed && (
            <div
              className="flex items-center justify-center gap-1 mt-4 text-sm text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
              onClick={toggleCollapse}
            >
              <ChevronDown className="h-4 w-4" />
              <span>点击展开全文</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          )}

          {/* 生成中指示器 - 只在不完整且有内容时显示 */}
          {!effectiveResult?.isComplete && effectiveResult?.content && !isGenerating && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <div className="flex gap-1">
                <span
                  className="inline-block h-2 w-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="inline-block h-2 w-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                ></span>
                <span
                  className="inline-block h-2 w-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "600ms" }}
                ></span>
              </div>
              {enableGlobalStreaming && (
                <span className="text-xs">支持后台生成</span>
              )}
            </div>
          )}

          {/* 收起/展开按钮区域 */}
          {effectiveResult?.isComplete && shouldShowToggle && !isCollapsed && (
            <div className="flex justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800 gap-1 hover:bg-blue-50"
                onClick={toggleCollapse}
              >
                <ChevronUp className="h-4 w-4" />
                <span>收起内容</span>
              </Button>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

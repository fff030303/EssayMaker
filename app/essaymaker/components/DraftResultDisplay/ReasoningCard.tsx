/**
 * ReasoningCard 组件
 *
 * 功能：专门用于显示AI思考过程的卡片组件
 *
 * 核心特性：
 * 1. 聚合显示：
 *    - 将所有reasoning类型内容聚合到一张卡片
 *    - 按时间顺序显示思考过程
 *    - 支持多段reasoning内容的连续显示
 *
 * 2. 交互功能：
 *    - 可折叠/展开功能
 *    - 自动收起机制（生成完成后3秒）
 *    - 用户手动控制优先级
 *
 * 3. 视觉设计：
 *    - 淡绿色主题配色，突出AI思考过程
 *    - 清晰的视觉层次
 *    - 优雅的动画效果
 *
 * 4. 内容处理：
 *    - 支持Markdown和HTML格式
 *    - 自动格式化和美化
 *    - 内容去重和优化
 *
 * 5. 状态管理：
 *    - 智能收起状态控制
 *    - 用户操作记忆
 *    - 生成状态感知
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ChevronDown, ChevronUp, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  detectContentType,
  extractMarkdownFromHtml,
  processMarkdownLineBreaks,
  sanitizeHtml,
  unwrapMarkdownCodeBlock,
} from "./utils";
import { markdownComponents } from "./MarkdownComponents";

interface ContentSegment {
  content_type: "reasoning" | "resume" | "default";
  content: string;
  isComplete?: boolean;
}

interface ReasoningCardProps {
  /** 所有reasoning类型的内容段落 */
  reasoningSegments: ContentSegment[];
  /** 是否生成已完成 */
  isComplete?: boolean;
  /** 自定义标题 */
  title?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 是否应该自动收起（外部触发） */
  shouldAutoCollapse?: boolean;
}

export function ReasoningCard({
  reasoningSegments,
  isComplete = false,
  title = "AI思考过程",
  icon,
  shouldAutoCollapse = false,
}: ReasoningCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const [hasRespondedToAutoCollapse, setHasRespondedToAutoCollapse] =
    useState(false);
  const [userHasManuallyInteracted, setUserHasManuallyInteracted] =
    useState(false);

  // 🆕 所有hooks必须在条件性return之前调用
  useEffect(() => {
    console.log("ReasoningCard 渲染:", {
      segmentsCount: reasoningSegments?.length || 0,
      isComplete,
      title,
      isCollapsed,
      autoCollapsed,
      shouldAutoCollapse,
      hasRespondedToAutoCollapse,
      userHasManuallyInteracted,
      segments: reasoningSegments?.map((s) => ({
        type: s.content_type,
        length: s.content?.length || 0,
        preview: s.content?.substring(0, 50) + "...",
      })),
    });
  }, [
    reasoningSegments,
    isComplete,
    title,
    isCollapsed,
    autoCollapsed,
    shouldAutoCollapse,
    hasRespondedToAutoCollapse,
    userHasManuallyInteracted,
  ]);

  // 自动收起机制：生成完成后3秒自动收起
  useEffect(() => {
    if (
      isComplete &&
      !autoCollapsed &&
      !isCollapsed &&
      !userHasManuallyInteracted
    ) {
      // 🆕 只在用户没有手动操作的情况下才自动收起
      const timer = setTimeout(() => {
        console.log("ReasoningCard: 3秒后自动收起");
        setIsCollapsed(true);
        setAutoCollapsed(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isComplete, autoCollapsed, userHasManuallyInteracted]);

  // 🆕 响应外部收起信号：当resume开始生成时立即收起（只响应一次）
  useEffect(() => {
    if (shouldAutoCollapse && !hasRespondedToAutoCollapse) {
      console.log("ReasoningCard: 首次响应外部信号，立即收起thinking");
      setIsCollapsed(true);
      setHasRespondedToAutoCollapse(true);
      console.log("ReasoningCard: 已标记为响应过外部信号，不再重复收起");
    }
  }, [shouldAutoCollapse, hasRespondedToAutoCollapse]);

  // 🆕 重置响应状态：当shouldAutoCollapse变为false时重置状态
  useEffect(() => {
    if (!shouldAutoCollapse) {
      setHasRespondedToAutoCollapse(false);
    }
  }, [shouldAutoCollapse]);

  // 🆕 现在在所有hooks之后进行条件性return
  if (!reasoningSegments || reasoningSegments.length === 0) {
    console.log("ReasoningCard: 没有reasoning内容，不渲染");
    return null;
  }

  // 聚合所有reasoning内容
  const aggregatedContent = reasoningSegments
    .map((segment) => {
      // 🆕 处理转义字符：将JSON中的\n转换为实际换行符
      let content = segment.content;
      if (content) {
        content = content
          .replace(/\\n/g, "\n") // 将\n转换为实际换行符
          .replace(/\\t/g, "\t") // 将\t转换为实际制表符
          .replace(/\\r/g, "\r") // 将\r转换为实际回车符
          .replace(/\\\\/g, "\\") // 将\\转换为实际反斜杠
          .replace(/\\"/g, '"') // 将\"转换为实际双引号
          .trim(); // 去除首尾空白
      }
      return content;
    })
    .filter((content) => content && content.length > 0) // 过滤空内容
    .join("\n\n---\n\n"); // 用分隔线分开不同的思考段落

  console.log("ReasoningCard: 聚合内容长度:", aggregatedContent.length);

  // 🆕 添加转义字符处理的调试日志
  console.log("ReasoningCard: 转义字符处理:", {
    原始内容示例: reasoningSegments[0]?.content?.substring(0, 100) + "...",
    处理后内容示例: aggregatedContent.substring(0, 100) + "...",
    包含转义字符: reasoningSegments.some((s) => s.content?.includes("\\n")),
    处理后是否还有转义字符: aggregatedContent.includes("\\n"),
  });

  // 处理点击事件
  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);

    // 🆕 标记用户已手动操作，防止后续自动收起
    setUserHasManuallyInteracted(true);

    // 🆕 如果用户手动展开，重置所有自动状态，确保用户完全控制
    if (!newCollapsedState) {
      console.log(
        "ReasoningCard: 用户手动展开，重置所有自动状态，禁用后续自动收起"
      );
      setAutoCollapsed(false);
    } else {
      console.log("ReasoningCard: 用户手动收起");
    }

    console.log(
      "ReasoningCard: 用户手动",
      newCollapsedState ? "收起" : "展开",
      "- 已禁用自动收起"
    );
  };

  // 渲染reasoning内容
  const renderReasoningContent = (content: string) => {
    // 🆕 再次确保转义字符已被正确处理
    const processedContent = content
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\\\/g, "\\")
      .replace(/\\"/g, '"');

    const unwrappedContent = unwrapMarkdownCodeBlock(processedContent);

    // 🆕 增强HTML检测逻辑
    const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(unwrappedContent);
    const hasStrongTags = /<strong>|<\/strong>|<b>|<\/b>/i.test(
      unwrappedContent
    );
    const hasEmTags = /<em>|<\/em>|<i>|<\/i>/i.test(unwrappedContent);
    const hasHtmlEntities = /&[a-zA-Z0-9#]+;/.test(unwrappedContent);
    const hasStyleAttr = /style\s*=/.test(unwrappedContent);

    // 🆕 强制HTML检测：如果包含任何HTML标签，优先按HTML处理
    const forceHtmlRendering =
      hasHtmlTags ||
      hasStrongTags ||
      hasEmTags ||
      hasHtmlEntities ||
      hasStyleAttr;

    console.log("ReasoningCard 内容渲染分析:", {
      原始内容长度: content.length,
      处理后内容长度: processedContent.length,
      解包后内容长度: unwrappedContent.length,
      内容预览: unwrappedContent.substring(0, 200) + "...",
      检测到HTML标签: hasHtmlTags,
      检测到Strong标签: hasStrongTags,
      检测到Em标签: hasEmTags,
      检测到HTML实体: hasHtmlEntities,
      检测到样式属性: hasStyleAttr,
      强制HTML渲染: forceHtmlRendering,
      原始detectContentType结果: detectContentType(unwrappedContent),
    });

    // 🆕 优先尝试HTML渲染
    if (forceHtmlRendering) {
      console.log("ReasoningCard: 使用HTML渲染模式");
      const sanitizedHtml = sanitizeHtml(unwrappedContent);
      console.log("ReasoningCard: HTML清理结果:", {
        原始长度: unwrappedContent.length,
        清理后长度: sanitizedHtml.length,
        清理后预览: sanitizedHtml.substring(0, 200) + "...",
      });

      return (
        <div
          className="reasoning-content text-sm"
          dangerouslySetInnerHTML={{
            __html: sanitizedHtml,
          }}
        />
      );
    } else {
      console.log("ReasoningCard: 使用Markdown渲染模式");
      const extractedContent = extractMarkdownFromHtml(unwrappedContent);
      const markdownContent = processMarkdownLineBreaks(extractedContent);

      console.log("ReasoningCard: Markdown处理结果:", {
        提取后内容: extractedContent.substring(0, 200) + "...",
        最终Markdown: markdownContent.substring(0, 200) + "...",
      });

      return (
        <div className="reasoning-markdown text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={
              {
                ...markdownComponents,
                // 优化样式以适应reasoning卡片
                h1: ({ children }: { children: React.ReactNode }) => (
                  <h1 className="text-base font-semibold mb-2 text-gray-800">
                    {children}
                  </h1>
                ),
                h2: ({ children }: { children: React.ReactNode }) => (
                  <h2 className="text-sm font-semibold mb-1 text-gray-800">
                    {children}
                  </h2>
                ),
                h3: ({ children }: { children: React.ReactNode }) => (
                  <h3 className="text-sm font-medium mb-1 text-gray-700">
                    {children}
                  </h3>
                ),
                p: ({ children }: { children: React.ReactNode }) => (
                  <p className="text-xs mb-2 text-gray-700 leading-relaxed">
                    {children}
                  </p>
                ),
                strong: ({ children }: { children: React.ReactNode }) => (
                  <strong className="font-semibold text-gray-800">
                    {children}
                  </strong>
                ),
                hr: () => <hr className="my-3 border-gray-200" />,
              } as any
            }
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 transition-all duration-300 ${
        isCollapsed ? "opacity-75" : ""
      }`}
    >
      <Card className="bg-gray-50 border-gray-100 shadow-sm">
        <CardHeader
          className="pb-2 pt-3 px-4 cursor-pointer flex flex-row items-center gap-2"
          onClick={handleToggle}
        >
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            {icon || <Brain className="h-3 w-3 text-gray-600" />}
          </div>
          <CardTitle className="text-sm font-medium text-gray-800 flex-1">
            {title}
            {reasoningSegments.length > 1 && (
              <span className="ml-2 text-xs text-gray-600 font-normal">
                ({reasoningSegments.length}个思考段落)
              </span>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="w-6 h-6 p-0 rounded-full text-gray-600 hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="px-4 pb-3 pt-1">
            <div className="text-sm text-gray-300 bg-white/50 rounded p-3 border border-gray-100 max-h-96 overflow-y-auto">
              {renderReasoningContent(aggregatedContent)}
            </div>

            {/* 显示段落统计信息 */}
            {reasoningSegments.length > 1 && (
              <div className="mt-2 text-xs text-gray-400 text-center">
                共包含 {reasoningSegments.length} 个思考段落
                {isComplete && " • 思考完成"}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

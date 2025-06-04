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
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
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
  content_type: 'reasoning' | 'resume' | 'default';
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
}

export function ReasoningCard({ 
  reasoningSegments, 
  isComplete = false,
  title = "AI思考过程",
  icon
}: ReasoningCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoCollapsed, setAutoCollapsed] = useState(false);

  // 如果没有reasoning内容，不渲染组件
  if (!reasoningSegments || reasoningSegments.length === 0) {
    return null;
  }

  // 自动收起机制：生成完成后3秒自动收起
  useEffect(() => {
    if (isComplete && !autoCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        setAutoCollapsed(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isComplete, autoCollapsed]);

  // 聚合所有reasoning内容
  const aggregatedContent = reasoningSegments
    .map(segment => segment.content)
    .join('\n\n---\n\n'); // 用分隔线分开不同的思考段落

  // 处理点击事件
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 渲染reasoning内容
  const renderReasoningContent = (content: string) => {
    const unwrappedContent = unwrapMarkdownCodeBlock(content);
    const contentType = detectContentType(unwrappedContent);

    if (contentType === "html") {
      return (
        <div
          className="reasoning-content text-sm"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(unwrappedContent),
          }}
        />
      );
    } else {
      const extractedContent = extractMarkdownFromHtml(unwrappedContent);
      const markdownContent = processMarkdownLineBreaks(extractedContent);
      return (
        <div className="reasoning-markdown text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ...markdownComponents,
              // 优化样式以适应reasoning卡片
              h1: ({ children }: { children: React.ReactNode }) => (
                <h1 className="text-base font-semibold mb-2 text-gray-800">{children}</h1>
              ),
              h2: ({ children }: { children: React.ReactNode }) => (
                <h2 className="text-sm font-semibold mb-1 text-gray-800">{children}</h2>
              ),
              h3: ({ children }: { children: React.ReactNode }) => (
                <h3 className="text-sm font-medium mb-1 text-gray-700">{children}</h3>
              ),
              p: ({ children }: { children: React.ReactNode }) => (
                <p className="text-xs mb-2 text-gray-700 leading-relaxed">{children}</p>
              ),
              strong: ({ children }: { children: React.ReactNode }) => (
                <strong className="font-semibold text-gray-800">{children}</strong>
              ),
              hr: () => (
                <hr className="my-3 border-gray-200" />
              ),
            } as any}
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
      className={`mb-4 transition-all duration-300 ${isCollapsed ? 'opacity-75' : ''}`}
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
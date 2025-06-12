/**
 * 内容渲染组件
 * 负责渲染非reasoning内容段落
 */

"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { markdownComponents } from "./MarkdownComponents";
import { ReasoningCard } from "./ReasoningCard";
import {
  detectContentType,
  extractMarkdownFromHtml,
  sanitizeHtml,
  unwrapMarkdownCodeBlock,
} from "./utils";
import type { ContentSegment } from "./contentUtils";

interface ContentRendererProps {
  contentSegments: ContentSegment[];
  nonReasoningSegments: ContentSegment[];
  reasoningSegments: ContentSegment[];
  contentToRender: string;
  isComplete: boolean;
  shouldCollapseReasoning: boolean;
}

export function ContentRenderer({
  contentSegments,
  nonReasoningSegments,
  reasoningSegments,
  contentToRender,
  isComplete,
  shouldCollapseReasoning,
}: ContentRendererProps) {
  // 渲染非reasoning内容段落的函数
  const renderNonReasoningSegment = (
    segment: ContentSegment,
    index: number
  ) => {
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
      // 强制预处理：确保经历标题不被当作列表项
      const fixedContent = extractedContent
        // 在每个经历标题前添加足够的空行来打断列表结构
        .replace(/(\*\*经历[一二三四五六七八九十]：[^*]+\*\*)/g, "\n\n\n$1")
        // 移除多余的空行
        .replace(/\n{4,}/g, "\n\n\n")
        .trim();

      console.log("内容修复处理:", {
        原始长度: extractedContent.length,
        修复后长度: fixedContent.length,
        经历标题数量: (
          fixedContent.match(/\*\*经历[一二三四五六七八九十]：/g) || []
        ).length,
        修复前SEA行:
          extractedContent.split("\n").find((line) => line.includes("SEA")) ||
          "未找到",
        修复后SEA行:
          fixedContent.split("\n").find((line) => line.includes("SEA")) ||
          "未找到",
      });

      return (
        <div
          key={index}
          className="markdown-segment mb-4"
          style={{
            // 强制重置所有可能影响缩进的样式
            paddingLeft: 0,
            marginLeft: 0,
            textIndent: 0,
          }}
        >
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
            components={
              {
                ...markdownComponents,
                p: ({ children }: { children: React.ReactNode }) => {
                  const childText = React.Children.toArray(children).join("");

                  // 检查是否是经历标题
                  const isExperienceTitle =
                    /^经历[一二三四五六七八九十]：/.test(childText);

                  if (isExperienceTitle) {
                    // 经历标题使用特殊样式，确保不缩进
                    return (
                      <p
                        className="mb-3 mt-6 leading-relaxed text-gray-700 font-medium"
                        style={{
                          marginLeft: 0,
                          paddingLeft: 0,
                          textIndent: 0,
                          clear: "both", // 清除浮动
                        }}
                      >
                        {children}
                      </p>
                    );
                  }

                  return (
                    <p className="mb-4 leading-relaxed text-gray-700">
                      {children}
                    </p>
                  );
                },
              } as any
            }
          >
            {fixedContent}
          </ReactMarkdown>
        </div>
      );
    }
  };

  return (
    <div className="content-segments">
      {/* 先显示reasoning卡片（如果有的话） */}
      <ReasoningCard
        reasoningSegments={reasoningSegments}
        isComplete={isComplete}
        shouldAutoCollapse={shouldCollapseReasoning}
      />

      {/* 然后显示非reasoning内容 */}
      {nonReasoningSegments.length > 0 ? (
        nonReasoningSegments.map((segment, index) =>
          renderNonReasoningSegment(segment, index)
        )
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
              const extractedContent =
                extractMarkdownFromHtml(unwrappedContent);
              // 直接使用原始内容，不进行换行处理
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

      {/* 生成中指示器 - 只在不完整且有内容时显示 */}
      {!isComplete && contentToRender && (
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
          <span className="text-xs">正在生成中...</span>
        </div>
      )}

      {/* 底部展开/收起指示器 - 当内容完成时显示 */}
      {isComplete && contentToRender && (
        <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <span>内容已完成</span>
          </div>
        </div>
      )}
    </div>
  );
}

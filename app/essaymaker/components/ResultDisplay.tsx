// 结果展示组件，负责：

// - 以卡片形式展示查询结果
// - 使用ReactMarkdown渲染Markdown格式内容
// - 显示当前处理步骤（如果有）
// - 处理内容中可能存在的重复标题和时间戳
// - 自定义各种Markdown元素的样式

"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DisplayResult } from "../types";
import { useMemo } from "react";

// 修改 ResultDisplayProps 接口，添加 title 属性
interface ResultDisplayProps {
  result: DisplayResult | null;
  title?: string; // 添加可选的标题属性
}

export function ResultDisplay({ result, title = "分析结果" }: ResultDisplayProps) {
  if (!result) return null;

  // 处理可能包含在内容中的重复标题
  const processedContent = useMemo(() => {
    if (!result.content) return "";

    // 检查是否是从步骤点击显示的内容
    // @ts-ignore - 我们添加了自定义属性_isStepContent，但没有更新类型定义
    if (result._isStepContent) {
      // 如果是步骤内容，直接返回内容，不需要额外处理
      return result.content;
    }

    // 常规流式内容处理 - 尝试移除可能存在的重复内容
    // 尝试移除内容开头可能存在的"查询结果"标题行和时间戳行
    return result.content
      .replace(/^#*\s*查询结果\s*$/m, "") // 移除可能的标题行
      .replace(
        /^\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}\s*$/m,
        ""
      ) // 移除可能的时间戳行
      .replace(
        /^#*\s*查询结果\s*\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}\s*$/m,
        ""
      ) // 移除组合的标题和时间戳行
      .replace(/^\s+/, ""); // 移除开头的空白
  }, [result.content, result._isStepContent]);

  // 使用Shadcn UI原生Card组件
  return (
    <Card className="shadow-lg h-[calc(100%-3px)] flex flex-col">
      <CardHeader className="flex flex-row items-center gap-3 pb-4 pt-5 px-5 flex-shrink-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <p className="text-sm text-gray-500">
            {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>
      </CardHeader>

      {/* 加载状态显示 */}
      {result.currentStep && (
        <div className="flex items-center gap-2 px-6 py-3 text-sm text-gray-500 bg-gray-50 border-t border-b border-gray-100 flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{result.currentStep}</span>
        </div>
      )}

      <CardContent className="pt-6 px-6 pb-6 overflow-y-auto flex-grow">
        <div className="prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4 leading-relaxed" {...props} />
              ),
              h1: ({ node, ...props }) => (
                <h1
                  className="text-xl font-bold mt-6 mb-4 text-gray-900"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-lg font-bold mt-5 mb-3 text-gray-900"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-base font-bold mt-4 mb-2 text-gray-900"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="my-3 pl-6 list-disc" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="my-3 pl-6 list-decimal" {...props} />
              ),
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-gray-200 pl-4 italic my-4 text-gray-600"
                  {...props}
                />
              ),
              code: ({ node, className, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || "");
                const isInline =
                  !match && !className?.includes("contains-task-list");
                return isInline ? (
                  <code
                    className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                    {...props}
                  />
                ) : (
                  <code
                    className="block bg-gray-100 p-3 rounded-md text-sm font-mono overflow-x-auto my-4 text-gray-800"
                    {...props}
                  />
                );
              },
            }}
          >
            {processedContent || "正在生成内容..."}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

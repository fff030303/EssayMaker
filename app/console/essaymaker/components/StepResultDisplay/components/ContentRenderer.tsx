/**
 * 内容渲染组件模块
 *
 * 功能：智能渲染HTML和Markdown内容
 *
 * 特性：
 * - 智能内容类型检测
 * - HTML安全渲染
 * - Markdown组件化渲染
 * - 自定义样式应用
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  detectContentType,
  extractMarkdownFromHtml,
  processMarkdownLineBreaks,
  sanitizeHtml,
} from "../utils/contentProcessing";
import { globalContentStyles } from "../styles/contentStyles";

interface ContentRendererProps {
  content: string;
}

export function ContentRenderer({ content }: ContentRendererProps) {
  const contentType = detectContentType(content);

  return (
    <>
      <style jsx global>
        {globalContentStyles}
      </style>
      <div className="markdown-content">
        {(() => {
          if (contentType === "html") {
            // 渲染HTML内容
            return (
              <div
                className="html-content"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(content),
                }}
              />
            );
          } else {
            // 渲染Markdown内容
            const extractedContent = extractMarkdownFromHtml(content);
            const markdownContent = processMarkdownLineBreaks(extractedContent);
            console.log("ResultDisplay渲染Markdown:", {
              original: content.substring(0, 100) + "...",
              extracted: extractedContent.substring(0, 100) + "...",
              processed: markdownContent.substring(0, 100) + "...",
            });
            return (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="mb-4 leading-relaxed text-gray-700"
                      {...props}
                    />
                  ),
                  br: () => <br className="my-1" />,
                  h1: ({ node, ...props }) => (
                    <h1
                      className="text-xl font-bold mt-6 mb-4 text-gray-900 border-b border-gray-200 pb-2"
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
                  h4: ({ node, ...props }) => (
                    <h4
                      className="text-sm font-bold mt-3 mb-2 text-gray-900"
                      {...props}
                    />
                  ),
                  h5: ({ node, ...props }) => (
                    <h5
                      className="text-sm font-bold mt-3 mb-2 text-gray-900"
                      {...props}
                    />
                  ),
                  h6: ({ node, ...props }) => (
                    <h6
                      className="text-sm font-bold mt-3 mb-2 text-gray-700"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="mb-4 pl-6 list-disc space-y-1" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="mb-4 pl-6 list-decimal space-y-1"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-gray-700" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-primary/30 pl-4 italic mb-4 bg-muted/30 py-2 text-muted-foreground"
                      {...props}
                    />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table
                        className="min-w-full border-collapse border border-gray-300"
                        {...props}
                      />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-gray-100" {...props} />
                  ),
                  tbody: ({ node, ...props }) => <tbody {...props} />,
                  tr: ({ node, ...props }) => (
                    <tr className="border-b border-gray-200" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th
                      className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900"
                      {...props}
                    />
                  ),
                  td: ({ node, ...props }) => (
                    <td
                      className="border border-gray-300 px-4 py-2 text-gray-700"
                      {...props}
                    />
                  ),
                  code: ({ node, className, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline =
                      !match && !className?.includes("contains-task-list");
                    return isInline ? (
                      <code
                        className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      />
                    ) : (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                        <code className={`${className} text-sm`} {...props} />
                      </pre>
                    );
                  },
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-gray-900" {...props} />
                  ),
                  em: ({ node, ...props }) => (
                    <em className="italic text-gray-700" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-t border-gray-300 my-6" {...props} />
                  ),
                  img: ({ node, src, alt, ...props }) => (
                    <img
                      src={src}
                      alt={alt}
                      className="max-w-full h-auto rounded-lg shadow-sm my-4"
                      {...props}
                    />
                  ),
                }}
              >
                {markdownContent || "正在生成内容..."}
              </ReactMarkdown>
            );
          }
        })()}
      </div>
    </>
  );
}

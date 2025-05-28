/**
 * ResultDisplay 组件
 * 
 * 功能：智能展示查询结果，支持多种内容格式的渲染
 * 
 * 核心特性：
 * 1. 智能内容检测：
 *    - 自动识别HTML和Markdown格式
 *    - 检测复杂HTML结构（样式、嵌套等）
 *    - 处理简单包装的Markdown内容
 * 
 * 2. 内容渲染：
 *    - HTML：使用DOMPurify安全化处理
 *    - Markdown：使用ReactMarkdown + remarkGfm
 *    - 混合格式：智能提取和转换
 * 
 * 3. 样式处理：
 *    - 自定义Markdown元素样式
 *    - 响应式设计适配
 *    - 统一的视觉风格
 * 
 * 4. 内容优化：
 *    - 清理重复标题和时间戳
 *    - 处理换行和段落格式
 *    - 优化列表和分隔线显示
 * 
 * 5. 安全性：
 *    - HTML内容安全化
 *    - 允许的标签和属性白名单
 *    - XSS攻击防护
 * 
 * 支持的内容类型：
 * - 纯Markdown文本
 * - HTML格式内容
 * - 混合格式（HTML包装的Markdown）
 * - 带样式的复杂HTML
 * 
 * 渲染特性：
 * - 标题层级处理（H1-H6）
 * - 粗体、斜体、代码高亮
 * - 列表、表格、引用块
 * - 链接、图片、分隔线
 * - 自定义样式注入
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DisplayResult } from "../types";
import { useMemo } from "react";
import DOMPurify from "dompurify";

// 检测内容类型的函数
const detectContentType = (content: string): 'html' | 'markdown' => {
  // 检测HTML标签
  const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;
  const hasHtmlTags = htmlTagRegex.test(content);
  
  // 检测常见的HTML实体
  const htmlEntityRegex = /&[a-zA-Z0-9#]+;/;
  const hasHtmlEntities = htmlEntityRegex.test(content);
  
  // 检测HTML文档结构
  const hasHtmlStructure = content.includes('<!DOCTYPE') || 
                          content.includes('<html') || 
                          content.includes('<head') || 
                          content.includes('<body');
  
  // 检测复杂的HTML结构（包含样式、嵌套等）- 这些必须按HTML处理
  const hasComplexHtml = hasHtmlTags && (
    content.includes('style=') ||        // 内联样式
    content.includes('class=') ||        // CSS类
    content.includes('display:') ||      // CSS样式
    content.includes('justify-content:') || // Flexbox
    content.includes('text-align:') ||   // 文本对齐
    content.includes('flex') ||          // Flex布局
    /<div[^>]*>[\s\S]*<div[^>]*>/.test(content) // 嵌套div
  );
  
  // 检测Markdown标题 - 但只在没有复杂HTML时才优先考虑
  const hasMarkdownTitles = /^#{1,6}\s/.test(content) || /\n#{1,6}\s/.test(content);
  
  // 检测其他Markdown语法
  const hasMarkdownSyntax = content.includes('**') ||    // 粗体
                           content.includes('- ') ||     // 无序列表
                           content.includes('1. ') ||    // 有序列表
                           content.includes('---') ||    // 分隔线
                           content.includes('`');        // 代码
  
  // 检测是否是简单包装的Markdown（只有简单的div/p包装，没有样式）
  const isSimpleWrappedMarkdown = hasHtmlTags && !hasComplexHtml && hasMarkdownTitles;
  
  // 添加调试日志
  console.log('ResultDisplay内容检测:', {
    content: content.substring(0, 200) + '...',
    hasHtmlTags,
    hasHtmlEntities,
    hasHtmlStructure,
    hasComplexHtml,
    hasMarkdownTitles,
    hasMarkdownSyntax,
    isSimpleWrappedMarkdown,
    // 添加标题检测的详细信息
    hasH1: content.includes('# '),
    hasH2: content.includes('## '),
    hasH3: content.includes('### '),
    titleMatches: content.match(/#{1,6}\s[^\n]+/g),
    detectedType: hasComplexHtml ? 'html' :  // 优先保持复杂HTML格式
                  isSimpleWrappedMarkdown ? 'markdown' :  // 简单包装的Markdown
                  (hasHtmlTags || hasHtmlEntities || hasHtmlStructure) ? 'html' : 'markdown'
  });
  
  // 如果是复杂HTML（包含样式），必须按HTML处理以保持格式
  if (hasComplexHtml) {
    return 'html';
  }
  
  // 如果是简单包装的Markdown，按Markdown处理
  if (isSimpleWrappedMarkdown) {
    return 'markdown';
  }
  
  // 如果包含HTML标签、实体或结构，认为是HTML
  if (hasHtmlTags || hasHtmlEntities || hasHtmlStructure) {
    return 'html';
  }
  
  // 否则认为是Markdown
  return 'markdown';
};

// 提取和清理Markdown内容（从HTML包装中提取）
const extractMarkdownFromHtml = (content: string): string => {
  // 如果内容被简单的div包装，提取内部内容
  const divMatch = content.match(/^<div[^>]*>([\s\S]*)<\/div>$/);
  if (divMatch) {
    return divMatch[1].trim();
  }
  
  // 如果内容被p标签包装，提取内部内容
  const pMatch = content.match(/^<p[^>]*>([\s\S]*)<\/p>$/);
  if (pMatch) {
    return pMatch[1].trim();
  }
  
  // 移除简单的HTML标签，保留内容
  return content
    .replace(/<\/?div[^>]*>/g, '')
    .replace(/<\/?p[^>]*>/g, '')
    .replace(/<\/?span[^>]*>/g, '')
    .trim();
};

// 处理Markdown换行的函数
const processMarkdownLineBreaks = (content: string): string => {
  return content
    // 将单个换行符转换为两个空格+换行（Markdown强制换行）
    .replace(/(?<!\n)\n(?!\n)/g, '  \n')
    // 确保段落之间有双换行
    .replace(/\n\s*\n/g, '\n\n')
    // 处理列表项的换行
    .replace(/●\s*/g, '- ')
    // 处理特殊的分隔线
    .replace(/---+/g, '\n---\n');
};

// 清理和安全化HTML内容
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // 服务端渲染时的处理
    return html;
  }
  
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'div', 'span',
      'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'code', 'pre',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false
  });
  
  // 后处理：将HTML中的Markdown语法转换为HTML
  let processedHtml = sanitized;
  
  console.log('ResultDisplay开始处理HTML内容:', processedHtml.substring(0, 200));
  
  // 1. 首先处理标题（必须在其他处理之前，按从大到小的顺序）
  // 处理行首的标题
  processedHtml = processedHtml
    .replace(/^######\s+(.+)$/gm, '<h6 style="font-size: 0.875rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5 style="font-size: 1rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4 style="font-size: 1.125rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.75rem 0;">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0;">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1.5rem 0 1rem 0;">$1</h1>');
  
  // 处理换行后的标题
  processedHtml = processedHtml
    .replace(/\n######\s+(.+)/g, '\n<h6 style="font-size: 0.875rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h6>')
    .replace(/\n#####\s+(.+)/g, '\n<h5 style="font-size: 1rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h5>')
    .replace(/\n####\s+(.+)/g, '\n<h4 style="font-size: 1.125rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h4>')
    .replace(/\n###\s+(.+)/g, '\n<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.75rem 0;">$1</h3>')
    .replace(/\n##\s+(.+)/g, '\n<h2 style="font-size: 1.5rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0;">$1</h2>')
    .replace(/\n#\s+(.+)/g, '\n<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1.5rem 0 1rem 0;">$1</h1>');
  
  console.log('ResultDisplay标题处理后:', processedHtml.substring(0, 300));
  
  // 2. 处理横线分隔符
  processedHtml = processedHtml
    .replace(/^---+$/gm, '<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">')
    .replace(/\n---+\n/g, '\n<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">\n')
    .replace(/\n---+$/g, '\n<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">');
  
  // 3. 处理粗体和斜体
  processedHtml = processedHtml
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
  
  // 4. 处理代码
  processedHtml = processedHtml
    .replace(/`(.*?)`/g, '<code style="background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem;">$1</code>');
  
  // 5. 处理占位符样式
  processedHtml = processedHtml
    .replace(/\[([^\]]+)\]/g, '<span style="color: #6b7280;">[$1]</span>');
  
  // 6. 处理列表项
  processedHtml = processedHtml
    .replace(/●\s*/g, '• ')
    .replace(/^\s*[-*+]\s+(.+)$/gm, '<li style="margin-bottom: 0.25rem;">$1</li>')
    .replace(/^\s*\d+\.\s+(.+)$/gm, '<li style="margin-bottom: 0.25rem;">$1</li>');
  
  // 7. 包装连续的列表项
  processedHtml = processedHtml
    .replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/g, (match) => {
      if (match.includes('<ul>') || match.includes('<ol>')) {
        return match;
      }
      return `<ul style="margin: 0.75rem 0; padding-left: 1.5rem; list-style-type: disc;">${match}</ul>`;
    });
  
  // 8. 处理换行 - 保留空行，正确处理单个换行
  // 首先保护已有的HTML标签，避免在标签中间插入br
  console.log('ResultDisplay换行处理前的内容:', processedHtml.substring(0, 500));
  
  processedHtml = processedHtml
    // 第一步：将多个连续空行合并为一个空行
    .replace(/(\n\s*){3,}/g, '\n\n');  // 3个或更多连续换行合并为2个换行（即一个空行）
  
  console.log('ResultDisplay第一步处理后:', processedHtml.substring(0, 500));
  
  // 第二步：在特定情况下保留空行效果 - 简化正则表达式
  processedHtml = processedHtml
    .replace(/([•●]\s*[^\n]+)\n([^\n•●])/g, '$1\n\n$2');  // 在列表项后添加空行
  
  console.log('ResultDisplay第二步处理后:', processedHtml.substring(0, 500));
  
  // 第三步：处理双换行（空行）
  processedHtml = processedHtml
    .replace(/\n\s*\n/g, '\n<br>\n');  // 双换行转换为一个br（保留空行效果）
  
  console.log('ResultDisplay第三步处理后:', processedHtml.substring(0, 500));
  
  // 第四步：处理单个换行，但避免影响HTML标签
  processedHtml = processedHtml
    .replace(/(?<!>)(?<!<br>)\n(?!<)(?!<br>)/g, '<br>\n');  // 单个换行转br，但避免重复处理
  
  console.log('ResultDisplay换行处理后:', processedHtml.substring(0, 400));
  
  // 9. 确保内容被适当的标签包围
  if (!processedHtml.match(/^<[h1-6]>|^<p>|^<div/)) {
    processedHtml = '<div>' + processedHtml;
  }
  if (!processedHtml.match(/<\/[h1-6]>$|<\/p>$|<\/div>$/)) {
    processedHtml = processedHtml + '</div>';
  }
  
  // 10. 清理多余的标签，但保留空行结构
  processedHtml = processedHtml
    .replace(/<div>(<h[1-6]>)/g, '$1')  // 移除标题前的div标签
    .replace(/(<\/h[1-6]>)<\/div>/g, '$1')  // 移除标题后的div标签
    .replace(/<div>(<hr>)/g, '$1')  // 移除hr前的div标签
    .replace(/(<hr>)<\/div>/g, '$1')  // 移除hr后的div标签
    .replace(/<div>(<ul>)/g, '$1')  // 移除列表前的div标签
    .replace(/(<\/ul>)<\/div>/g, '$1');  // 移除列表后的div标签
  
  console.log('ResultDisplay最终处理结果:', {
    original: html.substring(0, 100) + '...',
    processed: processedHtml.substring(0, 200) + '...',
    titleCount: (processedHtml.match(/<h[1-6]>/g) || []).length,
    hrCount: (processedHtml.match(/<hr/g) || []).length,
    brCount: (processedHtml.match(/<br>/g) || []).length
  });
  
  return processedHtml;
};

// HTML内容样式
const htmlStyles = `
  .html-content {
    line-height: 1.6;
    color: #374151;
  }
  
  .html-content h1 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1.5rem 0 1rem 0;
    color: #111827;
  }
  
  .html-content h2 {
    font-size: 1.125rem;
    font-weight: bold;
    margin: 1.25rem 0 0.75rem 0;
    color: #111827;
  }
  
  .html-content h3 {
    font-size: 1rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
    color: #111827;
  }
  
  .html-content h4, .html-content h5, .html-content h6 {
    font-size: 0.875rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
    color: #111827;
  }
  
  .html-content p {
    margin-bottom: 1rem;
    line-height: 1.625;
  }
  
  .html-content ul, .html-content ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  
  .html-content ul {
    list-style-type: disc;
  }
  
  .html-content ol {
    list-style-type: decimal;
  }
  
  .html-content li {
    margin-bottom: 0.25rem;
  }
  
  .html-content a {
    color: #2563eb;
    text-decoration: underline;
  }
  
  .html-content a:hover {
    color: #1d4ed8;
  }
  
  .html-content strong, .html-content b {
    font-weight: bold;
  }
  
  .html-content em, .html-content i {
    font-style: italic;
  }
  
  .html-content blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
    color: #6b7280;
  }
  
  .html-content code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.875rem;
    color: #1f2937;
  }
  
  .html-content pre {
    background-color: #f3f4f6;
    padding: 0.75rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    margin: 1rem 0;
  }
  
  .html-content pre code {
    background-color: transparent;
    padding: 0;
  }
  
  .html-content table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #d1d5db;
    margin: 1rem 0;
  }
  
  .html-content th, .html-content td {
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
  }
  
  .html-content th {
    background-color: #f3f4f6;
    font-weight: bold;
  }
  
  .html-content hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 1rem 0;
  }
  
  .html-content img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
  }
`;

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
        <style jsx global>
          {htmlStyles}
        </style>
        <div className="markdown-content">
          {(() => {
            const contentType = detectContentType(processedContent);
            
            if (contentType === 'html') {
              // 渲染HTML内容
              return (
                <div 
                  className="html-content"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(processedContent) 
                  }}
                />
              );
            } else {
              // 渲染Markdown内容
              const extractedContent = extractMarkdownFromHtml(processedContent);
              const markdownContent = processMarkdownLineBreaks(extractedContent);
              console.log('ResultDisplay渲染Markdown:', {
                original: processedContent.substring(0, 100) + '...',
                extracted: extractedContent.substring(0, 100) + '...',
                processed: markdownContent.substring(0, 100) + '...'
              });
              return (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-4 leading-relaxed text-gray-700" {...props} />
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
                      <ol className="mb-4 pl-6 list-decimal space-y-1" {...props} />
                    ),
                    li: ({ node, ...props }) => <li className="text-gray-700" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-blue-300 pl-4 italic mb-4 bg-blue-50 py-2 text-gray-600"
                        {...props}
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="min-w-full border-collapse border border-gray-300" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead className="bg-gray-100" {...props} />
                    ),
                    tbody: ({ node, ...props }) => (
                      <tbody {...props} />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr className="border-b border-gray-200" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
                    ),
                    code: ({ node, className, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !className?.includes("contains-task-list");
                      return isInline ? (
                        <code
                          className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                          {...props}
                        />
                      ) : (
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                          <code
                            className={`${className} text-sm`}
                            {...props}
                          />
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
      </CardContent>
    </Card>
  );
}

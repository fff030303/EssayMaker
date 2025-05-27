// 初稿结果展示组件，负责：
// - 专门用于展示初稿生成结果
// - 提供更清晰的流式呈现效果
// - 包含动态加载指示器
// - 优化 Markdown 渲染样式

"use client";

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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DisplayResult } from "../types";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";

// 添加自定义滚动条样式和HTML内容样式
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* HTML内容样式 */
  .html-content {
    line-height: 1.6;
    color: #374151;
  }
  
  .html-content h1 {
    font-size: 1.875rem;
    font-weight: bold;
    margin: 1rem 0;
    color: #111827;
  }
  
  .html-content h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0.75rem 0;
    color: #111827;
  }
  
  .html-content h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #111827;
  }
  
  .html-content h4, .html-content h5, .html-content h6 {
    font-size: 1.125rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #111827;
  }
  
  .html-content p {
    margin: 0.5rem 0;
    line-height: 1.625;
  }
  
  .html-content ul, .html-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  .html-content ul {
    list-style-type: disc;
  }
  
  .html-content ol {
    list-style-type: decimal;
  }
  
  .html-content li {
    margin: 0.25rem 0;
  }
  
  .html-content a {
    color: #3b82f6;
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
    margin: 0.5rem 0;
    color: #6b7280;
  }
  
  .html-content code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .html-content pre {
    background-color: #f3f4f6;
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    margin: 0.5rem 0;
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

interface DraftResultDisplayProps {
  result: DisplayResult | null;
  title?: string;
  headerActions?: React.ReactNode;
}

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
  console.log('内容检测:', {
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
  
  console.log('开始处理HTML内容:', processedHtml.substring(0, 200));
  
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
  
  console.log('标题处理后:', processedHtml.substring(0, 300));
  
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
  console.log('换行处理前的内容:', processedHtml.substring(0, 500));
  
  processedHtml = processedHtml
    // 第一步：将多个连续空行合并为一个空行
    .replace(/(\n\s*){3,}/g, '\n\n');  // 3个或更多连续换行合并为2个换行（即一个空行）
  
  console.log('第一步处理后:', processedHtml.substring(0, 500));
  
  // 第二步：在特定情况下保留空行效果 - 简化正则表达式
  processedHtml = processedHtml
    .replace(/([•●]\s*[^\n]+)\n([^\n•●])/g, '$1\n\n$2');  // 在列表项后添加空行
  
  console.log('第二步处理后:', processedHtml.substring(0, 500));
  
  // 第三步：处理双换行（空行）
  processedHtml = processedHtml
    .replace(/\n\s*\n/g, '\n<br>\n');  // 双换行转换为一个br（保留空行效果）
  
  console.log('第三步处理后:', processedHtml.substring(0, 500));
  
  // 第四步：处理单个换行，但避免影响HTML标签
  processedHtml = processedHtml
    .replace(/(?<!>)(?<!<br>)\n(?!<)(?!<br>)/g, '<br>\n');  // 单个换行转br，但避免重复处理
  
  console.log('换行处理后:', processedHtml.substring(0, 400));
  
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
  
  console.log('最终处理结果:', {
    original: html.substring(0, 100) + '...',
    processed: processedHtml.substring(0, 200) + '...',
    titleCount: (processedHtml.match(/<h[1-6]>/g) || []).length,
    hrCount: (processedHtml.match(/<hr/g) || []).length,
    brCount: (processedHtml.match(/<br>/g) || []).length
  });
  
  return processedHtml;
};

export function DraftResultDisplay({
  result,
  title = "素材整理报告",
  headerActions,
}: DraftResultDisplayProps) {
  // 添加日志查看后端返回的数据
  useEffect(() => {
    if (result) {
      console.log("后端返回的数据:", result);
      console.log("内容长度:", result.content?.length || 0);
      console.log("是否完成:", result.isComplete);
      console.log("当前步骤:", result.currentStep);
      console.log("时间戳:", result.timestamp);
    }
  }, [result]);

  const [displayedContent, setDisplayedContent] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [typingProgress, setTypingProgress] = useState(0);
  const [previousContent, setPreviousContent] = useState<string>("");
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

  // 添加状态来记录是否已经完成过流式生成
  const [hasCompletedStreaming, setHasCompletedStreaming] = useState(false);

  // 新增: 每次result.timestamp变化时重置显示内容和状态
  useEffect(() => {
    if (!result) return;
    setDisplayedContent("");
    setTypingProgress(0);
    setPreviousContent("");
    setIsCollapsed(false);
    setHasAutoCollapsed(false); // 重置自动收起状态
    setUserManuallyExpanded(false); // 重置用户手动展开状态
    setUserManuallyScrolled(false); // 重置用户手动滚动状态
    setAutoScroll(true); // 重置自动滚动状态
    lastUpdateRef.current = Date.now();
  }, [result?.timestamp]);

  // 新增: 根据 autoScroll 状态控制自动滚动
  useEffect(() => {
    if (autoScroll && contentRef.current && !userManuallyScrolled) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [displayedContent, autoScroll, userManuallyScrolled]);

  // 使用打字机效果逐步显示内容
  useEffect(() => {
    if (!result || !result.content) return;

    // 如果已经完成过流式生成，直接显示完整内容
    if (hasCompletedStreaming) {
      // 只有当当前显示的内容与最终内容不同时才更新状态
      if (displayedContent !== result.content) {
        setDisplayedContent(result.content);
        setTypingProgress(result.content.length);
      }
      return;
    }

    // 如果内容变化，记录之前的内容长度
    if (result.content !== previousContent) {
      setPreviousContent(result.content);

      // 如果是新内容，重置进度从当前显示的内容长度开始
      if (result.content.length > previousContent.length) {
        setTypingProgress(displayedContent.length);
      }
    }

    // 如果还有未显示的内容，设置定时器逐步显示
    if (typingProgress < result.content.length) {
      const timer = setTimeout(() => {
        // 每次增加10-20个字符，模拟正常打字速度
        const increment = Math.floor(Math.random() * 10) + 10;
        const newProgress = Math.min(
          typingProgress + increment,
          result.content.length
        );
        setTypingProgress(newProgress);
        setDisplayedContent(result.content.substring(0, newProgress));
        // 更新最后内容变化时间
        lastUpdateRef.current = Date.now();

        // 如果已经显示完所有内容，标记流式生成完成
        if (newProgress >= result.content.length) {
          setHasCompletedStreaming(true);
        }
      }, 30); // 每30毫秒更新一次，看起来流畅

      return () => clearTimeout(timer);
    }
  }, [
    result,
    typingProgress,
    previousContent,
    displayedContent,
    hasCompletedStreaming,
  ]);

  // 当结果完成时，确保显示全部内容
  useEffect(() => {
    if (result?.isComplete && result.content) {
      setDisplayedContent(result.content);
      setTypingProgress(result.content.length);
      setHasCompletedStreaming(true);
    }
  }, [result?.isComplete, result?.content]);

  // 处理复制内容
  const handleCopy = async () => {
    if (!result?.content) return;

    setCopying(true);
    try {
      // 尝试使用现代clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(result.content);
      } else {
        // 回退到传统方法
        const textArea = document.createElement("textarea");
        textArea.value = result.content;
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
        description: "内容已复制到剪贴板",
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
  const handleDownload = () => {
    if (!result?.content) return;

    // 去除Markdown格式
    const cleanContent = result.content
      .replace(/\*\*(.*?)\*\*/g, "$1") // 去除加粗
      .replace(/\*(.*?)\*/g, "$1") // 去除斜体
      .replace(/\n\s*[-*+]\s/g, "\n") // 去除无序列表
      .replace(/\n\s*\d+\.\s/g, "\n") // 去除有序列表
      .replace(/>\s*(.*?)\n/g, "$1\n") // 去除引用
      .replace(/#{1,6}\s/g, "") // 去除标题
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // 去除代码块
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1") // 去除链接
      .replace(/\n{3,}/g, "\n\n") // 去除多余空行
      .trim();

    // 创建Word文档内容
    const wordContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: "Microsoft YaHei", sans-serif; line-height: 1.6; }
          p { margin: 0 0 1em 0; }
        </style>
      </head>
      <body>
        ${cleanContent
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join("")}
      </body>
      </html>
    `;

    // 创建Blob对象
    const blob = new Blob([wordContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 使用title作为文件名，并添加日期
    a.download = `${title}-${new Date()
      .toLocaleDateString()
      .replace(/\//g, "-")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "下载成功",
      description: `${title}已下载为Word文档`,
    });
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
        ) < 10;

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
  const isGenerating = !result || (result && !result.content);

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

  // 分割Markdown内容以便更好地渲染
  const sections = displayedContent.split(/(?<=\n\n)/);

  // 计算要显示的内容（根据收起状态）
  const displayContent =
    isCollapsed && displayedContent.length > previewLength
      ? displayedContent.substring(0, previewLength) + "..."
      : displayedContent;

  // 分割处理后的内容进行渲染
  const displaySections = displayContent.split(/(?<=\n\n)/);

  // 是否应该显示收起/展开按钮（只有在内容足够长时）
  const shouldShowToggle =
    result.isComplete && displayedContent.length > previewLength;

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

        {/* 功能按钮区域 */}
        <div className="flex items-center gap-2">
          {headerActions}
          {/* 复制和下载按钮 - 仅在生成完成后显示 */}
          {result && result.isComplete && (
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
                title="下载为文件"
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
          {/* 优化的内容渲染区域 - 支持HTML和Markdown */}
          <div className="markdown-content">
            {(() => {
              const contentToRender = isCollapsed
                ? displayedContent.substring(0, previewLength) + "..."
                : displayedContent;
              
              const contentType = detectContentType(contentToRender);
              
              if (contentType === 'html') {
                // 渲染HTML内容
                return (
                  <div 
                    className="html-content"
                    dangerouslySetInnerHTML={{ 
                      __html: sanitizeHtml(contentToRender) 
                    }}
                  />
                );
              } else {
                // 渲染Markdown内容
                const extractedContent = extractMarkdownFromHtml(contentToRender);
                const markdownContent = processMarkdownLineBreaks(extractedContent);
                console.log('渲染Markdown内容:', {
                  original: contentToRender.substring(0, 100) + '...',
                  extracted: extractedContent.substring(0, 100) + '...',
                  processed: markdownContent.substring(0, 100) + '...'
                });
                return (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => {
                        console.log('渲染H1:', children);
                        return <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 border-b border-gray-200 pb-2">{children}</h1>;
                      },
                      h2: ({ children }) => {
                        console.log('渲染H2:', children);
                        return <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900">{children}</h2>;
                      },
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-base font-bold mt-3 mb-2 text-gray-900">{children}</h4>
                      ),
                      h5: ({ children }) => (
                        <h5 className="text-sm font-bold mt-3 mb-2 text-gray-900">{children}</h5>
                      ),
                      h6: ({ children }) => (
                        <h6 className="text-sm font-bold mt-3 mb-2 text-gray-700">{children}</h6>
                      ),
                      p: ({ children }) => {
                        console.log('渲染段落:', children);
                        return <p className="mb-4 leading-relaxed text-gray-700">{children}</p>;
                      },
                      br: () => <br className="my-1" />,
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-300 pl-4 italic mb-4 bg-blue-50 py-2 text-gray-600">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-blue-600 hover:text-blue-800 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full border-collapse border border-gray-300">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-100">{children}</thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody>{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="border-b border-gray-200">{children}</tr>
                      ),
                      th: ({ children }) => (
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          {children}
                        </td>
                      ),
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !className;
                        
                        if (isInline) {
                          return (
                            <code 
                              className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        }
                        
                        return (
                          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                            <code className={`${className} text-sm`} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      strong: ({ children }) => {
                        console.log('渲染粗体:', children);
                        return <strong className="font-bold text-gray-900">{children}</strong>;
                      },
                      em: ({ children }) => (
                        <em className="italic text-gray-700">{children}</em>
                      ),
                      hr: () => (
                        <hr className="border-t border-gray-300 my-6" />
                      ),
                      img: ({ src, alt }) => (
                        <img 
                          src={src} 
                          alt={alt} 
                          className="max-w-full h-auto rounded-lg shadow-sm my-4"
                        />
                      ),
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                );
              }
            })()}
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
          {!result.isComplete && displayedContent && !isGenerating && (
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
            </div>
          )}

          {/* 收起/展开按钮区域 */}
          {result.isComplete && shouldShowToggle && !isCollapsed && (
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

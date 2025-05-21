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

// 添加自定义滚动条样式
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
`;

interface DraftResultDisplayProps {
  result: DisplayResult | null;
  title?: string;
  headerActions?: React.ReactNode;
}

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
          {/* 优化的Markdown渲染区域 */}
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-3 prose-p:my-2.5 prose-li:my-1 prose-pre:bg-gray-100 prose-pre:p-3 prose-pre:rounded prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-a:text-blue-500 prose-a:underline prose-table:border prose-table:border-gray-300 prose-th:bg-gray-100 prose-th:p-2 prose-td:p-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-3xl font-bold my-4">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl font-bold my-3">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold my-2">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="my-2 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 my-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 my-2">{children}</ol>
                ),
                li: ({ children }) => <li className="my-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300 my-4">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-4 py-2">
                    {children}
                  </td>
                ),
                code: ({ node, className, children }) => {
                  const isInline = node?.tagName === "code" && !className;
                  if (isInline) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      <code className={className}>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {isCollapsed
                ? displayedContent.substring(0, previewLength) + "..."
                : displayedContent}
            </ReactMarkdown>
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

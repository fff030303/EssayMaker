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
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2,
  Edit,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DisplayResult } from "../types";
import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { apiService } from "@/app/console/essaymaker/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSectionalLogger } from "./sectionalassistant/hooks/useSectionalLogger";

// 检测内容类型的函数
const detectContentType = (content: string): "html" | "markdown" => {
  // 检测HTML标签
  const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;
  const hasHtmlTags = htmlTagRegex.test(content);

  // 检测常见的HTML实体
  const htmlEntityRegex = /&[a-zA-Z0-9#]+;/;
  const hasHtmlEntities = htmlEntityRegex.test(content);

  // 检测HTML文档结构
  const hasHtmlStructure =
    content.includes("<!DOCTYPE") ||
    content.includes("<html") ||
    content.includes("<head") ||
    content.includes("<body");

  // 检测复杂的HTML结构（包含样式、嵌套等）- 这些必须按HTML处理
  const hasComplexHtml =
    hasHtmlTags &&
    (content.includes("style=") || // 内联样式
      content.includes("class=") || // CSS类
      content.includes("display:") || // CSS样式
      content.includes("justify-content:") || // Flexbox
      content.includes("text-align:") || // 文本对齐
      content.includes("flex") || // Flex布局
      /<div[^>]*>[\s\S]*<div[^>]*>/.test(content)); // 嵌套div

  // 检测Markdown标题 - 但只在没有复杂HTML时才优先考虑
  const hasMarkdownTitles =
    /^#{1,6}\s/.test(content) || /\n#{1,6}\s/.test(content);

  // 检测其他Markdown语法
  const hasMarkdownSyntax =
    content.includes("**") || // 粗体
    content.includes("- ") || // 无序列表
    content.includes("1. ") || // 有序列表
    content.includes("---") || // 分隔线
    content.includes("`"); // 代码

  // 检测是否是简单包装的Markdown（只有简单的div/p包装，没有样式）
  const isSimpleWrappedMarkdown =
    hasHtmlTags && !hasComplexHtml && hasMarkdownTitles;

  // 添加调试日志
  console.log("ResultDisplay内容检测:", {
    content: content.substring(0, 200) + "...",
    hasHtmlTags,
    hasHtmlEntities,
    hasHtmlStructure,
    hasComplexHtml,
    hasMarkdownTitles,
    hasMarkdownSyntax,
    isSimpleWrappedMarkdown,
    // 添加标题检测的详细信息
    hasH1: content.includes("# "),
    hasH2: content.includes("## "),
    hasH3: content.includes("### "),
    titleMatches: content.match(/#{1,6}\s[^\n]+/g),
    detectedType: hasComplexHtml
      ? "html" // 优先保持复杂HTML格式
      : isSimpleWrappedMarkdown
      ? "markdown" // 简单包装的Markdown
      : hasHtmlTags || hasHtmlEntities || hasHtmlStructure
      ? "html"
      : "markdown",
  });

  // 如果是复杂HTML（包含样式），必须按HTML处理以保持格式
  if (hasComplexHtml) {
    return "html";
  }

  // 如果是简单包装的Markdown，按Markdown处理
  if (isSimpleWrappedMarkdown) {
    return "markdown";
  }

  // 如果包含HTML标签、实体或结构，认为是HTML
  if (hasHtmlTags || hasHtmlEntities || hasHtmlStructure) {
    return "html";
  }

  // 否则认为是Markdown
  return "markdown";
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
    .replace(/<\/?div[^>]*>/g, "")
    .replace(/<\/?p[^>]*>/g, "")
    .replace(/<\/?span[^>]*>/g, "")
    .trim();
};

// 处理Markdown换行的函数
const processMarkdownLineBreaks = (content: string): string => {
  return (
    content
      // 将单个换行符转换为两个空格+换行（Markdown强制换行）
      .replace(/(?<!\n)\n(?!\n)/g, "  \n")
      // 确保段落之间有双换行
      .replace(/\n\s*\n/g, "\n\n")
      // 处理列表项的换行
      .replace(/●\s*/g, "- ")
      // 处理特殊的分隔线
      .replace(/---+/g, "\n---\n")
  );
};

// 清理和安全化HTML内容
const sanitizeHtml = (html: string): string => {
  if (typeof window === "undefined") {
    // 服务端渲染时的处理
    return html;
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "div",
      "span",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "blockquote",
      "code",
      "pre",
      "hr",
    ],
    ALLOWED_ATTR: [
      "href",
      "src",
      "alt",
      "title",
      "class",
      "id",
      "style",
      "target",
      "rel",
    ],
    ALLOW_DATA_ATTR: false,
  });

  // 后处理：将HTML中的Markdown语法转换为HTML
  let processedHtml = sanitized;

  console.log(
    "ResultDisplay开始处理HTML内容:",
    processedHtml.substring(0, 200)
  );

  // 1. 首先处理标题（必须在其他处理之前，按从大到小的顺序）
  // 处理行首的标题
  processedHtml = processedHtml
    .replace(
      /^######\s+(.+)$/gm,
      '<h6 style="font-size: 0.875rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h6>'
    )
    .replace(
      /^#####\s+(.+)$/gm,
      '<h5 style="font-size: 1rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h5>'
    )
    .replace(
      /^####\s+(.+)$/gm,
      '<h4 style="font-size: 1.125rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h4>'
    )
    .replace(
      /^###\s+(.+)$/gm,
      '<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.75rem 0;">$1</h3>'
    )
    .replace(
      /^##\s+(.+)$/gm,
      '<h2 style="font-size: 1.5rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0;">$1</h2>'
    )
    .replace(
      /^#\s+(.+)$/gm,
      '<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1.5rem 0 1rem 0;">$1</h1>'
    );

  // 处理换行后的标题
  processedHtml = processedHtml
    .replace(
      /\n######\s+(.+)/g,
      '\n<h6 style="font-size: 0.875rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h6>'
    )
    .replace(
      /\n#####\s+(.+)/g,
      '\n<h5 style="font-size: 1rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h5>'
    )
    .replace(
      /\n####\s+(.+)/g,
      '\n<h4 style="font-size: 1.125rem; font-weight: bold; margin: 1rem 0 0.5rem 0;">$1</h4>'
    )
    .replace(
      /\n###\s+(.+)/g,
      '\n<h3 style="font-size: 1.25rem; font-weight: bold; margin: 1rem 0 0.75rem 0;">$1</h3>'
    )
    .replace(
      /\n##\s+(.+)/g,
      '\n<h2 style="font-size: 1.5rem; font-weight: bold; margin: 1.25rem 0 0.75rem 0;">$1</h2>'
    )
    .replace(
      /\n#\s+(.+)/g,
      '\n<h1 style="font-size: 1.875rem; font-weight: bold; margin: 1.5rem 0 1rem 0;">$1</h1>'
    );

  console.log("ResultDisplay标题处理后:", processedHtml.substring(0, 300));

  // 2. 处理横线分隔符
  processedHtml = processedHtml
    .replace(
      /^---+$/gm,
      '<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">'
    )
    .replace(
      /\n---+\n/g,
      '\n<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">\n'
    )
    .replace(
      /\n---+$/g,
      '\n<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">'
    );

  // 3. 处理粗体和斜体
  processedHtml = processedHtml
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');

  // 4. 处理代码
  processedHtml = processedHtml.replace(
    /`(.*?)`/g,
    '<code style="background-color: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem;">$1</code>'
  );

  // 5. 处理占位符样式 - 修复异常加粗问题
  processedHtml = processedHtml.replace(
    /\[([^\]]+)\]/g,
    '<span style="color: #6b7280; font-weight: normal;">[$1]</span>'
  );

  // 6. 处理列表项
  processedHtml = processedHtml
    .replace(/●\s*/g, "• ")
    .replace(
      /^\s*[-*+]\s+(.+)$/gm,
      '<li style="margin-bottom: 0.25rem;">$1</li>'
    )
    .replace(
      /^\s*\d+\.\s+(.+)$/gm,
      '<li style="margin-bottom: 0.25rem;">$1</li>'
    );

  // 7. 包装连续的列表项
  processedHtml = processedHtml.replace(
    /(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/g,
    (match) => {
      if (match.includes("<ul>") || match.includes("<ol>")) {
        return match;
      }
      return `<ul style="margin: 0.75rem 0; padding-left: 1.5rem; list-style-type: disc;">${match}</ul>`;
    }
  );

  // 8. 处理换行 - 保留空行，正确处理单个换行
  // 首先保护已有的HTML标签，避免在标签中间插入br
  console.log(
    "ResultDisplay换行处理前的内容:",
    processedHtml.substring(0, 500)
  );

  processedHtml = processedHtml
    // 第一步：将多个连续空行合并为一个空行
    .replace(/(\n\s*){3,}/g, "\n\n"); // 3个或更多连续换行合并为2个换行（即一个空行）

  console.log("ResultDisplay第一步处理后:", processedHtml.substring(0, 500));

  // 第二步：在特定情况下保留空行效果 - 简化正则表达式
  processedHtml = processedHtml.replace(
    /([•●]\s*[^\n]+)\n([^\n•●])/g,
    "$1\n\n$2"
  ); // 在列表项后添加空行

  console.log("ResultDisplay第二步处理后:", processedHtml.substring(0, 500));

  // 第三步：处理双换行（空行）
  processedHtml = processedHtml.replace(/\n\s*\n/g, "\n<br>\n"); // 双换行转换为一个br（保留空行效果）

  console.log("ResultDisplay第三步处理后:", processedHtml.substring(0, 500));

  // 第四步：处理单个换行，但避免影响HTML标签
  processedHtml = processedHtml.replace(
    /(?<!>)(?<!<br>)\n(?!<)(?!<br>)/g,
    "<br>\n"
  ); // 单个换行转br，但避免重复处理

  console.log("ResultDisplay换行处理后:", processedHtml.substring(0, 400));

  // 9. 确保内容被适当的标签包围
  if (!processedHtml.match(/^<[h1-6]>|^<p>|^<div/)) {
    processedHtml = "<div>" + processedHtml;
  }
  if (!processedHtml.match(/<\/[h1-6]>$|<\/p>$|<\/div>$/)) {
    processedHtml = processedHtml + "</div>";
  }

  // 10. 清理多余的标签，但保留空行结构
  processedHtml = processedHtml
    .replace(/<div>(<h[1-6]>)/g, "$1") // 移除标题前的div标签
    .replace(/(<\/h[1-6]>)<\/div>/g, "$1") // 移除标题后的div标签
    .replace(/<div>(<hr>)/g, "$1") // 移除hr前的div标签
    .replace(/(<hr>)<\/div>/g, "$1") // 移除hr后的div标签
    .replace(/<div>(<ul>)/g, "$1") // 移除列表前的div标签
    .replace(/(<\/ul>)<\/div>/g, "$1"); // 移除列表后的div标签

  console.log("ResultDisplay最终处理结果:", {
    original: html.substring(0, 100) + "...",
    processed: processedHtml.substring(0, 200) + "...",
    titleCount: (processedHtml.match(/<h[1-6]>/g) || []).length,
    hrCount: (processedHtml.match(/<hr/g) || []).length,
    brCount: (processedHtml.match(/<br>/g) || []).length,
  });

  return processedHtml;
};

// 修改 ResultDisplayProps 接口，添加 title 属性
interface ResultDisplayProps {
  result: DisplayResult | null;
  title?: string; // 添加可选的标题属性
  // 新增：用于调用改写策略API的参数
  onGenerateStrategy?: (strategyResult: DisplayResult) => void;
  originalEssayFile?: File | null;
  searchResult?: string;
  // 新增：步骤跳转回调
  onStepChange?: (step: number) => void;
  // 🆕 新增：个性化需求参数
  personalizationRequirements?: string;
  // 新增：恢复完整内容的回调
  onShowFullContent?: () => void;
}

export function ResultDisplay({
  result,
  title = "分析结果",
  onGenerateStrategy,
  originalEssayFile,
  searchResult,
  onStepChange,
  personalizationRequirements,
  onShowFullContent,
}: ResultDisplayProps) {
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const { toast } = useToast();

  // 🆕 新增：数据存储Hook
  const { logStrategyResult } = useSectionalLogger();

  // 🆕 新增：自定义策略生成提示词状态
  const [customStrategyGeneratorRole, setCustomStrategyGeneratorRole] =
    useState<string>("");
  const [customStrategyGeneratorTask, setCustomStrategyGeneratorTask] =
    useState<string>("");
  const [
    customStrategyGeneratorOutputFormat,
    setCustomStrategyGeneratorOutputFormat,
  ] = useState<string>("");
  const [showCustomPrompts, setShowCustomPrompts] = useState(false);

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

  // 处理撰写改写策略
  const handleGenerateStrategy = async () => {
    if (!originalEssayFile || !searchResult) {
      toast({
        variant: "destructive",
        title: "参数不足",
        description: "缺少原始文件或搜索结果数据",
      });
      return;
    }

    setIsGeneratingStrategy(true);

    // 🆕 立即跳转到第二步
    if (onStepChange) {
      onStepChange(2);
    }

    // 🆕 新增：记录开始时间用于性能监控
    const startTime = Date.now();

    try {
      console.log("调用策略生成API，自定义提示词:", {
        role: customStrategyGeneratorRole,
        task: customStrategyGeneratorTask,
        outputFormat: customStrategyGeneratorOutputFormat,
      });

      // 🆕 修改：传递自定义提示词参数和个性化需求
      const streamResponse =
        await apiService.streamEssayRewriteGenerateStrategy(
          searchResult,
          originalEssayFile,
          result.content || "", // 使用当前分析结果作为analysisResult
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
          personalizationRequirements || "", // 添加个性化需求参数
          "" // materialDoc 参数，暂时为空
        );

      if (!streamResponse) {
        throw new Error("未收到响应流");
      }

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();
      let strategyContent = "";
      let steps: string[] = [];

      // 创建策略结果对象
      const strategyResult: DisplayResult = {
        content: "",
        steps: [],
        timestamp: new Date().toISOString(),
        isComplete: false,
        currentStep: "改写策略生成中...",
      };

      // 立即显示加载状态
      if (onGenerateStrategy) {
        onGenerateStrategy(strategyResult);
      }

      // 处理流式响应
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.step) {
                steps.push(data.step);
              }

              if (data.content) {
                strategyContent += data.content;
              }

              if (data.current_step) {
                strategyResult.currentStep = data.current_step;
              }

              // 更新结果
              const updatedResult: DisplayResult = {
                ...strategyResult,
                content: strategyContent,
                steps: steps,
                isComplete: false,
              };

              if (onGenerateStrategy) {
                onGenerateStrategy(updatedResult);
              }
            } catch (e) {
              console.warn("解析流数据失败:", e);
            }
          }
        }
      }

      // 完成生成
      const finalResult: DisplayResult = {
        ...strategyResult,
        content: strategyContent,
        steps: steps,
        isComplete: true,
        currentStep: undefined,
      };

      if (onGenerateStrategy) {
        onGenerateStrategy(finalResult);
      }

      // 🆕 新增：计算执行时间
      const duration = Date.now() - startTime;

      // 🆕 新增：记录策略生成结果
      console.log("[ResultDisplay] 准备记录策略生成结果到数据库:", {
        requestData: {
          searchResult: !!searchResult,
          originalEssayFile: !!originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        resultData: !!finalResult,
        isSuccess: true,
        duration,
      });

      await logStrategyResult(
        {
          searchResult,
          originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        finalResult,
        true,
        duration
      );
      console.log("[ResultDisplay] 策略生成结果已记录到数据库");

      toast({
        title: "改写策略生成完成",
        description: "已成功生成个人陈述改写策略",
      });
    } catch (error) {
      console.error("生成改写策略失败:", error);

      // 🆕 新增：计算执行时间（即使失败也要记录）
      const duration = Date.now() - startTime;

      // 🆕 新增：记录失败的策略生成结果
      console.log("[ResultDisplay] 准备记录失败的策略生成结果到数据库:", {
        requestData: {
          searchResult: !!searchResult,
          originalEssayFile: !!originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        resultData: null,
        isSuccess: false,
        duration,
        errorMessage: error instanceof Error ? error.message : "未知错误",
      });

      await logStrategyResult(
        {
          searchResult,
          originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        null,
        false,
        duration,
        error instanceof Error ? error.message : "未知错误"
      );

      console.log("[ResultDisplay] 失败的策略生成结果已记录到数据库");

      toast({
        variant: "destructive",
        title: "生成失败",
        description:
          error instanceof Error ? error.message : "改写策略生成失败",
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // 使用Shadcn UI原生Card组件
  return (
    <Card className="shadow-md h-full flex flex-col border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 pb-4 pt-5 px-5 flex-shrink-0 bg-gradient-to-br from-stone-200/60 to-zinc-200/50">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-stone-200 to-zinc-200/95 flex items-center justify-center">
          <FileText className="h-5 w-5 text-stone-700" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-medium text-stone-700">
            {/* @ts-ignore */}
            {result._isStepContent && result._stepTitle
              ? `${title} - ${result._stepTitle}`
              : title}
          </CardTitle>
          <p className="text-sm text-stone-600">
            {new Date(result.timestamp).toLocaleString()}
            {/* @ts-ignore */}
            {result._isStepContent && (
              <span className="ml-2 text-xs text-stone-500">(步骤详情)</span>
            )}
          </p>
        </div>

        {/* 显示完整内容按钮 */}
        {/* @ts-ignore */}
        {result._isStepContent && onShowFullContent && (
          <Button
            variant="outline"
            size="sm"
            className="mr-2 text-xs bg-white/80 hover:bg-white/90 border-stone-300"
            onClick={onShowFullContent}
            title="返回查看完整生成内容"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            查看最终结果
          </Button>
        )}

        {/* 新增：撰写改写策略按钮和自定义提示词 */}
        {originalEssayFile && searchResult && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="mr-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleGenerateStrategy}
                disabled={
                  isGeneratingStrategy ||
                  !result.isComplete ||
                  !result.content ||
                  result.currentStep === "生成出错，请重试"
                }
                title={
                  !result.isComplete
                    ? "请等待分稿策略生成完成后再生成改写策略"
                    : !result.content
                    ? "没有可用的分析结果"
                    : result.currentStep === "生成出错，请重试"
                    ? "请先重新生成分稿策略"
                    : "基于当前分析结果生成Essay改写策略"
                }
              >
                {isGeneratingStrategy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    撰写改写策略
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomPrompts(!showCustomPrompts)}
                className="text-xs hidden hover:bg-stone-100/70"
              >
                {showCustomPrompts ? "隐藏" : "显示"}提示词设置
              </Button>
            </div>

            {/* 🆕 自定义策略生成提示词输入区域 */}
            {showCustomPrompts && (
              <Card className="mt-2 border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90">
                <CardHeader className="pb-2 bg-gradient-to-r from-stone-200/60 to-zinc-200/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-stone-700">
                      策略生成自定义提示词
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6 hover:bg-stone-100/70"
                      onClick={() => {
                        setCustomStrategyGeneratorRole("");
                        setCustomStrategyGeneratorTask("");
                        setCustomStrategyGeneratorOutputFormat("");
                        toast({
                          title: "已清空",
                          description: "策略生成提示词已重置",
                        });
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1 text-stone-600" />
                      重置
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <Label htmlFor="strategy-role" className="text-xs">
                      策略生成角色提示词
                    </Label>
                    <Textarea
                      id="strategy-role"
                      value={customStrategyGeneratorRole}
                      onChange={(e) =>
                        setCustomStrategyGeneratorRole(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：你是一位专业的Essay改写策略专家，擅长分析学术写作需求..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>

                  <div>
                    <Label htmlFor="strategy-task" className="text-xs">
                      策略生成任务提示词
                    </Label>
                    <Textarea
                      id="strategy-task"
                      value={customStrategyGeneratorTask}
                      onChange={(e) =>
                        setCustomStrategyGeneratorTask(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：请根据搜索结果和原稿分析，制定详细的Essay改写策略..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>

                  <div>
                    <Label htmlFor="strategy-format" className="text-xs">
                      策略生成输出格式提示词
                    </Label>
                    <Textarea
                      id="strategy-format"
                      value={customStrategyGeneratorOutputFormat}
                      onChange={(e) =>
                        setCustomStrategyGeneratorOutputFormat(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：请按照结构化格式输出改写策略，包含分析要点、改进建议等..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardHeader>

      {/* 加载状态显示 */}
      {result.currentStep && (
        <div className="flex items-center gap-2 px-6 py-3 text-sm text-stone-600 bg-stone-200/60 border-t border-b border-stone-300/30 flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-stone-700" />
          <span>{result.currentStep}</span>
        </div>
      )}

      <CardContent className="pt-6 px-6 pb-6 overflow-y-auto flex-grow custom-scrollbar bg-stone-50/50">
        <style jsx global>{`
          /* 自定义滚动条样式 */
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px !important;
            height: 4px !important;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent !important;
            border-radius: 4px !important;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.2) !important;
            border-radius: 4px !important;
            border: none !important;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.4) !important;
          }

          .custom-scrollbar::-webkit-scrollbar-corner {
            background: transparent !important;
          }

          /* 为Firefox提供低调的滚动条样式 */
          .custom-scrollbar {
            scrollbar-width: thin !important;
            scrollbar-color: rgba(156, 163, 175, 0.2) transparent !important;
          }

          /* HTML内容样式 */
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

          .html-content h4,
          .html-content h5,
          .html-content h6 {
            font-size: 0.875rem;
            font-weight: bold;
            margin: 1rem 0 0.5rem 0;
            color: #111827;
          }

          .html-content p {
            margin-bottom: 1rem;
            line-height: 1.625;
          }

          .html-content ul,
          .html-content ol {
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

          .html-content strong,
          .html-content b {
            font-weight: bold;
          }

          .html-content em,
          .html-content i {
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
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
              "Liberation Mono", Menlo, monospace;
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

          .html-content th,
          .html-content td {
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
        `}</style>
        <div className="markdown-content">
          {(() => {
            const contentType = detectContentType(processedContent);

            if (contentType === "html") {
              // 渲染HTML内容
              return (
                <div
                  className="html-content"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(processedContent),
                  }}
                />
              );
            } else {
              // 渲染Markdown内容
              const extractedContent =
                extractMarkdownFromHtml(processedContent);
              const markdownContent =
                processMarkdownLineBreaks(extractedContent);
              console.log("ResultDisplay渲染Markdown:", {
                original: processedContent.substring(0, 100) + "...",
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
                      <ul
                        className="mb-4 pl-6 list-disc space-y-1"
                        {...props}
                      />
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
                      <hr
                        className="border-t border-gray-300 my-6"
                        {...props}
                      />
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

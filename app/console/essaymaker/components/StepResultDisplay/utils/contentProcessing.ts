/**
 * 内容处理工具函数模块
 *
 * 功能：处理各种内容格式的检测、转换和安全化
 *
 * 包含函数：
 * - detectContentType: 智能检测内容类型（HTML/Markdown）
 * - extractMarkdownFromHtml: 从HTML包装中提取Markdown内容
 * - processMarkdownLineBreaks: 处理Markdown换行格式
 * - sanitizeHtml: 清理和安全化HTML内容
 */

import DOMPurify from "dompurify";

// 检测内容类型的函数
export const detectContentType = (content: string): "html" | "markdown" => {
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
  // console.log("ResultDisplay内容检测:", {
  //   content: content.substring(0, 200) + "...",
  //   hasHtmlTags,
  //   hasHtmlEntities,
  //   hasHtmlStructure,
  //   hasComplexHtml,
  //   hasMarkdownTitles,
  //   hasMarkdownSyntax,
  //   isSimpleWrappedMarkdown,
  //   // 添加标题检测的详细信息
  //   hasH1: content.includes("# "),
  //   hasH2: content.includes("## "),
  //   hasH3: content.includes("### "),
  //   titleMatches: content.match(/#{1,6}\s[^\n]+/g),
  //   detectedType: hasComplexHtml
  //     ? "html" // 优先保持复杂HTML格式
  //     : isSimpleWrappedMarkdown
  //     ? "markdown" // 简单包装的Markdown
  //     : hasHtmlTags || hasHtmlEntities || hasHtmlStructure
  //     ? "html"
  //     : "markdown",
  // });
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
export const extractMarkdownFromHtml = (content: string): string => {
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
export const processMarkdownLineBreaks = (content: string): string => {
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
export const sanitizeHtml = (html: string): string => {
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

  // console.log(
  //   "ResultDisplay开始处理HTML内容:",
  //   processedHtml.substring(0, 200)
  // );

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

  // console.log("ResultDisplay标题处理后:", processedHtml.substring(0, 300));
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
  // console.log(
  //   "ResultDisplay换行处理前的内容:",
  //   processedHtml.substring(0, 500)
  // );

  processedHtml = processedHtml
    // 第一步：将多个连续空行合并为一个空行
    .replace(/(\n\s*){3,}/g, "\n\n"); // 3个或更多连续换行合并为2个换行（即一个空行）

  // console.log("ResultDisplay第一步处理后:", processedHtml.substring(0, 500));
  // 第二步：在特定情况下保留空行效果 - 简化正则表达式
  processedHtml = processedHtml.replace(
    /([•●]\s*[^\n]+)\n([^\n•●])/g,
    "$1\n\n$2"
  ); // 在列表项后添加空行

  // console.log("ResultDisplay第二步处理后:", processedHtml.substring(0, 500));
  // 第三步：处理双换行（空行）
  processedHtml = processedHtml.replace(/\n\s*\n/g, "\n<br>\n"); // 双换行转换为一个br（保留空行效果）

  // console.log("ResultDisplay第三步处理后:", processedHtml.substring(0, 500));
  // 第四步：处理单个换行，但避免影响HTML标签
  processedHtml = processedHtml.replace(
    /(?<!>)(?<!<br>)\n(?!<)(?!<br>)/g,
    "<br>\n"
  ); // 单个换行转br，但避免重复处理

  // console.log("ResultDisplay换行处理后:", processedHtml.substring(0, 400));
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

  // console.log("ResultDisplay最终处理结果:", {
  //   original: html.substring(0, 100) + "...",
  //   processed: processedHtml.substring(0, 200) + "...",
  //   titleCount: (processedHtml.match(/<h[1-6]>/g) || []).length,
  //   hrCount: (processedHtml.match(/<hr/g) || []).length,
  //   brCount: (processedHtml.match(/<br>/g) || []).length,
  // });
  return processedHtml;
};

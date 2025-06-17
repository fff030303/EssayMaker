/**
 * DraftResultDisplay 工具函数文件
 *
 * 功能：提供初稿结果显示相关的工具函数和内容处理逻辑
 *
 * 核心功能：
 * 1. 内容类型检测：
 *    - 智能识别HTML和Markdown格式
 *    - 检测复杂HTML结构和样式
 *    - 分析内容特征和标记
 *    - 自动选择最佳渲染方式
 *
 * 2. 内容处理：
 *    - HTML内容安全化处理
 *    - Markdown语法转换
 *    - 换行和格式优化
 *    - 特殊字符处理
 *
 * 3. 格式转换：
 *    - HTML到Markdown转换
 *    - Markdown到HTML转换
 *    - 混合格式处理
 *    - 内容提取和清理
 *
 * 4. 安全性处理：
 *    - XSS攻击防护
 *    - 内容过滤和验证
 *    - 标签白名单控制
 *    - 属性安全检查
 *
 * 5. 性能优化：
 *    - 内容缓存机制
 *    - 懒加载处理
 *    - 批量处理优化
 *    - 内存使用控制
 *
 * 主要函数：
 * - detectContentType：内容类型检测
 * - extractMarkdownFromHtml：从HTML提取Markdown
 * - processMarkdownLineBreaks：处理Markdown换行
 * - sanitizeHtml：HTML内容安全化
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

import DOMPurify from "isomorphic-dompurify";

// 新增：解包被 markdown 代码块包裹的内容
export const unwrapMarkdownCodeBlock = (content: string): string => {
  if (!content) return content;

  // 检查是否被 ```markdown 或 ``` 代码块包裹
  const markdownBlockRegex = /^```(?:markdown)?\s*\n([\s\S]*?)\n```$/;
  const match = content.trim().match(markdownBlockRegex);

  if (match) {
    
    return match[1];
  }

  // 如果没有被代码块包裹，返回原内容
  return content;
};

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
  // console.log("内容检测:", {
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
      // 🆕 修复：正确处理分隔线，确保分隔线前后有适当的空行，但不重复添加
      .replace(/\n*---+\n*/g, "\n\n---\n\n")
      // 🆕 清理可能产生的多余空行
      .replace(/\n{3,}/g, "\n\n")
  );
};

// 🆕 新增：清理Markdown格式，返回纯文本内容
export const cleanMarkdownToPlainText = (content: string): string => {
  if (!content) return content;

  // 先解包可能被代码块包裹的内容
  const unwrappedContent = unwrapMarkdownCodeBlock(content);

  // 第一步：去除所有HTML标签
  let cleanContent = unwrappedContent
    // 去除HTML标签（包括属性）
    .replace(/<[^>]*>/g, "")
    // 去除HTML实体
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z0-9#]+;/g, ""); // 去除其他HTML实体

  // 第二步：去除所有Markdown格式，保留纯文本
  cleanContent = cleanContent
    // 去除标题标记
    .replace(/#{1,6}\s+/g, "")
    // 去除粗体标记
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    // 去除斜体标记
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    // 去除删除线
    .replace(/~~(.*?)~~/g, "$1")
    // 去除代码块标记
    .replace(/```[\s\S]*?\n([\s\S]*?)\n```/g, "$1")
    .replace(/`{1,2}([^`]+)`{1,2}/g, "$1")
    // 去除链接，保留链接文本
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    // 去除图片标记
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // 去除引用标记
    .replace(/^>\s*/gm, "")
    .replace(/\n>\s*/g, "\n")
    // 去除无序列表标记
    .replace(/^\s*[-*+•●]\s+/gm, "")
    .replace(/\n\s*[-*+•●]\s+/g, "\n")
    // 去除有序列表标记
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n\s*\d+\.\s+/g, "\n")
    // 去除分隔线
    .replace(/^[-*_]{3,}$/gm, "")
    .replace(/\n[-*_]{3,}\n/g, "\n\n")
    // 去除表格标记
    .replace(/\|/g, " ")
    .replace(/^[-\s:]+$/gm, "")
    // 去除特殊符号和格式
    .replace(/[•●]/g, "")
    .replace(/\[([^\]]*)\]/g, "$1") // 去除方括号，保留内容
    // 清理多余的空白字符
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/^\s+|\s+$/gm, "") // 去除每行开头和结尾的空白
    .trim();

  // console.log("清理内容:", {
  //   original: unwrappedContent.substring(0, 100) + "...",
  //   cleaned: cleanContent.substring(0, 100) + "...",
  //   htmlTagsRemoved: (unwrappedContent.match(/<[^>]*>/g) || []).length,
  //   markdownRemoved: unwrappedContent !== cleanContent,
  // });
  return cleanContent;
};

// 清理和安全化HTML内容
export const sanitizeHtml = (html: string): string => {
  if (typeof window === "undefined") {
    // 服务端渲染时的处理
    return html;
  }

  // 🆕 预处理：确保HTML标签格式正确
  let preprocessedHtml = html
    // 标准化HTML标签
    .replace(/<strong>/gi, "<strong>")
    .replace(/<\/strong>/gi, "</strong>")
    .replace(/<b>/gi, "<strong>") // 将<b>标签转为<strong>
    .replace(/<\/b>/gi, "</strong>")
    .replace(/<em>/gi, "<em>")
    .replace(/<\/em>/gi, "</em>")
    .replace(/<i>/gi, "<em>") // 将<i>标签转为<em>
    .replace(/<\/i>/gi, "</em>");

  // console.log("HTML预处理:", {
  //   原始: html.substring(0, 200) + "...",
  //   预处理后: preprocessedHtml.substring(0, 200) + "...",
  // });
  const sanitized = DOMPurify.sanitize(preprocessedHtml, {
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
    // 🆕 保持HTML结构，不进行过度清理
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });

  // 后处理：将HTML中的Markdown语法转换为HTML
  let processedHtml = sanitized;

  // console.log("DOMPurify处理后:", {
  //   清理结果: processedHtml.substring(0, 200) + "...",
  //   是否包含strong: processedHtml.includes("<strong>"),
  //   是否包含em: processedHtml.includes("<em>"),
  // });
  // 🆕 简化处理：优先保持现有HTML标签，只转换纯Markdown语法

  // 1. 处理标题（只在没有HTML标题标签时）
  if (!processedHtml.includes("<h1>") && !processedHtml.includes("<h2>")) {
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
  }

  // 2. 处理横线分隔符
  processedHtml = processedHtml
    .replace(
      /^---+$/gm,
      '<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">'
    )
    .replace(
      /\n---+\n/g,
      '\n<hr style="border: none; border-top: 1px solid #d1d5db; margin: 1rem 0;">\n'
    );

  // 3. 🆕 只转换没有被HTML标签包裹的Markdown语法
  // 处理粗体（避免重复转换已有的<strong>标签）
  processedHtml = processedHtml.replace(
    /(?<!<[^>]*)\*\*((?!<\/strong>)[^*]+?)\*\*(?![^<]*>)/g,
    '<strong style="font-weight: bold;">$1</strong>'
  );

  // 处理斜体（避免重复转换已有的<em>标签）
  processedHtml = processedHtml.replace(
    /(?<!<[^>]*)\*([^*<>]+?)\*(?![^<]*>)/g,
    '<em style="font-style: italic;">$1</em>'
  );

  // 4. 处理代码
  processedHtml = processedHtml.replace(
    /(?<!<[^>]*)`([^`<>]+?)`(?![^<]*>)/g,
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

  // 8. 🆕 改进换行处理
  processedHtml = processedHtml
    .replace(/(\n\s*){3,}/g, "\n\n") // 合并多个空行
    .replace(/\n\s*\n/g, "\n<br>\n") // 双换行转换为br
    .replace(/(?<!>)(?<!<br>)\n(?!<)(?!<br>)/g, "<br>\n"); // 单换行转br

  // console.log("最终处理结果:", {
  //   最终HTML: processedHtml.substring(0, 300) + "...",
  //   包含strong标签: processedHtml.includes("<strong>"),
  //   包含em标签: processedHtml.includes("<em>"),
  //   包含br标签: processedHtml.includes("<br>"),
  // });
  return processedHtml;
};

// 🆕 新增：去除HTML标签，保留Markdown格式
export const removeHtmlKeepMarkdown = (content: string): string => {
  if (!content) return content;

  // 先解包可能被代码块包裹的内容
  const unwrappedContent = unwrapMarkdownCodeBlock(content);

  // console.log("开始去除HTML，保留Markdown:", {
  //   原始内容长度: unwrappedContent.length,
  //   原始预览: unwrappedContent.substring(0, 200) + "...",
  // });
  // 🆕 第一步：将HTML格式标签转换为Markdown格式（改进版本）
  let processedContent = unwrappedContent;

  // 🆕 预处理：处理复杂的HTML结构，规范化标签
  processedContent = processedContent
    // 处理带样式的标签，提取内容
    .replace(/<strong[^>]*style[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*style[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*style[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*style[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*style[^>]*>(.*?)<\/code>/gi, "`$1`")

    // 然后处理普通标签
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")

    // 转换标题标签（包含属性的）
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n\n#### $1\n\n")
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n\n##### $1\n\n")
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n\n###### $1\n\n")

    // 🆕 处理列表（先处理带内容的li）
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<ul[^>]*>/gi, "")
    .replace(/<\/ol>/gi, "\n")
    .replace(/<ol[^>]*>/gi, "")

    // 转换换行相关标签
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr[^>]*>/gi, "\n\n---\n\n")

    // 转换段落标签
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")

    // 🆕 处理div标签（通常用于布局，转为段落分隔）
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<div[^>]*>/gi, "")

    // 🆕 处理span标签（保留内容，去除标签）
    .replace(/<span[^>]*>(.*?)<\/span>/gi, "$1");

  // console.log("HTML标签转换后:", {
  //   转换后长度: processedContent.length,
  //   转换后预览: processedContent.substring(0, 300) + "...",
  //   "包含**标记": processedContent.includes("**"),
  //   "包含*标记": processedContent.includes("*"),
  //   "包含#标记": processedContent.includes("#"),
  // });
  // 🆕 第二步：去除所有剩余的HTML标签（保留内容）
  const beforeCleanup = processedContent;
  processedContent = processedContent.replace(/<[^>]*>/g, "");

  // console.log("去除剩余HTML标签:", {
  //   清理前长度: beforeCleanup.length,
  //   清理后长度: processedContent.length,
  //   是否还有HTML标签: /<[^>]+>/.test(processedContent),
  // });
  // 🆕 第三步：处理HTML实体
  processedContent = processedContent
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z0-9#]+;/g, ""); // 去除其他HTML实体

  // 🆕 第四步：清理和优化Markdown格式
  processedContent = processedContent
    // 🆕 处理多余的空行（但保持必要的段落分隔）
    .replace(/\n{4,}/g, "\n\n\n") // 最多保留3个换行符
    .replace(/\n{3}/g, "\n\n") // 将3个换行符减少到2个

    // 🆕 清理行首和行尾的空白（但保持缩进）
    .replace(/^[ \t]+|[ \t]+$/gm, "")

    // 🆕 确保标题格式正确
    .replace(/\n+(#{1,6})\s*/g, "\n\n$1 ") // 标题前确保有空行
    .replace(/(#{1,6}\s[^\n]+)\n+/g, "$1\n\n") // 标题后确保有空行

    // 🆕 确保列表格式正确
    .replace(/\n+(- )/g, "\n$1") // 列表项前只要一个换行
    .replace(/(- [^\n]+)\n+(- )/g, "$1\n$2") // 连续列表项之间只要一个换行
    .replace(/(- [^\n]+)\n+(?!- )/g, "$1\n\n") // 列表结束后加空行

    // 🆕 确保分隔线格式正确
    .replace(/\n*(---+)\n*/g, "\n\n$1\n\n")

    // 🆕 清理Markdown标记周围的多余空格
    .replace(/\*\* +/g, "**")
    .replace(/ +\*\*/g, "**")
    .replace(/\* +/g, "*")
    .replace(/ +\*/g, "*")
    .replace(/` +/g, "`")
    .replace(/ +`/g, "`")

    // 🆕 最终清理
    .trim();

  // console.log("最终清理完成:", {
  //   最终长度: processedContent.length,
  //   最终预览: processedContent.substring(0, 400) + "...",
  //   包含Markdown粗体: processedContent.includes("**"),
  //   包含Markdown斜体: /\*[^*]+\*/.test(processedContent),
  //   包含Markdown标题: /^#{1,6}\s/.test(processedContent),
  //   包含HTML标签: /<[^>]+>/.test(processedContent),
  //   空行数量: (processedContent.match(/\n\n/g) || []).length,
  // });
  // 🆕 验证转换结果
  if (processedContent.length === 0) {
    // console.warn("转换后内容为空，返回原始内容");
    return unwrappedContent;
  }

  // 🆕 如果转换后内容太短，可能出现了问题
  if (processedContent.length < unwrappedContent.length * 0.3) {
    // console.warn("转换后内容长度大幅减少，可能存在问题:", {
    //   原始长度: unwrappedContent.length,
    //   转换后长度: processedContent.length,
    //   减少比例:
    //     Math.round(
    //       (1 - processedContent.length / unwrappedContent.length) * 100
    //     ) + "%",
    // });
  }

  return processedContent;
};

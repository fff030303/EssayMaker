import { Search, Globe, Brain, PenTool, Circle } from "lucide-react";
import { StepContentResult } from "../types";

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 添加一个辅助函数来创建StepContentResult对象
function createStepResult(data: Partial<StepContentResult>): StepContentResult {
  return {
    // 默认值
    isComplete: true,
    timestamp: new Date().toISOString(),
    content: "",
    // 覆盖默认值
    ...data,
  };
}

// 解析步骤内容
export function parseStepContent(step: string): StepContentResult {
  // 清理步骤内容，移除前导空白
  const cleanStep = step.trim();

  // 移除日志信息和时间戳的正则表达式
  const logPattern =
    /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3}\s*-\s*\d+\s*-\s*[^-]+-[^:]+:\d+\s*-\s*INFO:\s*/gm;

  // 提取时间戳和执行时间
  const timeMatch = cleanStep.match(/\[执行时间: ([\d.]+)秒\]/);
  const executionTime = timeMatch ? timeMatch[1] : null;

  // 保留原始格式，包括缩进
  const lines = cleanStep.split("\n").map((line) => {
    // 保留原始缩进
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";
    // 移除日志前缀但保留其他格式
    return indent + line.replace(logPattern, "");
  });

  const cleanStepContent = lines.join("\n");

  // 处理搜索结果
  if (cleanStep.includes("Search results") || cleanStep.includes("搜索结果")) {
    // 移除转义字符
    let searchContent = cleanStep.replace(/\\n/g, "\n");

    // 提取搜索查询
    const queryMatch = searchContent.match(/搜索:\s*([^\n]+)/);
    const query = queryMatch ? queryMatch[1] : "";

    // 分割搜索结果
    const results = searchContent.split("---").filter(Boolean);

    // 格式化每个结果
    const formattedResults = results.map((result) => {
      const lines = result.trim().split("\n").filter(Boolean);
      return lines
        .map((line, index) => {
          // 保持标题格式
          if (line.startsWith("#")) return line;
          // 保持链接格式
          if (line.startsWith(">")) return line;
          // 其他内容添加缩进
          return `  ${line}`;
        })
        .join("\n");
    });

    // 组合最终内容
    const finalContent = [
      `### 搜索相关资料`,
      ``,
      `查询: ${query}`,
      ``,
      ...formattedResults,
    ].join("\n");

    return createStepResult({
      type: "search",
      title: "搜索相关资料",
      content: finalContent,
    });
  }

  // 处理网页内容
  if (
    cleanStep.includes("读取网页详细内容") ||
    cleanStep.includes("# 📄 页面摘要") ||
    cleanStep.startsWith("content='#") ||
    cleanStep.includes('content="#') ||
    (cleanStep.includes("content='") && cleanStep.includes("https://")) ||
    (cleanStep.includes('content="') && cleanStep.includes("https://"))
  ) {
    // 检查是否是执行时间日志
    if (cleanStep.includes("[执行时间:") && !cleanStep.includes("页面内容")) {
      return createStepResult({
        type: "system",
        title: "系统信息",
        content: cleanStep,
      });
    }

    // 移除转义字符
    let webContent = cleanStep.replace(/\\n/g, "\n");

    // 清理技术信息
    webContent = webContent
      .replace(/content=['"]([^'"]+)['"]/, "$1")
      .replace(/name=['"][^'"]*['"]/, "")
      .replace(/tool_call_id=['"][^'"]*['"]/, "")
      .trim();

    // 提取URL和标题
    const urlMatch = webContent.match(/(?:🔗\s*\[?|https:\/\/)([^\]\n\s]+)/);

    // 统一标题提取逻辑
    let title = "网页内容";
    const titleMatch = webContent.match(/Title:\s*([^\n]+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      const headingMatch = webContent.match(/^#\s+([^\n]+)/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
    }

    // 格式化内容
    const formattedLines = webContent
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        // 保持标题格式
        if (line.startsWith("#")) return line;
        // 保持链接格式
        if (line.includes("🔗") || line.includes("https://")) {
          if (urlMatch) {
            return `> 🔗 ${urlMatch[1]}`;
          }
          return line;
        }
        // 处理标题行
        if (line.includes("Title:") || line.includes("|")) {
          if (titleMatch) {
            return `### ${titleMatch[1]}`;
          }
          return line;
        }
        // 移除重复的URL Source行
        if (line.includes("URL Source:")) {
          return "";
        }
        // 其他内容添加缩进
        return line.startsWith(">") ? line : `  ${line}`;
      })
      .filter(Boolean);

    // 组合最终内容
    const finalContent = [`### 网页内容摘要`, ``, ...formattedLines].join("\n");

    // 创建预览内容 - 取前500个字符
    const previewContent = finalContent.substring(0, 500) + "...";

    return createStepResult({
      type: "web",
      title: title,
      content: previewContent,
      details: finalContent,
    });
  }

  // 处理生成内容
  if (
    cleanStep.includes("生成内容完成") ||
    cleanStep.includes("生成内容:") ||
    cleanStep.includes("已生成") ||
    cleanStep.includes("生成完成") ||
    cleanStep.includes("---FULL_CONTENT---") ||
    (cleanStep.includes("生成内容") && !cleanStep.includes("开始生成内容"))
  ) {
    // 尝试提取完整内容
    const fullContentMatch = cleanStep.match(
      /---FULL_CONTENT---\n([\s\S]*?)\n---END_CONTENT---/
    );
    const previewMatch = cleanStep.match(/生成内容预览: (.*?)\.{3}/);

    // 如果没有预览内容，尝试从完整内容中提取预览
    return createStepResult({
      type: "generation",
      title: "生成内容",
      content: previewMatch
        ? previewMatch[1] + "..."
        : fullContentMatch
        ? fullContentMatch[1].substring(0, 500) + "..."
        : cleanStep.substring(0, 100) + (cleanStep.length > 100 ? "..." : ""),
      details: fullContentMatch ? fullContentMatch[1] : cleanStep,
    });
  }

  // 处理分析步骤
  if (cleanStep.includes("分析") || cleanStep.includes("开始新阶段")) {
    // 检查是否包含嵌入的内容（格式：---CONTENT---\n内容）
    const contentMatch = cleanStep.match(
      /---CONTENT---\n([\s\S]*?)(?:\n---END_CONTENT---|$)/
    );

    // 如果有嵌入内容，从步骤内容中移除它
    let cleanedStepContent = cleanStep;
    if (contentMatch) {
      cleanedStepContent = cleanStep.replace(
        /\n---CONTENT---\n[\s\S]*?(?:\n---END_CONTENT---|$)/,
        ""
      );
    }

    // 处理嵌入内容中可能的重复问题
    let details = contentMatch ? contentMatch[1] : undefined;
    if (details && details.length > 500) {
      // 检测重复内容
      const halfLength = Math.floor(details.length / 2);
      const firstHalf = details.substring(0, halfLength);
      const secondHalf = details.substring(halfLength);

      // 如果内容后半部分与前半部分高度重复（超过70%相似），则只使用前半部分
      if (firstHalf.length > 100) {
        // 计算前半部分的前80%内容
        const firstPartSignature = firstHalf.substring(
          0,
          Math.floor(firstHalf.length * 0.8)
        );

        // 检查后半部分是否包含这个签名内容
        if (secondHalf.includes(firstPartSignature)) {
          details = firstHalf;
        }
      }
    }

    return createStepResult({
      type: "analysis",
      title: cleanStep.split("\n")[0].trim(),
      content: cleanedStepContent,
      // 如果有嵌入内容，则提供详细内容
      details: details,
    });
  }

  // 处理系统信息（如token使用情况）
  if (
    cleanStep.includes("token_usage") ||
    cleanStep.includes("system_fingerprint")
  ) {
    return createStepResult({
      type: "system",
      title: "系统信息",
      content: cleanStep,
    });
  }

  // 处理工具消息
  if (cleanStep.includes("ToolMessage") || cleanStep.includes("tool_call_id")) {
    // 提取消息内容
    const contentMatch = cleanStep.match(/content='([^']+)'/);
    const nameMatch = cleanStep.match(/name='([^']+)'/);

    if (contentMatch && nameMatch) {
      const content = contentMatch[1];
      const name = nameMatch[1];

      // 格式化工具名称
      const formattedName = name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // 组合最终内容
      const finalContent = [
        `### 工具执行`,
        ``,
        `工具: ${formattedName}`,
        `执行结果: ${content}`,
      ].join("\n");

      return createStepResult({
        type: "tool",
        title: formattedName,
        content: finalContent,
      });
    }
  }

  // 默认情况
  return createStepResult({
    type: "default",
    title: cleanStep.split("\n")[0] || "步骤",
    content: cleanStep,
  });
}

// 获取步骤图标
export function getStepIcon(type: string) {
  switch (type) {
    case "search":
      return <Search className="h-4 w-4 text-blue-500" />;
    case "web":
      return <Globe className="h-4 w-4 text-green-500" />;
    case "analysis":
      return <Brain className="h-4 w-4 text-purple-500" />;
    case "generation":
      return <PenTool className="h-4 w-4 text-orange-500" />;
    case "default":
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
}

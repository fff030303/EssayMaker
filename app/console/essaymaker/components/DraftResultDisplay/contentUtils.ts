/**
 * 内容解析工具函数
 * 负责解析和处理多段内容
 */

// 内容类型接口
export interface ContentSegment {
  content_type: "reasoning" | "resume" | "default";
  content: string;
  isComplete?: boolean;
}

/**
 * 解析多段内容的函数
 * 处理混合格式：reasoning是JSON行，resume是纯文本
 */
export const parseMultiSegmentContent = (content: string): ContentSegment[] => {
  if (!content) return [];

  // 🆕 处理混合格式：reasoning是JSON行，resume是纯文本
  const trimmedContent = content.trim();
  const lines = trimmedContent.split("\n");

  // 检查是否包含reasoning类型的JSON行
  const reasoningLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      (trimmed.startsWith("data: {") || trimmed.startsWith("{")) &&
      trimmed.includes('"content_type": "reasoning"')
    );
  });

  // 如果没有reasoning行，说明是纯文本内容
  if (reasoningLines.length === 0) {
    // console.log("检测到纯文本内容（无reasoning），不进行JSON解析");
    return [
      {
        content_type: "default",
        content: content,
        isComplete: false,
      },
    ];
  }

  // console.log("检测到包含reasoning的混合格式，开始解析:", {
  //   reasoningLines: reasoningLines.length,
  //   totalLines: lines.length,
  // });
  // 🆕 分离reasoning（JSON格式）和其他内容（纯文本）
  const segments: ContentSegment[] = [];
  let nonReasoningContent = "";

  for (const line of lines) {
    let trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // 🆕 处理SSE格式的'data: '前缀
    if (trimmedLine.startsWith("data: ")) {
      trimmedLine = trimmedLine.substring(6);
    }

    // 跳过SSE的其他控制消息
    if (
      trimmedLine === "" ||
      trimmedLine.startsWith("event:") ||
      trimmedLine.startsWith("id:")
    ) {
      continue;
    }

    // 🆕 检查是否是reasoning的JSON行
    if (
      trimmedLine.startsWith("{") &&
      trimmedLine.includes('"content_type": "reasoning"')
    ) {
      try {
        const parsed = JSON.parse(trimmedLine);

        if (
          parsed.type === "content" &&
          parsed.content_type === "reasoning" &&
          parsed.content
        ) {
          segments.push({
            content_type: "reasoning",
            content: parsed.content || "",
            isComplete: parsed.isComplete,
          });
          continue;
        }

        // 处理简化格式
        if (parsed.content_type === "reasoning" && parsed.content) {
          segments.push({
            content_type: "reasoning",
            content: parsed.content || "",
            isComplete: parsed.isComplete,
          });
          continue;
        }
      } catch (e) {
        // console.log(
        //   "reasoning JSON解析失败:",
        //   trimmedLine.substring(0, 50) + "..."
        // );
        // 解析失败，当作普通文本处理
        nonReasoningContent += line + "\n";
      }
    } else {
      // 🆕 非reasoning行，直接添加到普通内容中
      nonReasoningContent += line + "\n";
    }
  }

  // 🆕 如果有非reasoning内容，添加为default类型段落
  if (nonReasoningContent.trim()) {
    segments.push({
      content_type: "default",
      content: nonReasoningContent.trim(),
      isComplete: false,
    });
  }

  // console.log("成功解析混合格式内容:", {
  //   reasoningSegments: segments.filter((s) => s.content_type === "reasoning")
  //     .length,
  //   defaultSegments: segments.filter((s) => s.content_type === "default")
  //     .length,
  //   segments: segments.map((s) => ({
  //     type: s.content_type,
  //     length: s.content.length,
  //   })),
  // });

  return segments;
};

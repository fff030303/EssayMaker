import { useState, useCallback } from "react";
import { DisplayResult } from "../types";

export interface StreamOptions {
  onUpdate?: (result: DisplayResult) => void;
  onComplete?: (result: DisplayResult) => void;
  onError?: (error: Error) => void;
  charDelay?: number; // 每个字符的延迟时间（毫秒）
  initialDelay?: number; // 开始生成前的延迟时间（毫秒）
  realTimeStreaming?: boolean; // 是否启用真正的实时流式生成
  realtimeTypewriter?: boolean; // 是否启用实时接收+逐字显示模式
}

export function useStreamResponse() {
  const [isStreaming, setIsStreaming] = useState(false);

  // 逐字生成函数
  const typewriterEffect = useCallback(
    async (
      fullContent: string,
      result: DisplayResult,
      onUpdate: (result: DisplayResult) => void,
      charDelay: number = 50
    ) => {
      let displayedContent = "";

      for (let i = 0; i < fullContent.length; i++) {
        displayedContent += fullContent[i];

        const updatedResult = {
          ...result,
          content: displayedContent,
          currentStep:
            i === fullContent.length - 1 ? undefined : "正在生成内容...",
          isComplete: i === fullContent.length - 1,
        };

        onUpdate(updatedResult);

        // 如果不是最后一个字符，等待指定时间
        if (i < fullContent.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, charDelay));
        }
      }
    },
    []
  );

  // 实时逐字显示函数
  const realtimeTypewriterEffect = useCallback(
    async (
      contentQueue: string[],
      result: DisplayResult,
      onUpdate: (result: DisplayResult) => void,
      charDelay: number = 30
    ) => {
      let displayedContent = "";
      let queueIndex = 0;
      let charIndex = 0;

      const displayNextChar = () => {
        // 如果当前队列项已显示完，移动到下一项
        if (queueIndex < contentQueue.length) {
          const currentContent = contentQueue[queueIndex];

          if (charIndex < currentContent.length) {
            displayedContent += currentContent[charIndex];
            charIndex++;

            const updatedResult = {
              ...result,
              content: displayedContent,
              currentStep: "正在生成内容...",
              isComplete: false,
            };

            onUpdate(updatedResult);

            // 继续显示下一个字符
            setTimeout(displayNextChar, charDelay);
          } else {
            // 当前内容显示完，移动到下一个
            queueIndex++;
            charIndex = 0;

            // 如果还有更多内容，继续显示
            if (queueIndex < contentQueue.length) {
              setTimeout(displayNextChar, charDelay);
            }
          }
        }
      };

      // 开始显示
      displayNextChar();
    },
    []
  );

  const processStream = useCallback(
    async (
      stream: ReadableStream<Uint8Array>,
      options: StreamOptions = {}
    ): Promise<DisplayResult> => {
      const {
        onUpdate,
        onComplete,
        onError,
        charDelay = 50,
        initialDelay = 2000,
        realTimeStreaming = false,
        realtimeTypewriter = false,
      } = options;

      setIsStreaming(true);

      try {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let currentStep = "正在接收数据...";

        // 初始化结果对象
        let result: DisplayResult = {
          content: "",
          timestamp: new Date().toISOString(),
          steps: [],
          currentStep,
          isComplete: false,
        };

        // 如果启用实时接收+逐字显示模式
        if (realtimeTypewriter) {
          let isStreamComplete = false;

          // 立即显示初始状态 (empty or initial message)
          onUpdate?.(result);

          // 处理流式数据并在完成时调用onComplete
          const processStreamData = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                isStreamComplete = true;
                break;
              }

              const chunkText = decoder.decode(value, { stream: true });
              buffer += chunkText;

              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep the last partial line in buffer

              let contentReceivedThisIteration = false;
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const data = JSON.parse(line);
                    if (data.type === "content" && data.content) {
                      // 🆕 精确控制：只对reasoning保留JSON，resume提取纯文本
                      if (data.content_type === 'reasoning') {
                        // reasoning类型：保留完整JSON结构，供ReasoningCard解析
                        accumulatedContent += line + "\n";
                      } else {
                        // resume类型或其他类型：只提取纯文本内容，确保格式正确
                        accumulatedContent += data.content;
                      }
                      contentReceivedThisIteration = true;
                    } else if (data.type === "step") {
                      currentStep = data.step || currentStep;
                    } else if (data.type === "complete") {
                      isStreamComplete = true;
                    }
                  } catch (jsonError) {
                    if (line.startsWith("data: ")) {
                      try {
                        const jsonStr = line.slice(6);
                        const data = JSON.parse(jsonStr);
                        // 🆕 精确控制：只对reasoning保留JSON，resume提取纯文本
                        if (data.type === "content" && data.content) {
                          if (data.content_type === 'reasoning') {
                            // reasoning类型：保留完整JSON结构，供ReasoningCard解析
                            accumulatedContent += line + "\n";
                          } else {
                            // resume类型或其他类型：只提取纯文本内容，确保格式正确
                            accumulatedContent += data.content;
                          }
                          contentReceivedThisIteration = true;
                        }
                      } catch (sseError) {
                        console.error("解析SSE数据失败:", sseError);
                      }
                    } else {
                      // 🆕 只有确实不是JSON格式的内容才当作普通文本处理
                      if (!line.includes('"content_type"') && !line.includes('"type": "content"')) {
                        accumulatedContent += line + "\n";
                        contentReceivedThisIteration = true;
                      } else {
                        console.log("跳过无法解析的JSON行:", line.substring(0, 50) + "...");
                      }
                    }
                  }
                }
              }

              // If new content was accumulated in this read iteration, or if a step changed,
              // call onUpdate with the current state.
              if (contentReceivedThisIteration || isStreamComplete) {
                result = {
                  ...result,
                  content: accumulatedContent,
                  currentStep: isStreamComplete
                    ? result.currentStep === "正在接收数据..." ||
                      result.currentStep === "正在生成内容..."
                      ? undefined
                      : result.currentStep
                    : "正在生成内容...", // Or a more dynamic step
                  isComplete: isStreamComplete,
                };
                onUpdate?.(result);
              }
              if (isStreamComplete) break; // Break outer loop if complete message received
            }

            // Final update after the loop to ensure completion state is propagated
            const finalResultState: DisplayResult = {
              ...result, // Use the latest result state
              content: accumulatedContent,
              isComplete: true,
              currentStep: undefined, // Or a specific "Completed" step
            };

            // 🆕 立即调用 onComplete 回调
            onComplete?.(finalResultState);
            return finalResultState;
          };

          // 立即开始处理并返回Promise
          return processStreamData();
        }
        // 如果启用实时流式生成
        else if (realTimeStreaming) {
          // 立即显示初始状态
          onUpdate?.(result);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解码二进制数据为文本
            const chunkText = decoder.decode(value, { stream: true });
            buffer += chunkText;

            // 尝试解析流式数据
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  // 尝试解析JSON格式
                  const data = JSON.parse(line);

                  switch (data.type) {
                    case "content":
                      if (data.content) {
                        accumulatedContent += data.content;
                        result = {
                          ...result,
                          content: accumulatedContent,
                          currentStep: data.step || "正在生成内容...",
                        };
                        // 实时更新UI
                        onUpdate?.(result);
                      }
                      break;

                    case "step":
                      currentStep = data.step || currentStep;
                      result = {
                        ...result,
                        currentStep,
                      };
                      onUpdate?.(result);
                      break;

                    case "complete":
                      result = {
                        ...result,
                        isComplete: true,
                        currentStep: undefined,
                      };
                      onUpdate?.(result);
                      break;
                  }
                } catch (jsonError) {
                  // 如果不是JSON格式，尝试解析SSE格式
                  if (line.startsWith("data: ")) {
                    try {
                      const jsonStr = line.slice(6);
                      const data = JSON.parse(jsonStr);

                      if (data.type === "content" && data.content) {
                        accumulatedContent += data.content;
                        result = {
                          ...result,
                          content: accumulatedContent,
                          currentStep: "正在生成内容...",
                        };
                        // 实时更新UI
                        onUpdate?.(result);
                      }
                    } catch (sseError) {
                      console.error("解析SSE数据失败:", sseError);
                    }
                  } else {
                    // 直接当作纯文本内容处理
                    accumulatedContent += line;
                    result = {
                      ...result,
                      content: accumulatedContent,
                    };
                    // 实时更新UI
                    onUpdate?.(result);
                  }
                }
              }
            }
          }

          // 确保最终状态为完成
          const finalResult: DisplayResult = {
            ...result,
            isComplete: true,
            currentStep: undefined,
          };

          onComplete?.(finalResult);
          return finalResult;
        } else {
          // 原有的延迟逐字生成逻辑
          let fullContent = "";

          // 先显示接收数据状态
          onUpdate?.(result);

          // 第一阶段：收集所有数据
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解码二进制数据为文本
            const chunkText = decoder.decode(value, { stream: true });
            buffer += chunkText;

            // 尝试解析JSON格式的流式数据
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  // 尝试解析JSON格式
                  const data = JSON.parse(line);

                  switch (data.type) {
                    case "content":
                      if (data.content) {
                        fullContent += data.content;
                      }
                      break;

                    case "step":
                      currentStep = data.step || currentStep;
                      break;

                    case "complete":
                      // 数据接收完成，但还不开始显示
                      break;
                  }
                } catch (jsonError) {
                  // 如果不是JSON格式，尝试解析SSE格式
                  if (line.startsWith("data: ")) {
                    try {
                      const jsonStr = line.slice(6);
                      const data = JSON.parse(jsonStr);

                      if (data.type === "content" && data.content) {
                        fullContent += data.content;
                      }
                    } catch (sseError) {
                      console.error("解析SSE数据失败:", sseError);
                    }
                  } else {
                    // 直接当作纯文本内容处理
                    fullContent += line;
                  }
                }
              }
            }
          }

          // 第二阶段：等待指定时间后开始逐字生成
          result = {
            ...result,
            currentStep: "准备生成内容...",
          };
          onUpdate?.(result);

          // 等待初始延迟
          await new Promise((resolve) => setTimeout(resolve, initialDelay));

          // 第三阶段：逐字生成内容
          if (fullContent) {
            await typewriterEffect(fullContent, result, onUpdate!, charDelay);
          }

          // 最终结果
          const finalResult: DisplayResult = {
            ...result,
            content: fullContent,
            isComplete: true,
            currentStep: undefined,
          };

          onComplete?.(finalResult);
          return finalResult;
        }
      } catch (error) {
        console.error("处理流式响应时出错:", error);
        const errorResult: DisplayResult = {
          content: "",
          timestamp: new Date().toISOString(),
          steps: [],
          currentStep: "生成失败",
          isComplete: true,
        };
        onError?.(error as Error);
        return errorResult;
      } finally {
        setIsStreaming(false);
      }
    },
    [typewriterEffect, realtimeTypewriterEffect]
  );

  return {
    processStream,
    isStreaming,
  };
}

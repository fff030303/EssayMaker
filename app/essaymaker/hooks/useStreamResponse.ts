import { useState, useCallback } from 'react';
import { DisplayResult } from '../types';

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
  const typewriterEffect = useCallback(async (
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
        currentStep: i === fullContent.length - 1 ? undefined : "正在生成内容...",
        isComplete: i === fullContent.length - 1,
      };
      
      onUpdate(updatedResult);
      
      // 如果不是最后一个字符，等待指定时间
      if (i < fullContent.length - 1) {
        await new Promise(resolve => setTimeout(resolve, charDelay));
      }
    }
  }, []);

  // 实时逐字显示函数
  const realtimeTypewriterEffect = useCallback(async (
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
  }, []);

  const processStream = useCallback(async (
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
      realtimeTypewriter = false
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
        const contentQueue: string[] = [];
        let displayedLength = 0;
        let isStreamComplete = false;
        
        // 立即显示初始状态
        onUpdate?.(result);

        // 启动显示循环
        const startTypewriter = () => {
          const displayNextChunk = () => {
            if (displayedLength < accumulatedContent.length) {
              // 计算要显示的下一个字符
              const nextChar = accumulatedContent[displayedLength];
              displayedLength++;
              
              result = {
                ...result,
                content: accumulatedContent.substring(0, displayedLength),
                currentStep: isStreamComplete && displayedLength >= accumulatedContent.length ? undefined : "正在生成内容...",
                isComplete: isStreamComplete && displayedLength >= accumulatedContent.length,
              };
              
              onUpdate?.(result);
              
              // 如果还有内容要显示，继续
              if (displayedLength < accumulatedContent.length || !isStreamComplete) {
                setTimeout(displayNextChunk, charDelay);
              } else if (isStreamComplete) {
                // 流式接收完成且显示完成
                onComplete?.(result);
              }
            } else if (!isStreamComplete) {
              // 等待更多内容
              setTimeout(displayNextChunk, charDelay);
            } else {
              // 完成
              onComplete?.(result);
            }
          };
          
          // 开始显示
          setTimeout(displayNextChunk, initialDelay);
        };

        // 启动显示
        startTypewriter();

        // 处理流式数据
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            isStreamComplete = true;
            break;
          }

          // 解码二进制数据为文本
          const chunkText = decoder.decode(value, { stream: true });
          buffer += chunkText;

          // 尝试解析流式数据
          const lines = buffer.split('\n');
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
                    }
                    break;
                    
                  case "step":
                    currentStep = data.step || currentStep;
                    break;
                    
                  case "complete":
                    isStreamComplete = true;
                    break;
                }
              } catch (jsonError) {
                // 如果不是JSON格式，尝试解析SSE格式
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6);
                    const data = JSON.parse(jsonStr);
                    
                    if (data.type === 'content' && data.content) {
                      accumulatedContent += data.content;
                    }
                  } catch (sseError) {
                    console.error('解析SSE数据失败:', sseError);
                  }
                } else {
                  // 直接当作纯文本内容处理
                  accumulatedContent += line;
                }
              }
            }
          }
        }

        // 等待显示完成
        return new Promise((resolve) => {
          const checkComplete = () => {
            if (displayedLength >= accumulatedContent.length && isStreamComplete) {
              resolve({
                ...result,
                content: accumulatedContent,
                isComplete: true,
                currentStep: undefined,
              });
            } else {
              setTimeout(checkComplete, 100);
            }
          };
          checkComplete();
        });
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
          const lines = buffer.split('\n');
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
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6);
                    const data = JSON.parse(jsonStr);
                    
                    if (data.type === 'content' && data.content) {
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
                    console.error('解析SSE数据失败:', sseError);
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
          const lines = buffer.split('\n');
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
                if (line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6);
                    const data = JSON.parse(jsonStr);
                    
                    if (data.type === 'content' && data.content) {
                      fullContent += data.content;
                    }
                  } catch (sseError) {
                    console.error('解析SSE数据失败:', sseError);
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
        await new Promise(resolve => setTimeout(resolve, initialDelay));

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
      console.error('处理流式响应时出错:', error);
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
  }, [typewriterEffect, realtimeTypewriterEffect]);

  return {
    processStream,
    isStreaming,
  };
} 
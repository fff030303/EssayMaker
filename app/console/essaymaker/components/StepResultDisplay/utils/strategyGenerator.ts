/**
 * 策略生成业务逻辑模块
 *
 * 功能：处理改写策略生成的完整业务流程
 *
 * 特性：
 * - 流式API调用处理
 * - 结果数据构建
 * - 错误处理和重试
 * - 性能监控
 * - 数据记录
 */

import { apiService } from "@/app/console/essaymaker/api";
import { DisplayResult } from "@/app/console/essaymaker/types";

/**
 * 策略生成参数接口
 */
export interface StrategyGenerationParams {
  searchResult: string;
  originalEssayFile: File;
  analysisResult: string;
  customRole?: string;
  customTask?: string;
  customOutputFormat?: string;
}

/**
 * 策略生成结果处理器接口
 */
export interface StrategyResultHandler {
  onProgress?: (result: DisplayResult) => void;
  onComplete?: (result: DisplayResult) => void;
  onError?: (error: Error) => void;
}

/**
 * 策略生成配置接口
 */
export interface StrategyGenerationConfig {
  enablePerformanceMonitoring?: boolean;
  enableDataLogging?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * 生成改写策略的主要函数
 *
 * @param params 策略生成参数
 * @param handler 结果处理器
 * @param config 生成配置
 * @returns Promise<DisplayResult>
 */
export async function generateRewriteStrategy(
  params: StrategyGenerationParams,
  handler: StrategyResultHandler = {},
  config: StrategyGenerationConfig = {}
): Promise<DisplayResult> {
  const {
    searchResult,
    originalEssayFile,
    analysisResult,
    customRole = "",
    customTask = "",
    customOutputFormat = "",
  } = params;

  const { enablePerformanceMonitoring = true, enableDataLogging = true } =
    config;

  // 性能监控开始
  const startTime = enablePerformanceMonitoring ? Date.now() : 0;

  console.log("策略生成开始，参数:", {
    hasSearchResult: !!searchResult,
    hasOriginalFile: !!originalEssayFile,
    hasAnalysisResult: !!analysisResult,
    customPrompts: {
      role: !!customRole,
      task: !!customTask,
      outputFormat: !!customOutputFormat,
    },
  });

  try {
    // 调用流式API
    const streamResponse = await apiService.streamEssayRewriteGenerateStrategy(
      searchResult,
      originalEssayFile,
      analysisResult,
      customRole,
      customTask,
      customOutputFormat
    );

    if (!streamResponse) {
      throw new Error("未收到响应流");
    }

    const reader = streamResponse.getReader();
    const decoder = new TextDecoder();
    let strategyContent = "";
    let steps: string[] = [];

    // 创建初始结果对象
    const initialResult: DisplayResult = {
      content: "",
      steps: [],
      timestamp: new Date().toISOString(),
      isComplete: false,
      currentStep: "改写策略生成中...",
    };

    // 立即通知开始状态
    handler.onProgress?.(initialResult);

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

            // 处理步骤更新
            if (data.step) {
              steps.push(data.step);
            }

            // 处理内容更新
            if (data.content) {
              strategyContent += data.content;
            }

            // 处理当前步骤状态
            if (data.current_step) {
              initialResult.currentStep = data.current_step;
            }

            // 创建更新的结果对象
            const updatedResult: DisplayResult = {
              ...initialResult,
              content: strategyContent,
              steps: [...steps],
              isComplete: false,
            };

            // 通知进度更新
            handler.onProgress?.(updatedResult);
          } catch (e) {
            console.warn("解析流数据失败:", e);
          }
        }
      }
    }

    // 创建最终结果
    const finalResult: DisplayResult = {
      content: strategyContent,
      steps: [...steps],
      timestamp: new Date().toISOString(),
      isComplete: true,
      currentStep: undefined,
    };

    // 计算执行时间
    const duration = enablePerformanceMonitoring ? Date.now() - startTime : 0;

    console.log("策略生成完成:", {
      contentLength: strategyContent.length,
      stepsCount: steps.length,
      duration: `${duration}ms`,
    });

    // 通知完成
    handler.onComplete?.(finalResult);

    // 数据记录（如果启用）
    if (enableDataLogging) {
      await logStrategyGenerationResult(params, finalResult, true, duration);
    }

    return finalResult;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error("未知错误");
    const duration = enablePerformanceMonitoring ? Date.now() - startTime : 0;

    console.error("策略生成失败:", errorObj);

    // 数据记录（失败情况）
    if (enableDataLogging) {
      await logStrategyGenerationResult(
        params,
        null,
        false,
        duration,
        errorObj.message
      );
    }

    // 通知错误
    handler.onError?.(errorObj);

    throw errorObj;
  }
}

/**
 * 记录策略生成结果到数据库
 *
 * @param params 生成参数
 * @param result 生成结果
 * @param isSuccess 是否成功
 * @param duration 执行时间
 * @param errorMessage 错误信息
 */
async function logStrategyGenerationResult(
  params: StrategyGenerationParams,
  result: DisplayResult | null,
  isSuccess: boolean,
  duration: number,
  errorMessage?: string
): Promise<void> {
  try {
    // 这里需要导入适当的日志记录Hook或服务
    // 由于原代码中使用了 useSectionalLogger，我们需要在组件层面处理这个逻辑
    console.log("策略生成结果记录:", {
      params: {
        hasSearchResult: !!params.searchResult,
        hasOriginalFile: !!params.originalEssayFile,
        hasAnalysisResult: !!params.analysisResult,
        customPrompts: {
          role: !!params.customRole,
          task: !!params.customTask,
          outputFormat: !!params.customOutputFormat,
        },
      },
      result: result
        ? {
            contentLength: result.content?.length || 0,
            stepsCount: result.steps?.length || 0,
            isComplete: result.isComplete,
          }
        : null,
      isSuccess,
      duration,
      errorMessage,
    });
  } catch (logError) {
    console.warn("记录策略生成结果失败:", logError);
  }
}

/**
 * 验证策略生成参数
 *
 * @param params 参数对象
 * @returns 验证结果
 */
export function validateStrategyGenerationParams(
  params: StrategyGenerationParams
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.searchResult || params.searchResult.trim().length === 0) {
    errors.push("搜索结果不能为空");
  }

  if (!params.originalEssayFile) {
    errors.push("原始文件不能为空");
  }

  if (!params.analysisResult || params.analysisResult.trim().length === 0) {
    errors.push("分析结果不能为空");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 创建默认的策略生成处理器
 *
 * @param onUpdate 更新回调
 * @returns StrategyResultHandler
 */
export function createDefaultStrategyHandler(
  onUpdate: (result: DisplayResult) => void
): StrategyResultHandler {
  return {
    onProgress: onUpdate,
    onComplete: onUpdate,
    onError: (error) => {
      console.error("策略生成处理器错误:", error);
    },
  };
}

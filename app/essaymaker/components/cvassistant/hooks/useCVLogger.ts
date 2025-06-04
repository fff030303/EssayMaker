import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

/**
 * CV助理日志记录Hook - 极简版
 *
 * 功能：记录CV助理的使用结果到数据库
 *
 * 核心特性：
 * 1. 结果记录：
 *    - 一次调用完成所有记录
 *    - 支持成功和失败状态
 *    - 记录请求元数据和结果数据
 *    - 自动计算处理耗时
 *
 * 2. 多种场景：
 *    - CV分析结果记录
 *    - 简历生成结果记录
 *    - 完整流程结果记录
 *    - 错误状态记录
 *
 * 3. 数据结构：
 *    - assistantType: CV_ASSISTANT
 *    - endpoint: 调用的API端点
 *    - requestMetadata: 请求相关的元数据
 *    - resultData: AI生成的结果内容
 *    - isSuccess: 成功/失败状态
 *    - duration: 处理耗时（毫秒）
 *    - errorMessage: 错误信息（如果有）
 *
 * 使用方法：
 * ```tsx
 * const { logAnalysisResult, logFormatResult, logCompleteResult } = useCVLogger();
 *
 * // 记录分析结果
 * await logAnalysisResult(requestData, result, isSuccess, duration, errorMessage);
 *
 * // 记录格式化结果
 * await logFormatResult(requestData, result, isSuccess, duration, errorMessage);
 *
 * // 记录完整结果
 * await logCompleteResult(requestData, result, isSuccess, duration, errorMessage);
 * ```
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

export function useCVLogger() {
  const { data: session } = useSession();
  const { toast } = useToast();

  /**
   * 通用的结果记录方法
   */
  const logResult = async (
    assistantType: "CV_ASSISTANT",
    endpoint: string,
    requestMetadata: any,
    resultData: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    try {
      // 检查用户是否已登录
      if (!session?.user?.email) {
        console.warn("[CVLogger] 用户未登录，跳过日志记录");
        return;
      }

      // 调用日志记录API
      const response = await fetch("/api/essaymaker/llm-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantType,
          endpoint,
          requestMetadata: requestMetadata || {},
          resultData: resultData || {},
          isSuccess,
          duration,
          errorMessage,
          name: session.user.name || "未知",
          unitName: (session.user as any)?.unitName || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`日志记录失败: ${response.status}`);
      }

      const result = await response.json();
      console.log("[CVLogger] 日志记录成功:", result.resultId);
    } catch (error) {
      console.error("[CVLogger] 日志记录失败:", error);
      // 日志记录失败不应影响主要功能，所以不抛出异常
    }
  };

  /**
   * 记录CV分析结果
   */
  const logAnalysisResult = async (
    requestData: any,
    result: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    // 构建文件名列表
    const fileNames = [];
    if (requestData.fileContent) {
      fileNames.push(requestData.fileContent);
    }
    if (requestData.supportFiles && requestData.supportFiles.length > 0) {
      fileNames.push(...requestData.supportFiles);
    }
    const fileContent = fileNames.length > 0 ? fileNames.join(", ") : "未上传";

    await logResult(
      "CV_ASSISTANT",
      "/api/essaymaker/analyze",
      {
        type: "analysis",
        fileContent: fileContent,
        supportFiles: requestData.supportFiles || [],
        customPrompt: requestData.customPrompt,
        timestamp: new Date().toISOString(),
      },
      {
        content: result?.content || "",
        currentStep: result?.currentStep || "",
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  /**
   * 记录简历格式化结果
   */
  const logFormatResult = async (
    requestData: any,
    result: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    await logResult(
      "CV_ASSISTANT",
      "/api/essaymaker/format-resume",
      {
        type: "format",
        rawResume: requestData.rawResume ? "已提供" : "未提供",
        customRolePrompt: requestData.customRolePrompt,
        customTaskPrompt: requestData.customTaskPrompt,
        customOutputFormatPrompt: requestData.customOutputFormatPrompt,
        timestamp: new Date().toISOString(),
      },
      {
        content: result?.content || "",
        currentStep: result?.currentStep || "",
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  /**
   * 记录完整CV助理使用结果
   */
  const logCompleteResult = async (
    requestData: any,
    result: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    await logResult(
      "CV_ASSISTANT",
      "/api/essaymaker/cv-complete",
      {
        type: "complete",
        hasFile: !!requestData.fileContent,
        analysisProvided: !!requestData.analysisResult,
        formatProvided: !!requestData.formatResult,
        timestamp: new Date().toISOString(),
      },
      {
        analysisContent: result?.analysisContent || "",
        formatContent: result?.formatContent || "",
        totalSteps: result?.totalSteps || 0,
        completedSteps: result?.completedSteps || 0,
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  return {
    logAnalysisResult,
    logFormatResult,
    logCompleteResult,
  };
}

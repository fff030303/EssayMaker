"use client";

import { useSession } from "next-auth/react";
// import { useToast } from "@/hooks/use-toast";
import { DisplayResult } from "../../../types";

// =================================================================
// 🔧 开发模式开关 - 通过注释控制认证
// =================================================================
// 注释下面这行 = 关闭认证（本地开发模式）
// 取消注释 = 开启认证（生产模式）
const ENABLE_AUTH_CHECK = true;
// =================================================================

// /**
//  * RL助理日志记录Hook - 推荐信助理专用
//  *
//  * 功能：记录推荐信助理的使用结果到数据库
//  *
//  * 核心特性：
//  * 1. 结果记录：
//  *    - 一次调用完成所有记录
//  *    - 支持成功和失败状态
//  *    - 记录请求元数据和结果数据
//  *    - 自动计算处理耗时
//  *
//  * 2. 多种场景：
//  *    - 推荐信分析结果记录
//  *    - 推荐信生成结果记录
//  *    - 完整流程结果记录
//  *    - 错误状态记录
//  *
//  * 3. 数据结构：
//  *    - assistantType: RL_ASSISTANT
//  *    - endpoint: 调用的API端点
//  *    - requestMetadata: 请求相关的元数据
//  *    - resultData: AI生成的结果内容
//  *    - isSuccess: 成功/失败状态
//  *    - duration: 处理耗时（毫秒）
//  *    - errorMessage: 错误信息（如果有）
//  *
//  * 使用方法：
//  * ```tsx
//  * const { logAnalysisResult, logFormatResult, logCompleteResult } = useRLLogger();
//  *
//  * // 记录分析结果
//  * await logAnalysisResult(requestData, result, isSuccess, duration, errorMessage);
//  *
//  * // 记录格式化结果
//  * await logFormatResult(requestData, result, isSuccess, duration, errorMessage);
//  *
//  * // 记录完整结果
//  * await logCompleteResult(requestData, result, isSuccess, duration, errorMessage);
//  * ```
//  *
//  * @author EssayMaker Team
//  * @version 1.0.0
//  */

export function useRLLogger() {
  const { data: session } = useSession();

  /**
   * 通用的结果记录方法
   */
  const logResult = async (
    assistantType: "RL_ASSISTANT",
    endpoint: string,
    requestMetadata: any,
    resultData: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    try {
      // 🔧 认证检查 - 可通过顶部开关控制
      if (ENABLE_AUTH_CHECK) {
        // 生产模式：检查用户是否已登录
        if (!session?.user?.email) {
          console.warn("[RLLogger] 用户未登录，跳过日志记录");
          return;
        }
      }

      // 获取用户信息（开发模式使用模拟数据）
      const userInfo =
        ENABLE_AUTH_CHECK && session?.user
          ? {
              email: session.user.email,
              name: session.user.name || "未知",
              unitName: (session.user as any)?.unitName || null,
            }
          : {
              email: "dev@local.test",
              name: "开发者",
              unitName: "本地开发",
            };

      console.log("[RLLogger] 开始记录日志:", {
        assistantType,
        endpoint,
        isSuccess,
        duration,
        userEmail: userInfo.email,
        mode: ENABLE_AUTH_CHECK ? "生产模式" : "开发模式",
      });

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
          name: userInfo.name,
          unitName: userInfo.unitName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`日志记录失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("[RLLogger] 日志记录成功:", result.resultId);
    } catch (error) {
      console.error("[RLLogger] 日志记录失败:", error);
      // 日志记录失败不应影响主要功能，所以不抛出异常
    }
  };

  /**
   * 记录推荐信分析结果
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
      fileNames.push(
        ...requestData.supportFiles.map((f: any) =>
          typeof f === "string" ? f : f.name || "Unknown"
        )
      );
    }
    const fileContent = fileNames.length > 0 ? fileNames.join(", ") : "未上传";

    await logResult(
      "RL_ASSISTANT",
      "/api/essaymaker/analyze",
      {
        type: "analysis",
        fileContent: fileContent,
        supportFiles: requestData.supportFiles || [],
        recommenderPosition: requestData.recommenderPosition,
        gender: requestData.gender,
        hasOtherRequirements: requestData.hasOtherRequirements,
        additionalRequirements: requestData.additionalRequirements,
        timestamp: new Date().toISOString(),
      },
      {
        content: result?.content || "",
        currentStep: result?.currentStep || "",
        writingRequirements: result?.writingRequirements || "",
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  /**
   * 记录推荐信格式化结果
   */
  const logFormatResult = async (
    requestData: any,
    result: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    await logResult(
      "RL_ASSISTANT",
      "/api/essaymaker/format-recommendation-letter",
      {
        type: "format",
        rawLetter: requestData.rawLetter ? "已提供" : "未提供",
        customRolePrompt: requestData.customRolePrompt,
        customTaskPrompt: requestData.customTaskPrompt,
        customOutputFormatPrompt: requestData.customOutputFormatPrompt,
        writingRequirements: requestData.writingRequirements,
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
   * 记录完整推荐信助理使用结果
   */
  const logCompleteResult = async (
    requestData: any,
    result: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    await logResult(
      "RL_ASSISTANT",
      "/api/essaymaker/rl-complete",
      {
        type: "complete",
        hasFile: !!requestData.fileContent,
        analysisProvided: !!requestData.analysisResult,
        formatProvided: !!requestData.formatResult,
        recommenderPosition: requestData.recommenderPosition,
        gender: requestData.gender,
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

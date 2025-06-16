"use client";

import { useSession } from "next-auth/react";
// import { useToast } from "@/hooks/use-toast";

// =================================================================
// 🔧 开发模式开关 - 通过注释控制认证
// =================================================================
// 注释下面这行 = 关闭认证（本地开发模式）
// 取消注释 = 开启认证（生产模式）
const ENABLE_AUTH_CHECK = true;
// =================================================================

// /**
//  * CV助理日志记录Hook - 极简版
//  *
//  * 功能：记录CV助理的使用结果到数据库
//  *
//  * 核心特性：
//  * 1. 结果记录：
//  *    - 一次调用完成所有记录
//  *    - 支持成功和失败状态
//  *    - 记录请求元数据和结果数据
//  *    - 自动计算处理耗时
//  *
//  * 2. 多种场景：
//  *    - CV分析结果记录
//  *    - 简历生成结果记录
//  *    - 完整流程结果记录
//  *    - 错误状态记录
//  *
//  * 3. 数据结构：
//  *    - assistantType: CV_ASSISTANT
//  *    - endpoint: 调用的API端点
//  *    - requestMetadata: 请求相关的元数据
//  *    - resultData: AI生成的结果内容
//  *    - isSuccess: 成功/失败状态
//  *    - duration: 处理耗时（毫秒）
//  *    - errorMessage: 错误信息（如果有）
//  *
//  * 使用方法：
//  * ```tsx
//  * const { logAnalysisResult, logFormatResult, logCompleteResult } = useCVLogger();
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

export function useCVLogger() {
  const { data: session } = useSession();

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
      // 🔧 认证检查 - 可通过顶部开关控制
      if (ENABLE_AUTH_CHECK) {
        // 生产模式：检查用户是否已登录
        if (!session?.user?.email) {
          // console.warn("[CVLogger] 用户未登录，跳过日志记录");
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

      // console.log("[CVLogger] 开始记录日志:", {
      //   assistantType,
      //   endpoint,
      //   isSuccess,
      //   duration,
      //   userEmail: userInfo.email,
      //   mode: ENABLE_AUTH_CHECK ? "生产模式" : "开发模式",
      // });
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
      // console.log("[CVLogger] 日志记录成功:", result.resultId);
    } catch (error) {
      // console.error("[CVLogger] 日志记录失败:", error);
      // 日志记录失败不应影响主要功能，所以不抛出异常
    }
  };

  /**
   * 过滤reasoning数据的辅助函数
   * 从结果数据中移除reasoning相关内容，只保留实际的简历内容
   */
  const filterReasoningData = (resultData: any) => {
    if (!resultData) return resultData;

    // 创建一个副本以避免修改原始数据
    const filteredData = { ...resultData };

    // 如果content包含reasoning数据，需要过滤
    if (filteredData.content && typeof filteredData.content === "string") {
      // 检查是否包含reasoning JSON数据
      const lines = filteredData.content.split("\n");
      const filteredLines = lines.filter((line: string) => {
        if (line.trim()) {
          try {
            // 🆕 处理 "data: {JSON}" 格式
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6); // 移除 "data: " 前缀
              const data = JSON.parse(jsonStr);
              // 过滤掉reasoning类型的数据
              return data.content_type !== "reasoning";
            }

            // 🆕 处理纯JSON格式
            const data = JSON.parse(line);
            // 过滤掉reasoning类型的数据
            return data.content_type !== "reasoning";
          } catch {
            // 如果不是JSON格式，保留该行
            return true;
          }
        }
        return true;
      });

      // 重新组合过滤后的内容
      filteredData.content = filteredLines.join("\n").trim();
    }

    // 移除其他可能包含reasoning数据的字段
    if (filteredData.reasoningSegments) {
      delete filteredData.reasoningSegments;
    }

    if (filteredData._reasoningData) {
      delete filteredData._reasoningData;
    }

    // console.log("[CVLogger] 过滤reasoning数据:", {
    //   原始内容长度: resultData.content?.length || 0,
    //   过滤后内容长度: filteredData.content?.length || 0,
    //   原始行数: resultData.content?.split("\n").length || 0,
    //   过滤后行数: filteredData.content?.split("\n").length || 0,
    //   已移除reasoning字段: ["reasoningSegments", "_reasoningData"].filter(
    //     (field) => resultData[field]
    //   ),
    // });
    return filteredData;
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

    // 🆕 过滤reasoning数据，只保留实际的简历内容
    const filteredResult = filterReasoningData(result);

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
        content: filteredResult?.content || "",
        currentStep: filteredResult?.currentStep || "",
        error: !isSuccess,
        // 🆕 添加标记表明已过滤reasoning数据
        _reasoningFiltered: true,
        _originalContentLength: result?.content?.length || 0,
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
    // 🆕 过滤reasoning数据，只保留实际的简历内容
    const filteredResult = filterReasoningData(result);

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
        content: filteredResult?.content || "",
        currentStep: filteredResult?.currentStep || "",
        error: !isSuccess,
        // 🆕 添加标记表明已过滤reasoning数据
        _reasoningFiltered: true,
        _originalContentLength: result?.content?.length || 0,
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

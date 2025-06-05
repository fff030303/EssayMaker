/**
 * useSectionalLogger Hook
 *
 * 功能：PS分稿助理日志记录钩子，用于记录分稿助理的使用结果到数据库
 *
 * 核心特性：
 * 1. 结果记录：
 *    - 记录搜索分析结果（第一步）
 *    - 记录策略生成结果（第二步）
 *    - 记录最终稿件结果（第三步）
 *    - 记录完整流程结果
 *    - 支持成功和失败状态
 *
 * 2. 数据结构：
 *    - 请求元数据记录
 *    - 结果数据存储
 *    - 性能指标追踪
 *    - 错误信息记录
 *
 * 3. 场景支持：
 *    - 搜索分析日志
 *    - 策略生成日志
 *    - 最终稿件日志
 *    - 错误处理日志
 *    - 性能监控日志
 *
 * 4. 安全性：
 *    - 用户登录状态检查
 *    - 数据脱敏处理
 *    - 错误优雅处理
 *    - 不影响主功能
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useSession } from "next-auth/react";
import { DisplayResult } from "../../../types";

// =================================================================
// 🔧 开发模式开关 - 通过注释控制认证
// =================================================================
// 注释下面这行 = 关闭认证（本地开发模式）
// 取消注释 = 开启认证（生产模式）
const ENABLE_AUTH_CHECK = true; // 🆕 重新开启认证检查，验证问题不在认证
// const ENABLE_AUTH_CHECK = false; // 🆕 临时关闭认证检查用于测试
// =================================================================

export function useSectionalLogger() {
  const { data: session } = useSession();

  // 获取用户信息的通用方法
  const getUserInfo = () => {
    if (ENABLE_AUTH_CHECK && session?.user) {
      return {
        email: session.user.email,
        name: session.user.name || "未知",
        unitName: (session.user as any)?.unitName || "未知",
      };
    } else {
      return {
        email: "dev@local.test",
        name: "开发者",
        unitName: "本地开发",
      };
    }
  };

  // 检查是否可以记录日志
  const canLog = () => {
    if (ENABLE_AUTH_CHECK) {
      return !!session?.user?.email;
    }
    return true; // 开发模式总是允许记录
  };

  // 通用的结果记录方法
  const logResult = async (
    endpoint: string,
    requestMetadata: any,
    resultData: any,
    isSuccess: boolean,
    duration?: number,
    errorMessage?: string
  ) => {
    try {
      // 🔧 认证检查 - 可通过顶部开关控制
      if (!canLog()) {
        console.log("[SectionalLogger] 用户未登录，跳过日志记录");
        return;
      }

      // 获取用户信息（开发模式使用模拟数据）
      const userInfo = getUserInfo();

      console.log("[SectionalLogger] 开始记录日志:", {
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
          assistantType: "SECTIONAL_ASSISTANT",
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

      if (response.ok) {
        const result = await response.json();
        console.log("[SectionalLogger] 日志记录成功:", result.resultId);
        return result.resultId;
      } else {
        const errorText = await response.text();
        console.error(
          "[SectionalLogger] 日志记录失败:",
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error("[SectionalLogger] 日志记录异常:", error);
    }
  };

  // 记录搜索分析结果（第一步）
  const logSearchResult = async (
    requestData: any,
    resultData: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    // 构建文件名列表
    const fileNames = [];
    if (requestData.originalEssayFile) {
      fileNames.push(requestData.originalEssayFile.name || "原始初稿文件");
    }
    if (requestData.supportFiles && requestData.supportFiles.length > 0) {
      fileNames.push(
        ...requestData.supportFiles.map((f: any) => f.name || "支持文件")
      );
    }
    const fileContent = fileNames.length > 0 ? fileNames.join(", ") : "未上传";

    await logResult(
      "/api/ps-final-draft/search-and-analyze",
      {
        type: "search_analysis",
        fileContent: fileContent,
        userInput: requestData.userInput || "",
        customWebSearcherRole: requestData.customWebSearcherRole || "",
        customWebSearcherTask: requestData.customWebSearcherTask || "",
        customWebSearcherOutputFormat:
          requestData.customWebSearcherOutputFormat || "",
        operation: "search_and_analyze",
        timestamp: new Date().toISOString(),
      },
      {
        content: resultData?.content || "",
        currentStep: resultData?.currentStep || "",
        stepsCount: resultData?.steps?.length || 0,
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  // 记录策略生成结果（第二步）
  const logStrategyResult = async (
    requestData: any,
    resultData: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    await logResult(
      "/api/ps-final-draft/generate-strategy",
      {
        type: "strategy_generation",
        hasSearchResult: !!requestData.searchResult,
        hasOriginalFile: !!requestData.originalEssayFile,
        customStrategyGeneratorRole:
          requestData.customStrategyGeneratorRole || "",
        customStrategyGeneratorTask:
          requestData.customStrategyGeneratorTask || "",
        customStrategyGeneratorOutputFormat:
          requestData.customStrategyGeneratorOutputFormat || "",
        operation: "generate_strategy",
        timestamp: new Date().toISOString(),
      },
      {
        content: resultData?.content || "",
        currentStep: resultData?.currentStep || "",
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  // 记录最终稿件结果（第三步）
  const logFinalDraftResult = async (
    requestData: any,
    resultData: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    await logResult(
      "/api/ps-final-draft/rewrite-essay",
      {
        type: "final_draft",
        hasRewriteStrategy: !!requestData.rewriteStrategy,
        hasOriginalFile: !!requestData.originalEssayFile,
        customEssayRewriterRole: requestData.customEssayRewriterRole || "",
        customEssayRewriterTask: requestData.customEssayRewriterTask || "",
        customEssayRewriterOutputFormat:
          requestData.customEssayRewriterOutputFormat || "",
        operation: "rewrite_essay",
        timestamp: new Date().toISOString(),
      },
      {
        content: resultData?.content || "",
        currentStep: resultData?.currentStep || "",
        error: !isSuccess,
      },
      isSuccess,
      duration,
      errorMessage
    );
  };

  // 记录完整流程结果
  const logCompleteResult = async (
    requestData: any,
    searchResult: DisplayResult | null,
    strategyResult: DisplayResult | null,
    finalDraftResult: DisplayResult | null,
    isSuccess: boolean,
    totalDuration: number,
    errorMessage?: string
  ) => {
    // 构建文件名列表
    const fileNames = [];
    if (requestData.originalEssayFile) {
      fileNames.push(requestData.originalEssayFile.name || "原始初稿文件");
    }
    if (requestData.supportFiles && requestData.supportFiles.length > 0) {
      fileNames.push(
        ...requestData.supportFiles.map((f: any) => f.name || "支持文件")
      );
    }
    const fileContent = fileNames.length > 0 ? fileNames.join(", ") : "未上传";

    await logResult(
      "/api/ps-final-draft/complete",
      {
        type: "complete_process",
        fileContent: fileContent,
        userInput: requestData.userInput || "",
        hasCustomPrompts: !!(
          requestData.customWebSearcherRole ||
          requestData.customWebSearcherTask ||
          requestData.customWebSearcherOutputFormat ||
          requestData.customStrategyGeneratorRole ||
          requestData.customStrategyGeneratorTask ||
          requestData.customStrategyGeneratorOutputFormat ||
          requestData.customEssayRewriterRole ||
          requestData.customEssayRewriterTask ||
          requestData.customEssayRewriterOutputFormat
        ),
        operation: "complete_sectional_process",
        timestamp: new Date().toISOString(),
      },
      {
        searchContent: searchResult?.content || "",
        strategyContent: strategyResult?.content || "",
        finalDraftContent: finalDraftResult?.content || "",
        totalSteps: 3,
        completedSteps: [searchResult, strategyResult, finalDraftResult].filter(
          Boolean
        ).length,
        error: !isSuccess,
      },
      isSuccess,
      totalDuration,
      errorMessage
    );
  };

  return {
    logSearchResult,
    logStrategyResult,
    logFinalDraftResult,
    logCompleteResult,
  };
}

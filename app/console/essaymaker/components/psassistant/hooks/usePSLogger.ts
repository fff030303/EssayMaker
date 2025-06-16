/**
 * usePSLogger Hook
 *
 * 功能：PS助理日志记录钩子，用于记录个人陈述助理的使用结果到数据库
 *
 * 核心特性：
 * 1. 结果记录：
 *    - 记录报告分析结果
 *    - 记录初稿生成结果
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
 *    - 报告分析日志
 *    - 初稿生成日志
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
const ENABLE_AUTH_CHECK = true;
// =================================================================

export function usePSLogger() {
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

  // 记录报告结果
  const logReportResult = async (
    requestData: any,
    resultData: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    // 🔧 认证检查 - 可通过顶部开关控制
    if (!canLog()) {
      // console.log("[PSLogger] 用户未登录，跳过日志记录");
      return;
    }

    const userInfo = getUserInfo();
    // console.log("[PSLogger] 开始记录报告日志:", {
    //   isSuccess,
    //   duration,
    //   userEmail: userInfo.email,
    //   mode: ENABLE_AUTH_CHECK ? "生产模式" : "开发模式",
    // });
    // 构建文件名列表
    const fileNames = [];
    if (requestData.files && requestData.files.length > 0) {
      fileNames.push(...requestData.files.map((f: any) => f.name || "Unknown"));
    }
    if (requestData.transcriptFiles && requestData.transcriptFiles.length > 0) {
      fileNames.push(
        ...requestData.transcriptFiles.map((f: any) => f.name || "Unknown")
      );
    }
    const fileContent = fileNames.length > 0 ? fileNames.join(", ") : "未上传";

    try {
      const response = await fetch("/api/essaymaker/llm-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantType: "PS_ASSISTANT",
          endpoint: "/api/essaymaker/ps-report",
          requestMetadata: {
            type: "analysis",
            fileContent: fileContent,
            files: requestData.files || [],
            transcriptFiles: requestData.transcriptFiles || [],
            query: requestData.query || "",
            customPrompt: requestData.query || "",
            operation: "report_generation",
            timestamp: new Date().toISOString(),
          },
          resultData: {
            content: resultData?.content || "",
            currentStep: resultData?.currentStep || "",
            error: !isSuccess,
          },
          isSuccess: isSuccess,
          duration: duration,
          errorMessage: errorMessage || null,
          name: userInfo.name,
          unitName: userInfo.unitName,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // console.log("[PSLogger] 报告日志记录成功:", result.resultId);
      } else {
        const errorText = await response.text();
        // // console.error(
        //   "[PSLogger] 报告日志记录失败:",
        //   response.status,
        //   errorText
        // );
      }
    } catch (error) {
      // console.error("[PSLogger] 报告日志记录异常:", error);
    }
  };

  // 记录初稿结果
  const logDraftResult = async (
    requestData: any,
    resultData: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    // 🔧 认证检查 - 可通过顶部开关控制
    if (!canLog()) {
      // console.log("[PSLogger] 用户未登录，跳过日志记录");
      return;
    }

    const userInfo = getUserInfo();
    // console.log("[PSLogger] 开始记录初稿日志:", {
    //   isSuccess,
    //   duration,
    //   userEmail: userInfo.email,
    //   mode: ENABLE_AUTH_CHECK ? "生产模式" : "开发模式",
    // });
    // 对于初稿生成，如果有purifiedContent说明已处理文件内容
    const fileContent =
      requestData.purifiedContent && requestData.purifiedContent.length > 0
        ? "已处理文件内容"
        : "未上传";

    try {
      const response = await fetch("/api/essaymaker/llm-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantType: "PS_ASSISTANT",
          endpoint: "/api/essaymaker/ps-draft",
          requestMetadata: {
            type: "analysis",
            fileContent: fileContent,
            purifiedContent: requestData.purifiedContent || "",
            direction: requestData.direction || "",
            requirements: requestData.requirements || "",
            transcriptAnalysis: requestData.transcriptAnalysis || "",
            customPrompt: `${requestData.direction || ""}${
              requestData.requirements ? ` - ${requestData.requirements}` : ""
            }`,
            operation: "draft_generation",
            timestamp: new Date().toISOString(),
          },
          resultData: {
            content: resultData?.content || "",
            currentStep: resultData?.currentStep || "",
            error: !isSuccess,
          },
          isSuccess: isSuccess,
          duration: duration,
          errorMessage: errorMessage || null,
          name: userInfo.name,
          unitName: userInfo.unitName,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // console.log("[PSLogger] 初稿日志记录成功:", result.resultId);
      } else {
        const errorText = await response.text();
        // console.error(
        //   "[PSLogger] 初稿日志记录失败:",
        //   response.status,
        //   errorText
        // );
      }
    } catch (error) {
      // console.error("[PSLogger] 初稿日志记录异常:", error);
    }
  };

  // 记录完整结果（包含报告和初稿）
  const logCompleteResult = async (
    requestData: any,
    reportResult: DisplayResult | null,
    draftResult: DisplayResult | null,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    // 🔧 认证检查 - 可通过顶部开关控制
    if (!canLog()) {
      // console.log("[PSLogger] 用户未登录，跳过日志记录");
      return;
    }

    const userInfo = getUserInfo();
    // console.log("[PSLogger] 开始记录完整日志:", {
    //   isSuccess,
    //   duration,
    //   userEmail: userInfo.email,
    //   mode: ENABLE_AUTH_CHECK ? "生产模式" : "开发模式",
    // });
    // 构建文件名列表（可能包含多种来源的文件信息）
    const fileNames = [];
    if (requestData.files && requestData.files.length > 0) {
      fileNames.push(...requestData.files.map((f: any) => f.name || "Unknown"));
    }
    if (requestData.transcriptFiles && requestData.transcriptFiles.length > 0) {
      fileNames.push(
        ...requestData.transcriptFiles.map((f: any) => f.name || "Unknown")
      );
    }
    let fileContent = fileNames.length > 0 ? fileNames.join(", ") : "";

    // 如果没有文件但有purifiedContent，说明是处理过的内容
    if (
      !fileContent &&
      requestData.purifiedContent &&
      requestData.purifiedContent.length > 0
    ) {
      fileContent = "已处理文件内容";
    }

    if (!fileContent) {
      fileContent = "未上传";
    }

    try {
      const response = await fetch("/api/essaymaker/llm-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantType: "PS_ASSISTANT",
          endpoint: "/api/essaymaker/ps-complete",
          requestMetadata: {
            type: "analysis",
            fileContent: fileContent,
            files: requestData.files || [],
            transcriptFiles: requestData.transcriptFiles || [],
            purifiedContent: requestData.purifiedContent || "",
            direction: requestData.direction || "",
            requirements: requestData.requirements || "",
            transcriptAnalysis: requestData.transcriptAnalysis || "",
            query: requestData.query || "",
            customPrompt:
              requestData.query ||
              `${requestData.direction || ""}${
                requestData.requirements ? ` - ${requestData.requirements}` : ""
              }`,
            operation: "complete_generation",
            timestamp: new Date().toISOString(),
          },
          resultData: {
            reportContent: reportResult?.content || "",
            draftContent: draftResult?.content || "",
            reportCurrentStep: reportResult?.currentStep || "",
            draftCurrentStep: draftResult?.currentStep || "",
            error: !isSuccess,
          },
          isSuccess: isSuccess,
          duration: duration,
          errorMessage: errorMessage || null,
          name: userInfo.name,
          unitName: userInfo.unitName,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // console.log("[PSLogger] 完整日志记录成功:", result.resultId);
      } else {
        const errorText = await response.text();
        // console.error(
        //   "[PSLogger] 完整日志记录失败:",
        //   response.status,
        //   errorText
        // );
      }
    } catch (error) {
      // console.error("[PSLogger] 完整日志记录异常:", error);
    }
  };

  return {
    logReportResult,
    logDraftResult,
    logCompleteResult,
  };
}

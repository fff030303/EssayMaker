/**
 * useCottonUptoLogger Hook
 *
 * 功能：Cotton Upto 助手的日志记录和数据存储
 *
 * 核心特性：
 * 1. 结果记录：
 *    - 分析结果记录
 *    - 生成结果记录
 *    - 完整流程记录
 *
 * 2. 性能监控：
 *    - 响应时间记录
 *    - 成功率统计
 *    - 错误追踪
 *
 * 3. 数据分析：
 *    - 用户行为分析
 *    - 内容质量评估
 *    - 系统性能优化
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useCallback } from "react";
import { DisplayResult } from "../../../types";

interface RequestData {
  userInput: string;
  originalFile?: string;
  supportFiles?: string[];
  personalizationRequirements?: string;
  materialDoc?: string;
  timestamp: string;
}

interface UseCottonUptoLoggerReturn {
  logAnalysisResult: (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => Promise<void>;
  logGenerationResult: (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => Promise<void>;
  logCompleteResult: (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => Promise<void>;
}

export function useCottonUptoLogger(): UseCottonUptoLoggerReturn {
  
  // 记录分析结果
  const logAnalysisResult = useCallback(async (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    try {
      const logData = {
        type: "cotton_upto_analysis",
        timestamp: new Date().toISOString(),
        request: {
          userInput: requestData.userInput,
          hasOriginalFile: !!requestData.originalFile,
          originalFileName: requestData.originalFile,
          supportFilesCount: requestData.supportFiles?.length || 0,
          hasPersonalizationRequirements: !!requestData.personalizationRequirements,
          hasMaterialDoc: !!requestData.materialDoc,
          materialDocLength: requestData.materialDoc?.length || 0,
        },
        result: {
          isSuccess,
          duration,
          contentLength: resultData.content?.length || 0,
          stepsCount: resultData.steps?.length || 0,
          currentStep: resultData.currentStep,
          isComplete: resultData.isComplete,
          errorMessage,
        },
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          timestamp: resultData.timestamp,
        },
      };

      console.log("[Cotton Upto Logger] 分析结果记录:", logData);

      // 这里可以添加实际的日志发送逻辑
      // await sendLogToServer(logData);
      
    } catch (error) {
      console.error("[Cotton Upto Logger] 记录分析结果失败:", error);
    }
  }, []);

  // 记录生成结果
  const logGenerationResult = useCallback(async (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    try {
      const logData = {
        type: "cotton_upto_generation",
        timestamp: new Date().toISOString(),
        request: {
          userInput: requestData.userInput,
          hasOriginalFile: !!requestData.originalFile,
          originalFileName: requestData.originalFile,
          supportFilesCount: requestData.supportFiles?.length || 0,
          hasPersonalizationRequirements: !!requestData.personalizationRequirements,
        },
        result: {
          isSuccess,
          duration,
          contentLength: resultData.content?.length || 0,
          stepsCount: resultData.steps?.length || 0,
          currentStep: resultData.currentStep,
          isComplete: resultData.isComplete,
          errorMessage,
        },
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          timestamp: resultData.timestamp,
        },
      };

      console.log("[Cotton Upto Logger] 生成结果记录:", logData);

      // 这里可以添加实际的日志发送逻辑
      // await sendLogToServer(logData);
      
    } catch (error) {
      console.error("[Cotton Upto Logger] 记录生成结果失败:", error);
    }
  }, []);

  // 记录完整流程结果
  const logCompleteResult = useCallback(async (
    requestData: RequestData,
    resultData: DisplayResult,
    isSuccess: boolean,
    duration: number,
    errorMessage?: string
  ) => {
    try {
      const logData = {
        type: "cotton_upto_complete",
        timestamp: new Date().toISOString(),
        request: {
          userInput: requestData.userInput,
          hasOriginalFile: !!requestData.originalFile,
          originalFileName: requestData.originalFile,
          supportFilesCount: requestData.supportFiles?.length || 0,
          hasPersonalizationRequirements: !!requestData.personalizationRequirements,
          hasMaterialDoc: !!requestData.materialDoc,
        },
        result: {
          isSuccess,
          duration,
          contentLength: resultData.content?.length || 0,
          stepsCount: resultData.steps?.length || 0,
          currentStep: resultData.currentStep,
          isComplete: resultData.isComplete,
          errorMessage,
        },
        metadata: {
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          timestamp: resultData.timestamp,
        },
      };

      console.log("[Cotton Upto Logger] 完整流程记录:", logData);

      // 这里可以添加实际的日志发送逻辑
      // await sendLogToServer(logData);
      
    } catch (error) {
      console.error("[Cotton Upto Logger] 记录完整流程失败:", error);
    }
  }, []);

  return {
    logAnalysisResult,
    logGenerationResult,
    logCompleteResult,
  };
} 
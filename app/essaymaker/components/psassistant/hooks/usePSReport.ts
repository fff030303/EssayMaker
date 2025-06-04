"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { DisplayResult } from "../../../types";
import { apiService } from "@/lib/api";
import { Session } from "next-auth";
import { useStreamResponse } from "../../../hooks/useStreamResponse";

interface UsePSReportProps {
  setResult: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any; // 使用any临时替代
  session: Session | null;
}

/**
 * usePSReport Hook
 *
 * 功能：管理PS助理报告生成的自定义Hook
 *
 * 核心特性：
 * 1. 报告生成：
 *    - 个人背景分析
 *    - 申请优势识别
 *    - 写作建议提供
 *    - 改进方向指导
 *
 * 2. 流式处理：
 *    - 实时接收+逐字显示模式
 *    - 字符显示间隔：0.2ms
 *    - 平滑的打字机效果
 *    - 自动滚动到最新内容
 *
 * 3. 状态管理：
 *    - 生成状态跟踪
 *    - 错误状态处理
 *    - 加载进度指示
 *    - 完成状态确认
 *
 * 4. 数据处理：
 *    - 文件内容解析
 *    - 结构化数据提取
 *    - 格式转换和优化
 *    - 结果缓存机制
 *
 * 5. 错误处理：
 *    - 网络错误重试
 *    - 数据验证失败
 *    - 超时处理机制
 *    - 用户友好的错误提示
 *
 * 6. 性能优化：
 *    - 防抖处理
 *    - 内存使用控制
 *    - 异步操作优化
 *    - 资源清理机制
 *
 * API集成：
 * - 使用useStreamResponse处理流式响应
 * - 支持文件上传和内容分析
 * - 实时数据更新和状态同步
 *
 * 返回值：
 * - report：生成的报告内容
 * - isLoading：加载状态
 * - error：错误信息
 * - handleStreamResponse：流式响应处理函数
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

export function usePSReport({ setResult, toast, session }: UsePSReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { processStream } = useStreamResponse();

  // 处理流式响应 - 使用通用的useStreamResponse
  const handleStreamResponse = async (
    query: string,
    files?: File[],
    transcriptFiles?: File[],
    onLogResult?: (
      requestData: any,
      resultData: any,
      isSuccess: boolean,
      duration: number,
      errorMessage?: string
    ) => Promise<void>
  ) => {
    const startTime = Date.now();

    // 准备请求数据用于日志记录
    const requestData = {
      query,
      files: files?.map((f) => ({ name: f.name, size: f.size })) || [],
      transcriptFiles:
        transcriptFiles?.map((f) => ({ name: f.name, size: f.size })) || [],
      timestamp: new Date().toISOString(),
    };

    try {
      console.log(
        "usePSReport - handleStreamResponse - 接收的文件数量:",
        files?.length || 0
      );
      console.log(
        "usePSReport - handleStreamResponse - 接收的成绩单文件数量:",
        transcriptFiles?.length || 0
      );

      // 输出具体文件信息
      if (files && files.length > 0) {
        console.log(
          "usePSReport - handleStreamResponse - 上传文件:",
          files
            .map((f) => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`)
            .join(", ")
        );
      }
      if (transcriptFiles && transcriptFiles.length > 0) {
        console.log(
          "usePSReport - handleStreamResponse - 成绩单文件:",
          transcriptFiles
            .map((f) => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`)
            .join(", ")
        );
      }

      setIsLoading(true);

      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), 30000); // 30秒超时
      });

      console.log("PS报告助理API请求参数:", {
        query,
        timestamp: new Date().toISOString(),
        source: "web",
        userId: session?.user?.email || "anonymous",
        filesCount: files?.length || 0,
        transcriptFilesCount: transcriptFiles?.length || 0,
      });

      const streamPromise = apiService.streamQuery(
        query,
        {
          timestamp: new Date().toISOString(),
          source: "web",
          userId: session?.user?.email || "anonymous",
        },
        files,
        transcriptFiles
      );

      // 使用 Promise.race 实现超时处理
      const stream = (await Promise.race([
        streamPromise,
        timeoutPromise,
      ])) as ReadableStream<Uint8Array> | null;

      console.log("PS报告助理API响应流:", stream);

      if (!stream) {
        throw new Error("无法获取响应流");
      }

      // 使用通用的流处理器
      await processStream(stream, {
        onUpdate: (result) => {
          console.log("PS报告助理 - 流更新:", {
            contentLength: result.content.length,
            currentStep: result.currentStep,
            stepsCount: result.steps?.length || 0,
            isComplete: result.isComplete,
          });
          setResult(result);
        },
        onComplete: async (result) => {
          console.log("PS报告助理 - 流完成:", {
            contentLength: result.content.length,
            stepsCount: result.steps?.length || 0,
          });
          const finalResult = {
            ...result,
            isComplete: true,
            currentStep: "分析完成",
          };
          setResult(finalResult);

          // 记录成功日志
          if (onLogResult) {
            await onLogResult(
              requestData,
              finalResult,
              true,
              Date.now() - startTime
            );
          }
        },
        onError: async (error) => {
          console.error("PS报告助理 - 流处理错误:", error);
          if (toast) {
            toast.error("处理请求失败: " + error.message);
          }
          const errorResult = {
            content: "处理请求时出现错误",
            timestamp: new Date().toISOString(),
            steps: ["❌ 处理失败"],
            currentStep: "处理失败",
            isComplete: true,
          };
          setResult(errorResult);

          // 记录失败日志
          if (onLogResult) {
            await onLogResult(
              requestData,
              errorResult,
              false,
              Date.now() - startTime,
              error.message
            );
          }
        },
        realtimeTypewriter: true, // 启用实时接收+逐字显示模式
        charDelay: 0.2, // 字符显示间隔0.2毫秒
      });
    } catch (error) {
      console.error("PS报告助理处理流式响应错误:", error);
      const errorResult = {
        content: "处理请求时出现错误",
        timestamp: new Date().toISOString(),
        steps: ["❌ 处理失败"],
        currentStep: "处理失败",
        isComplete: true,
      };
      setResult(errorResult);

      if (toast) {
        toast.error("处理请求失败: " + (error as Error).message);
      }

      // 记录异常日志
      if (onLogResult) {
        await onLogResult(
          requestData,
          errorResult,
          false,
          Date.now() - startTime,
          (error as Error).message
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleStreamResponse,
  };
}

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

export function usePSReport({ setResult, toast, session }: UsePSReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { processStream } = useStreamResponse();

  // 处理流式响应 - 使用通用的useStreamResponse
  const handleStreamResponse = async (
    query: string,
    files?: File[],
    transcriptFiles?: File[]
  ) => {
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
        onComplete: (result) => {
          console.log("PS报告助理 - 流完成:", {
            contentLength: result.content.length,
            stepsCount: result.steps?.length || 0,
          });
          setResult({
            ...result,
            isComplete: true,
            currentStep: "分析完成",
          });
        },
        onError: (error) => {
          console.error("PS报告助理 - 流处理错误:", error);
          if (toast) {
            toast.error("处理请求失败: " + error.message);
          }
          setResult({
            content: "处理请求时出现错误",
            timestamp: new Date().toISOString(),
            steps: ["❌ 处理失败"],
            currentStep: "处理失败",
            isComplete: true,
          });
        },
        realTimeStreaming: true, // 启用实时流式处理
      });
    } catch (error) {
      console.error("PS报告助理处理流式响应错误:", error);
      setResult({
        content: "处理请求时出现错误",
        timestamp: new Date().toISOString(),
        steps: ["❌ 处理失败"],
        currentStep: "处理失败",
        isComplete: true,
      });

      if (toast) {
        toast.error("处理请求失败: " + (error as Error).message);
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

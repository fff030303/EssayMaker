"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { DisplayResult } from "../../../types";
import { apiService } from "@/lib/api";
import { Session } from "next-auth";
import { useStreamResponse } from "../../../hooks/useStreamResponse";

interface UsePSDraftProps {
  setFinalDraft: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any;
  session: Session | null;
}

export function usePSDraft({ setFinalDraft, toast, session }: UsePSDraftProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { processStream } = useStreamResponse();

  // 处理初稿生成的流式响应
  const handleDraftGeneration = async (
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null
  ) => {
    try {
      console.log("[usePSDraft] 🚀 开始生成初稿");
      console.log("[usePSDraft] 参数检查:", {
        purifiedContentLength: purifiedContent.length,
        direction,
        requirements,
        transcriptAnalysisLength: transcriptAnalysis?.length || 0,
      });

      // 检查参数
      if (!purifiedContent) {
        console.log("[usePSDraft] ❌ 提纯内容为空");
        if (toast) {
          toast({
            title: "错误",
            description: "提纯内容不能为空",
            variant: "destructive",
          });
        }
        return;
      }

      setIsGenerating(true);

      // 构建定制需求组合文本
      const combinedRequirements = `申请方向：${direction}${
        requirements ? `，具体要求：${requirements}` : ""
      }`;

      // 初始化初稿状态
      setFinalDraft({
        content: "",
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep: "正在开始生成最终初稿...",
        isComplete: false,
      });

      console.log("[usePSDraft] API请求参数:", {
        purifiedContentLength: purifiedContent.length,
        combinedRequirements,
        transcriptAnalysisExists: !!transcriptAnalysis,
        timestamp: new Date().toISOString(),
      });

      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), 30000);
      });

      // 调用API
      const streamPromise = apiService.streamFinalDraftWithFiles({
        simplified_material: purifiedContent,
        transcript_analysis: transcriptAnalysis || undefined,
        combined_requirements: combinedRequirements,
      });

      // 使用 Promise.race 实现超时处理
      const stream = (await Promise.race([
        streamPromise,
        timeoutPromise,
      ])) as ReadableStream<Uint8Array> | null;

      if (!stream) {
        throw new Error("无法获取响应流");
      }

      // 使用通用的流处理器
      await processStream(stream, {
        onUpdate: (result) => {
          console.log("[usePSDraft] 流更新:", {
            contentLength: result.content.length,
            currentStep: result.currentStep,
            isComplete: result.isComplete,
          });
          setFinalDraft(result);
        },
        onComplete: (result) => {
          console.log("[usePSDraft] 初稿生成完成:", {
            contentLength: result.content.length,
          });
          setFinalDraft({
            ...result,
            isComplete: true,
            currentStep: undefined,
          });
        },
        onError: (error) => {
          console.error("[usePSDraft] 初稿生成错误:", error);
          if (toast) {
            toast({
              title: "错误",
              description: "生成初稿失败: " + error.message,
              variant: "destructive",
            });
          }
          setFinalDraft({
            content: "生成初稿时出现错误",
            timestamp: new Date().toISOString(),
            steps: ["❌ 生成失败"],
            currentStep: "生成失败",
            isComplete: true,
          });
        },
        realTimeStreaming: true, // 启用实时流式处理
      });
    } catch (error) {
      console.error("[usePSDraft] 初稿生成异常:", error);
      setFinalDraft({
        content: "生成初稿时出现错误",
        timestamp: new Date().toISOString(),
        steps: ["❌ 生成失败"],
        currentStep: "生成失败",
        isComplete: true,
      });

      if (toast) {
        toast({
          title: "错误",
          description: "生成初稿失败: " + (error as Error).message,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleDraftGeneration,
  };
}

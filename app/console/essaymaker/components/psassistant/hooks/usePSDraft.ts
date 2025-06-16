"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { DisplayResult } from "../../../types";
import { apiService } from "@/app/console/essaymaker/api";
import { Session } from "next-auth";
import { useStreamResponse } from "../../../hooks/useStreamResponse";
import { usePSLogger } from "./usePSLogger";

interface UsePSDraftProps {
  setFinalDraft: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any;
  session: Session | null;
}

/**
 * usePSDraft Hook
 *
 * 功能：管理PS助理个人陈述初稿生成的自定义Hook
 *
 * 核心特性：
 * 1. 初稿生成：
 *    - 基于分析报告生成个人陈述
 *    - 多种写作风格支持
 *    - 个性化内容定制
 *    - 申请要求适配
 *
 * 2. 流式处理：
 *    - 实时接收+逐字显示模式
 *    - 字符显示间隔：0.2ms
 *    - 平滑的打字机效果
 *    - 逐段生成和显示
 *
 * 3. 内容优化：
 *    - 语言表达优化
 *    - 结构逻辑调整
 *    - 长度控制管理
 *    - 可读性提升
 *
 * 4. 状态管理：
 *    - 生成进度跟踪
 *    - 错误状态处理
 *    - 完成状态确认
 *    - 用户交互状态
 *
 * 5. 数据处理：
 *    - 报告内容解析
 *    - 结构化数据转换
 *    - 模板应用和渲染
 *    - 格式验证和修正
 *
 * 6. 用户体验：
 *    - 实时预览功能
 *    - 编辑和修改支持
 *    - 版本历史记录
 *    - 导出功能集成
 *
 * 依赖关系：
 * - 依赖PS报告的分析结果
 * - 与文件上传组件协作
 * - 集成流式响应处理
 *
 * API集成：
 * - 使用useStreamResponse处理流式响应
 * - 支持基于报告的初稿生成
 * - 实时内容更新和状态同步
 *
 * 返回值：
 * - draft：生成的个人陈述初稿
 * - isGenerating：生成状态
 * - error：错误信息
 * - generateDraft：生成函数
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

export function usePSDraft({ setFinalDraft, toast, session }: UsePSDraftProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { processStream } = useStreamResponse();
  const { logDraftResult } = usePSLogger();

  // 处理初稿生成的流式响应
  const handleDraftGeneration = async (
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null
  ) => {
    const startTime = Date.now();

    // 准备日志记录的请求数据
    const requestData = {
      purifiedContent,
      direction,
      requirements: requirements || "",
      transcriptAnalysis: transcriptAnalysis || "",
      timestamp: new Date().toISOString(),
    };

    try {
      // console.log("[usePSDraft] 🚀 开始生成初稿");
      // console.log("[usePSDraft] 参数检查:", {
      //   purifiedContentLength: purifiedContent.length,
      //   direction,
      //   requirements,
      //   transcriptAnalysisLength: transcriptAnalysis?.length || 0,
      // });
      // 检查参数
      if (!purifiedContent) {
        // console.log("[usePSDraft] ❌ 提纯内容为空");
        if (toast) {
          toast({
            title: "错误",
            description: "提纯内容不能为空",
            variant: "destructive",
          });
        }

        // 记录失败日志
        const duration = Date.now() - startTime;
        await logDraftResult(
          requestData,
          null,
          false,
          duration,
          "提纯内容为空"
        );
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

      // console.log("[usePSDraft] API请求参数:", {
      //   purifiedContentLength: purifiedContent.length,
      //   combinedRequirements,
      //   transcriptAnalysisExists: !!transcriptAnalysis,
      //   timestamp: new Date().toISOString(),
      // });
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

      let finalResult: DisplayResult | null = null;

      // 使用通用的流处理器
      await processStream(stream, {
        onUpdate: (result) => {
          // console.log("[usePSDraft] 流更新:", {
          //   contentLength: result.content.length,
          //   currentStep: result.currentStep,
          //   isComplete: result.isComplete,
          // });
          setFinalDraft(result);
          finalResult = result;
        },
        onComplete: async (result) => {
          // console.log("[usePSDraft] 初稿生成完成:", {
          //   contentLength: result.content.length,
          // });
          const completedResult = {
            ...result,
            isComplete: true,
            currentStep: undefined,
          };
          setFinalDraft(completedResult);
          finalResult = completedResult;

          // 记录成功日志
          const duration = Date.now() - startTime;
          // console.log("[usePSDraft] 记录成功日志", {
          //   duration,
          //   contentLength: completedResult.content.length,
          // });
          await logDraftResult(requestData, completedResult, true, duration);
        },
        onError: async (error) => {
          // console.error("[usePSDraft] 初稿生成错误:", error);
          if (toast) {
            toast({
              title: "错误",
              description: "生成初稿失败: " + error.message,
              variant: "destructive",
            });
          }
          const errorResult = {
            content: "生成初稿时出现错误",
            timestamp: new Date().toISOString(),
            steps: ["❌ 生成失败"],
            currentStep: "生成失败",
            isComplete: true,
          };
          setFinalDraft(errorResult);

          // 记录失败日志
          const duration = Date.now() - startTime;
          // console.log("[usePSDraft] 记录失败日志", {
          //   duration,
          //   errorMessage: error.message,
          // });
          await logDraftResult(
            requestData,
            errorResult,
            false,
            duration,
            error.message
          );
        },
        realtimeTypewriter: true, // 启用实时接收+逐字显示模式
        charDelay: 0.2, // 字符显示间隔0.2毫秒
      });
    } catch (error) {
      // console.error("[usePSDraft] 初稿生成异常:", error);
      const errorResult = {
        content: "生成初稿时出现错误",
        timestamp: new Date().toISOString(),
        steps: ["❌ 生成失败"],
        currentStep: "生成失败",
        isComplete: true,
      };
      setFinalDraft(errorResult);

      if (toast) {
        toast({
          title: "错误",
          description: "生成初稿失败: " + (error as Error).message,
          variant: "destructive",
        });
      }

      // 记录异常日志
      const duration = Date.now() - startTime;
      // console.log("[usePSDraft] 记录异常日志", {
      //   duration,
      //   errorMessage: (error as Error).message,
      // });
      await logDraftResult(
        requestData,
        errorResult,
        false,
        duration,
        (error as Error).message
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleDraftGeneration,
  };
}

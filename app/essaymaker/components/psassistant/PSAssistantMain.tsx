/**
 * PSAssistantMain 组件
 * 
 * 功能：PS助理的主界面组件，协调个人陈述生成的完整流程
 * 
 * 核心特性：
 * 1. 流程管理：
 *    - 两步式个人陈述生成流程
 *    - 步骤状态跟踪和切换
 *    - 进度指示和导航
 *    - 流程完成度检测
 * 
 * 2. 组件协调：
 *    - 高级输入区域组件集成
 *    - 报告和初稿显示组件
 *    - 状态在组件间传递
 *    - 统一的错误处理
 * 
 * 3. 状态管理：
 *    - 当前步骤状态
 *    - 结果数据管理
 *    - 加载状态控制
 *    - 用户交互状态
 * 
 * 4. 数据流控制：
 *    - 文件上传处理
 *    - 用户输入收集
 *    - 结果数据传递
 *    - 状态同步机制
 * 
 * 5. 用户体验：
 *    - 平滑的步骤切换
 *    - 清晰的操作指引
 *    - 实时反馈机制
 *    - 错误提示和处理
 * 
 * 6. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 内容溢出处理
 * 
 * 流程步骤：
 * 1. 文件上传和信息输入：上传素材文件，填写申请信息
 * 2. 结果展示：显示分析报告和生成的个人陈述初稿
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { useToast } from "@/hooks/use-toast";
import { DisplayResult } from "../../types";
import { PSFileUploadForm } from "./PSFileUploadForm";
import { PSReportAndDraftDisplay } from "./PSReportAndDraftDisplay";
import { usePSDraft } from "./hooks/usePSDraft";
import { Session } from "next-auth";
import { toast } from "@/components/ui/use-toast";

// 导入简单输入区域组件
import { InputArea } from "../InputArea";
// 注释掉 AdvancedInputArea 的导入，改为使用 PSFileUploadForm 管理
import { AdvancedInputArea } from "./AdvancedInputArea";
import { AssistantTips } from "../AssistantTips";
import { apiService } from "@/lib/api";
import { useStreamResponse } from "../../hooks/useStreamResponse";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PSAssistantProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  result?: DisplayResult | null;
  finalDraft?: DisplayResult | null;
  setFinalDraft?: (finalDraft: DisplayResult | null) => void;
  isGeneratingFinalDraft?: boolean;
  handleFinalDraftSubmit?: (
    draftQuery: string,
    draftFiles: File[],
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null
  ) => Promise<void>;
  handleStreamResponse?: (
    query: string,
    materialFiles?: File[],
    transcriptFiles?: File[]
  ) => Promise<void>;
  isLoading?: boolean;
  session?: Session | null;
  onUserInputChange?: (
    direction: string,
    requirements: string,
    transcriptAnalysis: string | null
  ) => void;
}

export function PSAssistantMain({
  onStepChange,
  setResult,
  result,
  finalDraft,
  setFinalDraft,
  isGeneratingFinalDraft,
  handleFinalDraftSubmit,
  handleStreamResponse,
  isLoading = false,
  session = null,
  onUserInputChange,
}: PSAssistantProps = {}) {
  // 简化调试信息
  console.log("PSAssistantMain 渲染 - onStepChange存在:", !!onStepChange);

  const { toast } = useToast();

  // 创建适配器函数来处理setResult的类型转换
  const setResultAdapter: Dispatch<SetStateAction<DisplayResult | null>> =
    useCallback(
      (value) => {
        if (setResult) {
          if (typeof value === "function") {
            // 如果是函数，需要先获取当前值再调用
            setResult(value(result || null));
          } else {
            // 如果是直接值，直接设置
            setResult(value);
          }
        }
      },
      [setResult, result]
    );

  // 监听result变化，但不自动跳转步骤
  useEffect(() => {
    console.log("📄 PSAssistantMain - result changed:", {
      hasResult: !!result,
      isComplete: result?.isComplete,
      contentLength: result?.content?.length || 0,
    });
  }, [result, onStepChange]);

  // 监听finalDraft变化，处理最终初稿完成
  useEffect(() => {
    console.log("📄 PSAssistantMain - finalDraft changed:", {
      hasFinalDraft: !!finalDraft,
      isComplete: finalDraft?.isComplete,
      contentLength: finalDraft?.content?.length || 0,
    });

    if (finalDraft && finalDraft.isComplete && finalDraft.content) {
      console.log("✅ PSAssistantMain - 最终初稿完成");

      // PS助理完成初稿后保持在第二步，不自动跳转
      // 用户可以通过导航栏手动选择步骤
      console.log("🎯 PSAssistantMain - 初稿完成，保持在当前步骤显示结果");
    }
  }, [finalDraft, onStepChange]);

  return (
    <div className="w-full">
      {/* PS助理提示 */}
      <AssistantTips type="ps" />

      {/* 使用重命名后的 PSFileUploadForm 组件 */}
      {setResult && (
        <PSFileUploadForm
          setResult={setResultAdapter}
          toast={toast}
          session={session}
          onStepChange={onStepChange}
          onUserInputChange={onUserInputChange}
        />
      )}
    </div>
  );
}

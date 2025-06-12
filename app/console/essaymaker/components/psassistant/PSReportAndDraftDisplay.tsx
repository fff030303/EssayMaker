/**
 * PSReportAndDraftDisplay 组件
 * 
 * 功能：PS助理的报告和初稿展示组件，显示分析结果和生成的个人陈述
 * 
 * 核心特性：
 * 1. 双栏布局：
 *    - 左侧：分析报告展示
 *    - 右侧：生成的个人陈述初稿
 *    - 响应式布局适配
 *    - 可调整的分栏比例
 * 
 * 2. 报告展示：
 *    - 个人背景分析
 *    - 申请优势识别
 *    - 改进建议提供
 *    - 写作指导建议
 * 
 * 3. 初稿展示：
 *    - 格式化的个人陈述内容
 *    - 实时生成和更新
 *    - 多种写作风格
 *    - 导出功能支持
 * 
 * 4. 交互功能：
 *    - 内容复制和下载
 *    - 编辑和修改选项
 *    - 版本对比功能
 *    - 分享和保存
 * 
 * 5. 状态管理：
 *    - 加载状态指示
 *    - 错误状态处理
 *    - 生成进度跟踪
 *    - 完成状态确认
 * 
 * 6. 用户体验：
 *    - 流畅的内容切换
 *    - 清晰的视觉层次
 *    - 直观的操作反馈
 *    - 优雅的动画效果
 * 
 * 技术实现：
 * - 使用自定义Hook管理状态
 * - 支持流式内容更新
 * - Markdown渲染支持
 * - 响应式设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Send, File } from "lucide-react";
import { DisplayResult } from "../../types";
import { DraftResultDisplay } from "../DraftResultDisplay";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { useGlobalStreamResponse } from "../../hooks/useGlobalStreamResponse";
import { Sparkles, Globe } from "lucide-react";

interface PSReportAndDraftDisplayProps {
  result: DisplayResult | null;
  finalDraft: DisplayResult | null;
  finalDraftResult: DisplayResult | null;
  onStepChange: (step: number) => void;
  onGenerateFinalDraft?: () => void;
  isGeneratingFinalDraft?: boolean;
  userDirection?: string;
  userRequirements?: string;
  otherFiles?: File[];
  transcriptAnalysis?: string | null;
  setShowStepNavigation?: (show: boolean) => void;
  setHasSubmittedDraft?: (hasSubmitted: boolean) => void;
}

export function PSReportAndDraftDisplay({
  result,
  finalDraft,
  finalDraftResult,
  onStepChange,
  onGenerateFinalDraft,
  isGeneratingFinalDraft = false,
  userDirection = "",
  userRequirements = "",
  otherFiles = [],
  transcriptAnalysis = null,
  setShowStepNavigation,
  setHasSubmittedDraft,
}: PSReportAndDraftDisplayProps) {
  const [generatingFinalDraft, setGeneratingFinalDraft] = useState(false);
  const { toast } = useToast();
  const { startGlobalStream, getTaskStatus } = useGlobalStreamResponse();
  const [globalTaskId, setGlobalTaskId] = useState<string | null>(null);

  useEffect(() => {
    setGeneratingFinalDraft(isGeneratingFinalDraft);
  }, [isGeneratingFinalDraft]);

  useEffect(() => {
    if (finalDraft && finalDraft.isComplete) {
      setGeneratingFinalDraft(false);
    }
  }, [finalDraft]);

  const handleGenerateFinalDraft = () => {
    console.log("[DRAFT-GEN] 🎯 handleGenerateFinalDraft 被调用");
    console.log("[DRAFT-GEN] 🎯 检查条件:", {
      hasResult: !!result,
      hasResultContent: !!result?.content,
      userDirection: userDirection,
      userDirectionTrim: userDirection.trim(),
      onGenerateFinalDraftExists: !!onGenerateFinalDraft,
    });

    if (!result || !result.content) {
      console.log("[DRAFT-GEN] ❌ 缺少result或content");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先提交初稿文件生成素材整理报告",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    if (!userDirection.trim()) {
      console.log("[DRAFT-GEN] ❌ 缺少userDirection");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请返回第一步填写申请方向",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 确保已提交状态为true，这样用户在不同步骤间导航时不会有问题
    if (setHasSubmittedDraft) {
      console.log("[DRAFT-GEN] ✅ 设置已提交文件状态为true");
      setHasSubmittedDraft(true);
    }

    // 设置本地生成状态
    console.log("[DRAFT-GEN] 🔄 设置本地生成状态为true");
    setGeneratingFinalDraft(true);

    // 调用生成函数
    if (onGenerateFinalDraft) {
      console.log("[DRAFT-GEN] 🚀 调用onGenerateFinalDraft");
      console.log("[DRAFT-GEN] 🚀 使用现有的素材整理报告");
      try {
        onGenerateFinalDraft();
        console.log("[DRAFT-GEN] ✅ onGenerateFinalDraft调用成功");
      } catch (error) {
        console.error("[DRAFT-GEN] ❌ onGenerateFinalDraft调用出错:", error);
        setGeneratingFinalDraft(false);
      }
    } else {
      console.error("[DRAFT-GEN] ❌ 未提供onGenerateFinalDraft回调函数");
      setGeneratingFinalDraft(false);
    }
  };

  // 处理全局流式生成的初稿生成
  const handleGlobalDraftGeneration = useCallback(async () => {
    if (!onGenerateFinalDraft) return;

    try {
      // 这里需要获取流式响应，通常来自API调用
      // 由于这是一个示例，我们假设有一个API函数返回流
      // const stream = await apiService.generatePSDraft(...);
      
      // 创建全局流式任务
      const taskId = await startGlobalStream(
        // stream, // 实际的流对象
        new ReadableStream(), // 临时占位符
        {
          title: "个人陈述初稿生成",
          taskType: "ps_draft",
          backgroundGeneration: true,
          resumeParams: {
            query: "生成个人陈述初稿",
            assistantType: "ps_draft",
            userDirection,
            userRequirements,
            transcriptAnalysis: transcriptAnalysis || undefined,
          },
          onUpdate: (result) => {
            console.log("PS初稿生成更新:", result);
            // 这里可以更新本地状态
          },
          onComplete: (result) => {
            console.log("PS初稿生成完成:", result);
            // 通知用户生成完成
          },
          onError: (error) => {
            console.error("PS初稿生成错误:", error);
          },
        }
      );

      setGlobalTaskId(taskId);
      console.log("创建全局PS初稿生成任务:", taskId);

    } catch (error) {
      console.error("启动全局流式生成失败:", error);
    }
  }, [
    onGenerateFinalDraft,
    startGlobalStream,
    userDirection,
    userRequirements,
    transcriptAnalysis,
  ]);

  // 如果没有结果，显示引导信息
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="text-center p-8 max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">初稿生成</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的文件，我们将为您生成个人陈述初稿。请先在第一步上传您的文件。
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => onStepChange(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回文件上传
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 有结果的情况
  return (
    <>
      {/* 全屏加载动画 - 在生成个人陈述初稿过程中显示 */}
      {(generatingFinalDraft || isGeneratingFinalDraft) && (
        <FullScreenLoadingAnimation 
          text="正在生成个人陈述初稿，请勿切换页面..." 
        />
      )}

      <div className="flex flex-col items-center justify-start w-full px-0">
        <div className="w-full max-w-[1800px] mx-auto">
          {/* 移除顶部留白 */}
          <div className="p-2">
            {/* 当有初稿时使用双列布局 */}
            {finalDraft || finalDraftResult ? (
              // 有初稿时的布局
              <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
                {/* 左侧 - 素材整理报告 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={result}
                      title="分析报告"
                      key="material-report"
                      headerActions={
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={
                              generatingFinalDraft ||
                              isGeneratingFinalDraft ||
                              !onGenerateFinalDraft ||
                              !result.content ||
                              !userDirection.trim() ||
                              !result.isComplete
                            }
                            onClick={handleGenerateFinalDraft}
                            title={
                              !result.isComplete
                                ? "请等待内容创作完成后再生成初稿"
                                : ""
                            }
                            variant="default"
                            size="sm"
                            className="mr-2"
                          >
                            {generatingFinalDraft || isGeneratingFinalDraft ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                创作初稿
                              </>
                            )}
                          </Button>
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* 右侧 - 个人陈述初稿 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={finalDraft || finalDraftResult!}
                      title="个人陈述初稿"
                      key="personal-draft"
                      enableGlobalStreaming={!!globalTaskId}
                      taskId={globalTaskId || undefined}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // 没有初稿时的布局
              <div className="w-full max-w-[1300px] mx-auto">
                <div className="rounded-lg overflow-visible pb-6">
                  <DraftResultDisplay
                    result={result}
                    title="分析报告"
                    key="material-report"
                    headerActions={
                      <div className="flex items-center gap-2">
                        <Button
                          disabled={
                            generatingFinalDraft ||
                            isGeneratingFinalDraft ||
                            !onGenerateFinalDraft ||
                            !result.content ||
                            !userDirection.trim() ||
                            !result.isComplete
                          }
                          onClick={handleGenerateFinalDraft}
                          title={
                            !result.isComplete
                              ? "请等待内容创作完成后再生成初稿"
                              : ""
                          }
                          variant="default"
                          size="sm"
                          className="mr-2"
                        >
                          {generatingFinalDraft || isGeneratingFinalDraft ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              生成初稿
                            </>
                          )}
                        </Button>
                      </div>
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

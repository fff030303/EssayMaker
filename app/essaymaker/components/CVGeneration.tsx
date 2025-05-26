"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../types";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiService } from "@/lib/api";
import { useStreamResponse } from "../hooks/useStreamResponse";

interface CVGenerationProps {
  result: DisplayResult | null;
  formattedResume: DisplayResult | null;
  onFormattedResumeChange: (result: DisplayResult) => void;
  onStepChange: (step: number) => void;
}

export function CVGeneration({
  result,
  formattedResume,
  onFormattedResumeChange,
  onStepChange,
}: CVGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();

  // 处理生成简历
  const handleGenerateResume = async () => {
    console.log("开始生成简历...");
    console.log("当前结果:", result);
    
    if (!result || !result.content) {
      console.log("没有结果或内容，显示错误提示");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取简历分析报告",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log("调用格式化简历API...");
      // 调用格式化简历API
      const response = await apiService.formatResume(
        result.content,
        "你是一位专业的简历写作专家",
        "请根据分析报告生成一份专业的简历",
        "请按照标准的简历格式输出，包括个人信息、教育背景、工作经验、技能等部分"
      );

      console.log("API响应:", response);

      // 使用统一的流式处理
      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");
        
        await processStream(response, {
          onUpdate: (result) => {
            onFormattedResumeChange({
              ...result,
              currentStep: result.currentStep || "简历生成中"
            });
          },
          onComplete: (result) => {
            onFormattedResumeChange({
              ...result,
              currentStep: "简历生成完成"
            });
            toast({
              title: "生成成功",
              description: "简历已生成完成",
            });
          },
          onError: (error) => {
            console.error('生成简历时出错:', error);
            toast({
              variant: "destructive",
              title: "生成失败",
              description: "生成简历时发生错误，请重试",
            });
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 2 // 字符显示间隔5毫秒
        });
      }
    } catch (error) {
      console.error('生成简历时出错:', error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "生成简历时发生错误，请重试",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 如果没有结果，显示引导信息
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="text-center p-8 max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">简历生成</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的文件，我们将为您生成专业的简历。请先在第一步上传您的文件。
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
    <div className="flex flex-col items-center justify-start w-full px-0">
      <div className="w-full max-w-[1800px] mx-auto">
        <div className="p-2">
          {/* 当有格式化简历时使用双列布局 */}
          {formattedResume ? (
            // 有格式化简历时的布局
            <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
              {/* 左侧 - 简历分析报告 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                <div className="rounded-lg overflow-visible flex-grow h-full">
                  <DraftResultDisplay
                    result={result}
                    title="简历分析报告"
                    key="resume-analysis"
                    headerActions={
                      <Button
                        disabled={
                          isGenerating ||
                          !result.content ||
                          !result.isComplete
                        }
                        onClick={handleGenerateResume}
                        title={
                          !result.isComplete
                            ? "请等待内容创作完成后再生成简历"
                            : ""
                        }
                        variant="default"
                        size="sm"
                        className="mr-2"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            生成简历
                          </>
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* 右侧 - 格式化简历 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                <div className="rounded-lg overflow-visible flex-grow h-full">
                  <DraftResultDisplay
                    result={formattedResume}
                    title="专业简历"
                    key="formatted-resume"
                  />
                </div>
              </div>
            </div>
          ) : (
            // 没有格式化简历时的布局
            <div className="w-full max-w-[1300px] mx-auto">
              <div className="rounded-lg overflow-visible pb-6">
                <DraftResultDisplay
                  result={result}
                  title="简历分析报告"
                  key="resume-analysis"
                  headerActions={
                    <Button
                      disabled={
                        isGenerating ||
                        !result.content ||
                        !result.isComplete
                      }
                      onClick={handleGenerateResume}
                      title={
                        !result.isComplete
                          ? "请等待内容创作完成后再生成简历"
                          : ""
                      }
                      variant="default"
                      size="sm"
                      className="mr-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          生成简历
                        </>
                      )}
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
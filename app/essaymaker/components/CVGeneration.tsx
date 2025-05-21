"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../types";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface CVGenerationProps {
  result: DisplayResult | null;
  onStepChange: (step: number) => void;
  onGenerateResume?: () => void;
  isGeneratingResume?: boolean;
  formattedResume: DisplayResult | null;
  onFormattedResumeChange: (resume: DisplayResult | null) => void;
}

export function CVGeneration({
  result,
  onStepChange,
  onGenerateResume,
  isGeneratingResume: initialIsGeneratingResume = false,
  formattedResume,
  onFormattedResumeChange,
}: CVGenerationProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(initialIsGeneratingResume);

  useEffect(() => {
    setIsGenerating(initialIsGeneratingResume);
  }, [initialIsGeneratingResume]);

  // 处理生成简历
  const handleGenerateResume = async () => {
    if (!result || !result.content) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取简历分析报告",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // 调用格式化简历API
      const response = await apiService.formatResume(
        result.content,
        "你是一位专业的简历优化专家",
        "请根据分析报告生成一份专业的简历",
        "请按照标准的简历格式输出，包括个人信息、教育背景、工作经验、项目经历、技能等部分"
      );

      // 处理流式响应
      if (response instanceof ReadableStream) {
        const reader = response.getReader();
        const decoder = new TextDecoder('utf-8');
        let formattedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码二进制数据为UTF-8文本
          const chunk = decoder.decode(value, { stream: true });
          
          // 处理SSE格式的数据
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // 移除 'data: ' 前缀
                const data = JSON.parse(jsonStr);
                if (data.type === 'content' && data.content) {
                  formattedContent += data.content;
                }
              } catch (e) {
                console.error('解析SSE数据失败:', e);
              }
            }
          }

          // 更新格式化后的简历内容
          onFormattedResumeChange({
            content: formattedContent,
            steps: [],
            timestamp: new Date().toISOString(),
            isComplete: false,
            currentStep: "简历生成中"
          });
        }

        // 完成时更新状态
        onFormattedResumeChange({
          content: formattedContent,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "简历生成完成"
        });

        toast({
          title: "生成成功",
          description: "简历已生成完成",
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
          <h2 className="text-2xl font-bold mb-4">简历分析</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的简历文件，我们将为您生成简历分析报告。请先在第一步上传您的简历文件。
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
          {/* 当有格式化后的简历时使用双列布局 */}
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
                        variant="default"
                        size="sm"
                        className="mr-2"
                        onClick={handleGenerateResume}
                        disabled={isGenerating || !result.content || !result.isComplete}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            生成简历
                          </>
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* 右侧 - 生成的简历 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                <div className="rounded-lg overflow-visible flex-grow h-full">
                  <DraftResultDisplay
                    result={formattedResume}
                    title="生成的简历"
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
                      variant="default"
                      size="sm"
                      className="mr-2"
                      onClick={handleGenerateResume}
                      disabled={isGenerating || !result.content || !result.isComplete}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
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
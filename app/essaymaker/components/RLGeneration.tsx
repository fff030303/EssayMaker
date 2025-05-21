"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../types";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

interface RLGenerationProps {
  result: DisplayResult | null;
  onStepChange: (step: number) => void;
  formattedLetter: DisplayResult | null;
  onFormattedLetterChange: (letter: DisplayResult | null) => void;
}

export function RLGeneration({
  result,
  onStepChange,
  formattedLetter,
  onFormattedLetterChange,
}: RLGenerationProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // 处理生成推荐信
  const handleGenerateLetter = async () => {
    console.log("开始生成推荐信...");
    console.log("当前结果:", result);
    
    if (!result || !result.content) {
      console.log("没有结果或内容，显示错误提示");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取推荐信分析报告",
      });
      return;
    }

    setIsGenerating(true);
    try {
      console.log("调用格式化推荐信API...");
      // 调用格式化推荐信API
      const response = await apiService.formatRecommendationLetter(
        result.content,
        "你是一位专业的推荐信写作专家",
        "请根据分析报告生成一份专业的推荐信",
        "请按照标准的推荐信格式输出，包括称呼、正文、结尾等部分"
      );

      console.log("API响应:", response);

      // 处理流式响应
      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");
        const reader = response.getReader();
        const decoder = new TextDecoder('utf-8');
        let formattedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("流式响应完成");
            break;
          }

          // 解码二进制数据为UTF-8文本
          const chunk = decoder.decode(value, { stream: true });
          console.log("收到数据块:", chunk.substring(0, 100) + "...");
          
          // 处理SSE格式的数据
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // 移除 'data: ' 前缀
                const data = JSON.parse(jsonStr);
                if (data.type === 'content' && data.content) {
                  formattedContent += data.content;
                  console.log("更新内容长度:", formattedContent.length);
                }
              } catch (e) {
                console.error('解析SSE数据失败:', e);
              }
            }
          }

          // 更新格式化后的推荐信内容
          onFormattedLetterChange({
            content: formattedContent,
            steps: [],
            timestamp: new Date().toISOString(),
            isComplete: false,
            currentStep: "推荐信生成中"
          });
        }

        // 完成时更新状态
        console.log("生成完成，更新最终状态");
        onFormattedLetterChange({
          content: formattedContent,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "推荐信生成完成"
        });

        toast({
          title: "生成成功",
          description: "推荐信已生成完成",
        });
      }
    } catch (error) {
      console.error('生成推荐信时出错:', error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "生成推荐信时发生错误，请重试",
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
          <h2 className="text-2xl font-bold mb-4">推荐信分析</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的推荐信素材，我们将为您生成推荐信分析报告。请先在第一步上传您的推荐信素材。
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
          {/* 当有格式化后的推荐信时使用双列布局 */}
          {formattedLetter ? (
            // 有格式化推荐信时的布局
            <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
              {/* 左侧 - 推荐信分析报告 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                <div className="rounded-lg overflow-visible flex-grow h-full">
                  <DraftResultDisplay
                    result={result}
                    title="推荐信分析报告"
                    key="letter-analysis"
                    headerActions={
                      <Button
                        variant="default"
                        size="sm"
                        className="mr-2"
                        onClick={handleGenerateLetter}
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
                            生成推荐信
                          </>
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>

              {/* 右侧 - 生成的推荐信 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                <div className="rounded-lg overflow-visible flex-grow h-full">
                  <DraftResultDisplay
                    result={formattedLetter}
                    title="生成的推荐信"
                    key="formatted-letter"
                  />
                </div>
              </div>
            </div>
          ) : (
            // 没有格式化推荐信时的布局
            <div className="w-full max-w-[1300px] mx-auto">
              <div className="rounded-lg overflow-visible pb-6">
                <DraftResultDisplay
                  result={result}
                  title="推荐信分析报告"
                  key="letter-analysis"
                  headerActions={
                    <Button
                      variant="default"
                      size="sm"
                      className="mr-2"
                      onClick={handleGenerateLetter}
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
                          生成推荐信
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
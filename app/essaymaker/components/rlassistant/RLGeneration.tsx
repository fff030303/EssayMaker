"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../../types";
import { DraftResultDisplay } from "../DraftResultDisplay";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiService } from "@/lib/api";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface RLGenerationProps {
  result: DisplayResult | null;
  formattedLetter: DisplayResult | null;
  onFormattedLetterChange: (result: DisplayResult) => void;
  onStepChange: (step: number) => void;
}

export function RLGeneration({
  result,
  formattedLetter,
  onFormattedLetterChange,
  onStepChange,
}: RLGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();

  // 自定义提示词状态
  const [customRolePrompt, setCustomRolePrompt] = useState("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] = useState("");

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
      // 调用格式化推荐信API，使用用户输入的自定义提示词
      const response = await apiService.formatRecommendationLetter(
        result.content,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );

      console.log("API响应:", response);

      // 使用统一的流式处理
      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");

        await processStream(response, {
          onUpdate: (result) => {
            onFormattedLetterChange({
              ...result,
              currentStep: result.currentStep || "推荐信生成中",
            });
          },
          onComplete: (result) => {
            onFormattedLetterChange({
              ...result,
              currentStep: "推荐信生成完成",
            });
            toast({
              title: "生成成功",
              description: "推荐信已生成完成",
            });
          },
          onError: (error) => {
            console.error("生成推荐信时出错:", error);
            toast({
              variant: "destructive",
              title: "生成失败",
              description: "生成推荐信时发生错误，请重试",
            });
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 1, // 字符显示间隔1毫秒
        });
      }
    } catch (error) {
      console.error("生成推荐信时出错:", error);
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
          <h2 className="text-2xl font-bold mb-4">推荐信生成</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的文件，我们将为您生成专业的推荐信。请先在第一步上传您的文件。
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
          {/* 当有格式化推荐信时使用双列布局 */}
          {formattedLetter ? (
            // 有格式化推荐信时的布局
            <div className="flex flex-col">
              {/* 自定义提示词输入区域 - 在双列布局上方 */}
              <div className="mb-6 p-6 border rounded-lg bg-card hidden">
                <h3 className="text-lg font-semibold mb-4">自定义提示词设置</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色提示词</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务提示词</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式提示词</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* 双列布局区域 */}
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
                          disabled={
                            isGenerating ||
                            !result.content ||
                            !result.isComplete
                          }
                          onClick={handleGenerateLetter}
                          title={
                            !result.isComplete
                              ? "请等待内容创作完成后再生成推荐信"
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
            </div>
          ) : (
            // 没有格式化推荐信时的布局
            <div className="w-full max-w-[1300px] mx-auto">
              {/* 自定义提示词输入区域 */}
              <div className="mb-6 p-6 border rounded-lg bg-card hidden">
                <h3 className="text-lg font-semibold mb-4">自定义提示词设置</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色提示词</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务提示词</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式提示词</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg overflow-visible pb-6">
                <DraftResultDisplay
                  result={result}
                  title="推荐信分析报告"
                  key="letter-analysis"
                  headerActions={
                    <Button
                      disabled={
                        isGenerating || !result.content || !result.isComplete
                      }
                      onClick={handleGenerateLetter}
                      title={
                        !result.isComplete
                          ? "请等待内容创作完成后再生成推荐信"
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

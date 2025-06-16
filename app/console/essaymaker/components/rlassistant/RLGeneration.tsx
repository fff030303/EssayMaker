/**
 * RLGeneration 组件
 *
 * 功能：推荐信生成组件，负责推荐信的创建和优化
 *
 * 核心特性：
 * 1. 推荐信生成：
 *    - 基于上传文件生成推荐信
 *    - 多种推荐信模板支持
 *    - 个性化内容定制
 *    - 专业格式标准
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
 *    - 专业性提升
 *
 * 4. 交互功能：
 *    - 实时预览功能
 *    - 编辑和修改支持
 *    - 版本对比功能
 *    - 导出功能集成
 *
 * 5. 状态管理：
 *    - 生成进度跟踪
 *    - 错误状态处理
 *    - 完成状态确认
 *    - 用户交互状态
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../../types";
import { DraftResultDisplay } from "../DraftResultDisplay";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { apiService } from "@/app/console/essaymaker/api";
import { useStreamResponse } from "../../hooks/useStreamResponse";
import { useRLLogger } from "./hooks/useRLLogger";

interface RLGenerationProps {
  result: DisplayResult | null;
  formattedLetter: DisplayResult | null;
  onFormattedLetterChange: (result: DisplayResult) => void;
  onStepChange: (step: number) => void;
  onGeneratingStateChange?: (isGenerating: boolean) => void;
  writingRequirements?: string;
}

export function RLGeneration({
  result,
  formattedLetter,
  onFormattedLetterChange,
  onStepChange,
  onGeneratingStateChange,
  writingRequirements,
}: RLGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();
  const { logFormatResult } = useRLLogger();

  // 自定义提示词状态
  const [customRolePrompt, setCustomRolePrompt] = useState("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] = useState("");

  // 监听生成状态变化，通知父组件
  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGenerating);
    }
  }, [isGenerating, onGeneratingStateChange]);

  // 处理生成推荐信
  const handleGenerateLetter = async () => {
    // console.log("开始生成推荐信...");
    // console.log("当前结果:", result);
    // console.log("写作需求:", writingRequirements);
    if (!result || !result.content) {
      // console.log("没有结果或内容，显示错误提示");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取推荐信分析报告",
      });
      return;
    }

    const startTime = Date.now();

    setIsGenerating(true);
    try {
      // console.log("调用格式化推荐信API...");
      // 🆕 整合完整的写作需求字符串
      let fullWritingRequirements = "";

      // 基础写作需求（来自第一步）
      const baseRequirements =
        writingRequirements || result.writingRequirements || "";
      if (baseRequirements) {
        fullWritingRequirements += baseRequirements;
      }

      // 添加自定义角色提示词
      if (customRolePrompt.trim()) {
        if (fullWritingRequirements) fullWritingRequirements += "\n\n";
        fullWritingRequirements += `角色设定：${customRolePrompt.trim()}`;
      }

      // 添加自定义任务提示词
      if (customTaskPrompt.trim()) {
        if (fullWritingRequirements) fullWritingRequirements += "\n\n";
        fullWritingRequirements += `任务要求：${customTaskPrompt.trim()}`;
      }

      // 添加自定义输出格式提示词
      if (customOutputFormatPrompt.trim()) {
        if (fullWritingRequirements) fullWritingRequirements += "\n\n";
        fullWritingRequirements += `输出格式要求：${customOutputFormatPrompt.trim()}`;
      }

      // console.log("整合后的写作需求:", fullWritingRequirements);
      // 🆕 调用API时只传递整合后的写作需求字符串，其他提示词参数设为空
      const response = await apiService.formatRecommendationLetter(
        result.content,
        "", // customRolePrompt 已整合到 fullWritingRequirements 中
        "", // customTaskPrompt 已整合到 fullWritingRequirements 中
        "", // customOutputFormatPrompt 已整合到 fullWritingRequirements 中
        fullWritingRequirements // 传递整合后的完整写作需求
      );

      // console.log("API响应:", response);
      // 使用统一的流式处理
      if (response instanceof ReadableStream) {
        // console.log("开始处理流式响应...");
        await processStream(response, {
          onUpdate: (result) => {
            onFormattedLetterChange({
              ...result,
              currentStep: result.currentStep || "推荐信生成中",
            });
          },
          onComplete: async (result) => {
            // 记录成功的格式化结果
            await logFormatResult(
              {
                rawLetter: result.content.substring(0, 500),
                customRolePrompt: customRolePrompt,
                customTaskPrompt: customTaskPrompt,
                customOutputFormatPrompt: customOutputFormatPrompt,
                writingRequirements: fullWritingRequirements,
              },
              {
                content: result.content,
                isComplete: true,
                currentStep: "推荐信生成完成",
              },
              true,
              Date.now() - startTime
            );

            onFormattedLetterChange({
              ...result,
              currentStep: "推荐信生成完成",
            });
            toast({
              title: "生成成功",
              description: "推荐信已生成完成",
            });
          },
          onError: async (error) => {
            // console.error("生成推荐信时出错:", error);
            // 记录失败的格式化结果
            await logFormatResult(
              {
                rawLetter: result?.content?.substring(0, 500) || "",
                customRolePrompt: customRolePrompt,
                customTaskPrompt: customTaskPrompt,
                customOutputFormatPrompt: customOutputFormatPrompt,
                writingRequirements: fullWritingRequirements,
              },
              { content: "", error: true },
              false,
              Date.now() - startTime,
              error instanceof Error ? error.message : "生成推荐信时发生错误"
            );

            toast({
              variant: "destructive",
              title: "生成失败",
              description: "生成推荐信时发生错误，请重试",
            });
          },
          realtimeTypewriter: true,
          charDelay: 0.2,
        });
      }
    } catch (error) {
      // console.error("生成推荐信时出错:", error);
      // 记录失败的格式化结果
      await logFormatResult(
        {
          rawLetter: result?.content?.substring(0, 500) || "",
          customRolePrompt: customRolePrompt,
          customTaskPrompt: customTaskPrompt,
          customOutputFormatPrompt: customOutputFormatPrompt,
          writingRequirements: writingRequirements,
        },
        { content: "", error: true },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : "生成推荐信时发生错误"
      );

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
                <h3 className="text-lg font-semibold mb-4">
                  额外写作要求（可选）
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  在这里可以添加额外的写作要求，这些要求将与第一步的要求一起传递给AI
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色设定要求</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                      placeholder="例如：以计算机科学教授的身份撰写..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务要求</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                      placeholder="例如：重点突出学生的编程能力和创新思维..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式要求</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                      placeholder="例如：推荐信长度控制在800-1000字，包含具体的项目实例..."
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
                      title="分析报告"
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
                      title="推荐信初稿"
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
                <h3 className="text-lg font-semibold mb-4">
                  额外写作要求（可选）
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  在这里可以添加额外的写作要求，这些要求将与第一步的要求一起传递给AI
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色设定要求</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                      placeholder="例如：以计算机科学教授的身份撰写..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务要求</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                      placeholder="例如：重点突出学生的编程能力和创新思维..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式要求</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                      placeholder="例如：推荐信长度控制在800-1000字，包含具体的项目实例..."
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg overflow-visible pb-6">
                <DraftResultDisplay
                  result={result}
                  title="分析报告"
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

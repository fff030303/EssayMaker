/**
 * SectionalStrategyAndDraftDisplay 组件
 * 
 * 功能：分稿助理的策略和稿件展示组件，显示改写策略和生成的最终稿件
 * 
 * 核心特性：
 * 1. 双栏布局：
 *    - 左侧：改写策略展示
 *    - 右侧：生成的最终稿件
 *    - 响应式布局适配
 *    - 可调整的分栏比例
 * 
 * 2. 策略展示：
 *    - Essay改写策略分析
 *    - 改进建议提供
 *    - 写作指导建议
 *    - 结构优化建议
 * 
 * 3. 稿件展示：
 *    - 格式化的最终稿件内容
 *    - 实时生成和更新
 *    - 流式响应处理
 *    - 导出功能支持
 * 
 * 4. 交互功能：
 *    - 生成最终稿件按钮
 *    - 内容复制和下载
 *    - 编辑和修改选项
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
 * - 参考PS助理的实现模式
 * - 支持流式内容更新
 * - Markdown渲染支持
 * - 响应式设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { DisplayResult } from "../../types";
import { DraftResultDisplay } from "../DraftResultDisplay";
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/components/ui/use-toast";
import { apiService } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw } from "lucide-react";

interface SectionalStrategyAndDraftDisplayProps {
  strategyResult: DisplayResult | null;
  finalDraft: DisplayResult | null;
  onStepChange: (step: number) => void;
  onFinalDraftChange: (draft: DisplayResult | null) => void;
  onGeneratingStateChange: (isGenerating: boolean) => void;
  originalFile: File | null;
  strategyContent: string;
  // 🆕 新增：清空所有内容回调
  onClearAll?: () => void;
  // 🆕 新增：清空时间戳，用于触发清空操作
  clearTimestamp?: number;
}

export function SectionalStrategyAndDraftDisplay({
  strategyResult,
  finalDraft,
  onStepChange,
  onFinalDraftChange,
  onGeneratingStateChange,
  originalFile,
  strategyContent,
  onClearAll,
  clearTimestamp,
}: SectionalStrategyAndDraftDisplayProps) {
  const [isGeneratingFinalDraft, setIsGeneratingFinalDraft] = useState(false);
  
  // 🆕 新增：自定义提示词状态
  const [customEssayRewriterRole, setCustomEssayRewriterRole] = useState<string>("");
  const [customEssayRewriterTask, setCustomEssayRewriterTask] = useState<string>("");
  const [customEssayRewriterOutputFormat, setCustomEssayRewriterOutputFormat] = useState<string>("");

  // 🆕 新增：清空内部状态的函数
  const handleClearInternalState = useCallback(() => {
    console.log("[SectionalStrategyAndDraftDisplay] 🧹 开始清空内部状态");
    console.log("[SectionalStrategyAndDraftDisplay] 清空前状态:", {
      customEssayRewriterRole: customEssayRewriterRole.length,
      customEssayRewriterTask: customEssayRewriterTask.length,
      customEssayRewriterOutputFormat: customEssayRewriterOutputFormat.length,
      isGeneratingFinalDraft,
    });
    
    setCustomEssayRewriterRole("");
    setCustomEssayRewriterTask("");
    setCustomEssayRewriterOutputFormat("");
    setIsGeneratingFinalDraft(false);
    
    console.log("[SectionalStrategyAndDraftDisplay] ✅ 内部状态已清空");
  }, []);

  // 🆕 新增：监听外部清空调用
  useEffect(() => {
    if (onClearAll) {
      // 当父组件传入onClearAll回调时，可以通过某种方式触发清空
      // 但我们需要一个触发机制，这里先设置清空函数
      console.log("[SectionalStrategyAndDraftDisplay] 注册清空回调");
    }
  }, [onClearAll]);

  // 🆕 新增：监听清空时间戳变化，直接触发清空
  useEffect(() => {
    console.log("[SectionalStrategyAndDraftDisplay] 🔍 clearTimestamp useEffect 触发:", {
      clearTimestamp,
      clearTimestampExists: !!clearTimestamp,
      clearTimestampValue: clearTimestamp,
      isGreaterThanZero: clearTimestamp && clearTimestamp > 0,
    });
    
    if (clearTimestamp && clearTimestamp > 0) {
      console.log("[SectionalStrategyAndDraftDisplay] 收到清空时间戳:", clearTimestamp, "，执行清空操作");
      
      // 直接在这里执行清空操作，不调用回调函数
      console.log("[SectionalStrategyAndDraftDisplay] 🧹 开始清空内部状态");
      console.log("[SectionalStrategyAndDraftDisplay] 清空前状态:", {
        customEssayRewriterRole: customEssayRewriterRole.length,
        customEssayRewriterTask: customEssayRewriterTask.length,
        customEssayRewriterOutputFormat: customEssayRewriterOutputFormat.length,
        isGeneratingFinalDraft,
      });
      
      setCustomEssayRewriterRole("");
      setCustomEssayRewriterTask("");
      setCustomEssayRewriterOutputFormat("");
      setIsGeneratingFinalDraft(false);
      
      console.log("[SectionalStrategyAndDraftDisplay] ✅ 内部状态已清空");
      
      // 🆕 添加toast通知确认清空操作
      toast({
        title: "第二步内容已清空",
        description: "自定义提示词和状态已重置",
      });
    } else {
      console.log("[SectionalStrategyAndDraftDisplay] ❌ clearTimestamp 不满足条件，不执行清空");
    }
  }, [clearTimestamp, customEssayRewriterRole, customEssayRewriterTask, customEssayRewriterOutputFormat, isGeneratingFinalDraft]);

  // 处理生成最终稿件
  const handleGenerateFinalDraft = useCallback(async () => {
    if (!originalFile || !strategyResult?.content) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "缺少必要的文件或策略内容",
      });
      return;
    }

    setIsGeneratingFinalDraft(true);
    onGeneratingStateChange(true);

    // 🆕 立即创建空的最终稿件对象，切换到双列布局
    onFinalDraftChange({
      content: "",
      timestamp: new Date().toISOString(),
      steps: [],
      isComplete: false,
    });

    try {
      console.log("调用Essay重写API，自定义提示词:", {
        role: customEssayRewriterRole,
        task: customEssayRewriterTask,
        outputFormat: customEssayRewriterOutputFormat,
      });
      
      console.log("传递给第三步API的改写策略内容长度:", strategyResult.content.length);
      
      // 🆕 修改：只传递第二步生成的改写策略，不使用第一步的搜索结果
      const response = await apiService.streamEssayRewriteRewriteEssay(
        strategyResult.content,  // 只传递第二步生成的改写策略
        originalFile,
        customEssayRewriterRole,
        customEssayRewriterTask,
        customEssayRewriterOutputFormat
      );

      if (response instanceof ReadableStream) {
        // 处理流式响应
        const reader = response.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // 🆕 当流结束时，确保设置为完成状态
            onFinalDraftChange({
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              steps: [],
              isComplete: true,
            });
            console.log("流结束，最终稿件生成完成，内容长度:", accumulatedContent.length);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');
          buffer = lines.pop() || "";

          for (const line of lines) {
            let trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ')) {
              trimmedLine = trimmedLine.substring(6);
            }

            try {
              const data = JSON.parse(trimmedLine);
              
              if (data.type === "content") {
                accumulatedContent += data.content || "";
                
                // 实时更新UI
                onFinalDraftChange({
                  content: accumulatedContent,
                  timestamp: new Date().toISOString(),
                  steps: [],
                  isComplete: false,
                });
              } else if (data.type === "complete") {
                // 生成完成
                onFinalDraftChange({
                  content: accumulatedContent,
                  timestamp: new Date().toISOString(),
                  steps: [],
                  isComplete: true,
                });
                console.log("收到完成信号，最终稿件生成完成，内容长度:", accumulatedContent.length);
                break;
              }
            } catch (parseError) {
              // 如果不是JSON格式，作为普通文本处理
              accumulatedContent += trimmedLine + "\n";
              onFinalDraftChange({
                content: accumulatedContent,
                timestamp: new Date().toISOString(),
                steps: [],
                isComplete: false,
              });
            }
          }
        }
      }

      toast({
        title: "生成完成",
        description: "最终Essay稿件已生成完成",
      });
    } catch (error) {
      console.error("生成最终稿件失败:", error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: error instanceof Error ? error.message : "未知错误",
      });
      
      // 🆕 如果生成失败，清除最终稿件对象，回到单列布局
      onFinalDraftChange(null);
    } finally {
      setIsGeneratingFinalDraft(false);
      onGeneratingStateChange(false);
    }
  }, [originalFile, strategyResult, strategyContent, onFinalDraftChange, onGeneratingStateChange, customEssayRewriterRole, customEssayRewriterTask, customEssayRewriterOutputFormat]);

  // 如果没有策略结果，显示引导信息
  if (!strategyResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="text-center p-8 max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">个人陈述改写策略</h2>
          <p className="text-muted-foreground mb-6">
            请先在第一步完成分稿查询，然后点击"撰写改写策略"按钮生成改写策略。
          </p>
        </div>
      </div>
    );
  }

  // 有策略结果的情况
  return (
    <div className="flex flex-col items-center justify-start w-full px-0">
      <div className="w-full max-w-[1800px] mx-auto">
        <div className="p-2">
          {/* 当有最终稿件时使用双列布局 */}
          {finalDraft ? (
            // 有最终稿件时的双列布局
            <div className="flex flex-col">
              {/* 🆕 新增：自定义提示词输入区域 - 在双列布局上方 */}
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">生成的个人陈述</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6"
                      onClick={() => {
                        setCustomEssayRewriterRole("");
                        setCustomEssayRewriterTask("");
                        setCustomEssayRewriterOutputFormat("");
                        toast({
                          title: "已清空",
                          description: "Essay重写提示词已重置",
                        });
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      重置提示词
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="essay-rewriter-role">Essay重写角色提示词</Label>
                    <Textarea
                      id="essay-rewriter-role"
                      value={customEssayRewriterRole}
                      onChange={(e) => setCustomEssayRewriterRole(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：你是一位专业的学术写作专家，擅长根据改写策略优化Essay内容..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>

                  <div>
                    <Label htmlFor="essay-rewriter-task">Essay重写任务提示词</Label>
                    <Textarea
                      id="essay-rewriter-task"
                      value={customEssayRewriterTask}
                      onChange={(e) => setCustomEssayRewriterTask(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：请根据提供的改写策略，重新构思和重写Essay，确保逻辑清晰、结构合理..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>

                  <div>
                    <Label htmlFor="essay-rewriter-format">Essay重写输出格式提示词</Label>
                    <Textarea
                      id="essay-rewriter-format"
                      value={customEssayRewriterOutputFormat}
                      onChange={(e) => setCustomEssayRewriterOutputFormat(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：请按照标准的学术Essay格式输出，包含引言、主体段落和结论部分..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 双列布局区域 */}
              <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
                {/* 左侧 - 改写策略 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={strategyResult}
                      title="个人陈述改写策略"
                      key="strategy-result"
                      headerActions={
                        <Button
                          disabled={
                            isGeneratingFinalDraft ||
                            !strategyResult.content ||
                            !strategyResult.isComplete
                          }
                          onClick={handleGenerateFinalDraft}
                          title={
                            !strategyResult.isComplete
                              ? "请等待改写策略生成完成后再生成最终稿件"
                              : finalDraft?.isComplete 
                                ? "重新生成最终稿件"
                                : "生成最终稿件"
                          }
                          variant="default"
                          size="sm"
                          className="mr-2"
                        >
                          {isGeneratingFinalDraft ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              {finalDraft?.isComplete ? "重新生成" : "生成最终稿件"}
                            </>
                          )}
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* 右侧 - 最终稿件 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={finalDraft}
                      title="生成的个人陈述"
                      key="final-draft"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 没有最终稿件时的单列布局
            <div className="w-full max-w-[1300px] mx-auto">
              {/* 🆕 新增：自定义提示词输入区域 */}
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Essay重写自定义提示词设置</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6"
                      onClick={() => {
                        setCustomEssayRewriterRole("");
                        setCustomEssayRewriterTask("");
                        setCustomEssayRewriterOutputFormat("");
                        toast({
                          title: "已清空",
                          description: "Essay重写提示词已重置",
                        });
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      重置提示词
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="essay-rewriter-role-single">Essay重写角色提示词</Label>
                    <Textarea
                      id="essay-rewriter-role-single"
                      value={customEssayRewriterRole}
                      onChange={(e) => setCustomEssayRewriterRole(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：你是一位专业的学术写作专家，擅长根据改写策略优化Essay内容..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>

                  <div>
                    <Label htmlFor="essay-rewriter-task-single">Essay重写任务提示词</Label>
                    <Textarea
                      id="essay-rewriter-task-single"
                      value={customEssayRewriterTask}
                      onChange={(e) => setCustomEssayRewriterTask(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：请根据提供的改写策略，重新构思和重写Essay，确保逻辑清晰、结构合理..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>

                  <div>
                    <Label htmlFor="essay-rewriter-format-single">Essay重写输出格式提示词</Label>
                    <Textarea
                      id="essay-rewriter-format-single"
                      value={customEssayRewriterOutputFormat}
                      onChange={(e) => setCustomEssayRewriterOutputFormat(e.target.value)}
                      className="mt-1 min-h-[60px]"
                      placeholder="例如：请按照标准的学术Essay格式输出，包含引言、主体段落和结论部分..."
                      disabled={isGeneratingFinalDraft}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 单列布局的策略显示 */}
              <div className="space-y-6">
                <DraftResultDisplay
                  result={strategyResult}
                  title="个人陈述改写策略"
                  key="strategy-result-single"
                  headerActions={
                    <Button
                      disabled={
                        isGeneratingFinalDraft ||
                        !strategyResult.content ||
                        !strategyResult.isComplete
                      }
                      onClick={handleGenerateFinalDraft}
                      title={
                        !strategyResult.isComplete
                          ? "请等待改写策略生成完成后再生成最终稿件"
                          : "生成最终稿件"
                      }
                      variant="default"
                      size="sm"
                      className="mr-2"
                    >
                      {isGeneratingFinalDraft ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          生成最终稿件
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
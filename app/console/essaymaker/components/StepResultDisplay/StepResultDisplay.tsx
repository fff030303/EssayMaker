/**
 * StepResultDisplay 主组件
 *
 * 重构自 ResultDisplay 组件，保持所有原有功能
 *
 * 功能：智能展示查询结果，支持多种内容格式的渲染
 *
 * 核心特性：
 * 1. 智能内容检测和渲染（HTML/Markdown）
 * 2. 内容处理和安全化
 * 3. 策略生成功能
 * 4. 自定义提示词设置
 * 5. UI 渲染和样式
 *
 * 模块化结构：
 * - ContentRenderer: 内容渲染
 * - StrategyActions: 策略操作
 * - PromptSettings: 提示词设置
 * - 工具函数和样式模块
 *
 * @author EssayMaker Team
 * @version 2.0.0 (重构版本)
 */

"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Edit, RefreshCcw, ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

// 导入类型定义
import { StepResultDisplayProps } from "./types";

// 导入子组件
import { ContentRenderer } from "./components/ContentRenderer";

// 导入业务逻辑
import { apiService } from "@/app/console/essaymaker/api";
import { DisplayResult } from "../../types";

// 导入Hook
import { useSectionalLogger } from "../sectionalassistant/hooks/useSectionalLogger";

/**
 * StepResultDisplay 主组件
 */
export function StepResultDisplay({
  result,
  title = "分析结果",
  onGenerateStrategy,
  originalEssayFile,
  searchResult,
  onStepChange,
  personalizationRequirements,
  onShowFullContent,
  materialDoc = "", // 新增：粘贴的文档内容
}: StepResultDisplayProps) {
  // 状态管理
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const { toast } = useToast();

  // 自定义提示词状态
  const [customStrategyGeneratorRole, setCustomStrategyGeneratorRole] =
    useState<string>("");
  const [customStrategyGeneratorTask, setCustomStrategyGeneratorTask] =
    useState<string>("");
  const [
    customStrategyGeneratorOutputFormat,
    setCustomStrategyGeneratorOutputFormat,
  ] = useState<string>("");
  const [showCustomPrompts, setShowCustomPrompts] = useState(false);

  // Hook
  const { logStrategyResult } = useSectionalLogger();

  if (!result) return null;

  // 处理可能包含在内容中的重复标题
  const processedContent = useMemo(() => {
    if (!result.content) return "";

    // 检查是否是从步骤点击显示的内容
    // @ts-ignore - 自定义属性_isStepContent
    if (result._isStepContent) {
      // 如果是步骤内容，直接返回内容，不需要额外处理
      return result.content;
    }

    // 常规流式内容处理 - 尝试移除可能存在的重复内容
    return result.content
      .replace(/^#*\s*查询结果\s*$/m, "") // 移除可能的标题行
      .replace(
        /^\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}\s*$/m,
        ""
      ) // 移除可能的时间戳行
      .replace(
        /^#*\s*查询结果\s*\d{4}[/-]\d{1,2}[/-]\d{1,2}\s+\d{1,2}:\d{1,2}:\d{1,2}\s*$/m,
        ""
      ) // 移除组合的标题和时间戳行
      .replace(/^\s+/, ""); // 移除开头的空白
  }, [result.content, result._isStepContent]);

  // 处理撰写改写策略 - 完全复制原始逻辑
  const handleGenerateStrategy = async () => {
    if ((!originalEssayFile && !materialDoc.trim()) || !searchResult) {
      toast({
        variant: "destructive",
        title: "参数不足",
        description: "缺少原始文件/粘贴内容或搜索结果数据",
      });
      return;
    }

    setIsGeneratingStrategy(true);

    // 立即跳转到第二步
    if (onStepChange) {
      onStepChange(2);
    }

    // 记录开始时间用于性能监控
    const startTime = Date.now();

    try {
      console.log("调用策略生成API，自定义提示词:", {
        role: customStrategyGeneratorRole,
        task: customStrategyGeneratorTask,
        outputFormat: customStrategyGeneratorOutputFormat,
      });

      // 传递自定义提示词参数
      const streamResponse =
        await apiService.streamEssayRewriteGenerateStrategy(
          searchResult,
          originalEssayFile || null, // 确保类型为 File | null
          result.content || "", // 使用当前分析结果作为analysisResult
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
          personalizationRequirements || "",
          materialDoc // 🆕 新增：传递粘贴的文档内容
        );

      if (!streamResponse) {
        throw new Error("未收到响应流");
      }

      const reader = streamResponse.getReader();
      const decoder = new TextDecoder();
      let strategyContent = "";
      let steps: string[] = [];

      // 创建策略结果对象
      const strategyResult: DisplayResult = {
        content: "",
        steps: [],
        timestamp: new Date().toISOString(),
        isComplete: false,
        currentStep: "改写策略生成中...",
      };

      // 立即显示加载状态
      if (onGenerateStrategy) {
        onGenerateStrategy(strategyResult);
      }

      // 处理流式响应
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.step) {
                steps.push(data.step);
              }

              if (data.content) {
                strategyContent += data.content;
              }

              if (data.current_step) {
                strategyResult.currentStep = data.current_step;
              }

              // 更新结果
              const updatedResult: DisplayResult = {
                ...strategyResult,
                content: strategyContent,
                steps: steps,
                isComplete: false,
              };

              if (onGenerateStrategy) {
                onGenerateStrategy(updatedResult);
              }
            } catch (e) {
              console.warn("解析流数据失败:", e);
            }
          }
        }
      }

      // 完成生成
      const finalResult: DisplayResult = {
        ...strategyResult,
        content: strategyContent,
        steps: steps,
        isComplete: true,
        currentStep: undefined,
      };

      if (onGenerateStrategy) {
        onGenerateStrategy(finalResult);
      }

      // 计算执行时间
      const duration = Date.now() - startTime;

      // 记录策略生成结果
      console.log("[StepResultDisplay] 准备记录策略生成结果到数据库:", {
        requestData: {
          searchResult: !!searchResult,
          originalEssayFile: !!originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        resultData: !!finalResult,
        isSuccess: true,
        duration,
      });

      await logStrategyResult(
        {
          searchResult,
          originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        finalResult,
        true,
        duration
      );
      console.log("[StepResultDisplay] 策略生成结果已记录到数据库");

      toast({
        title: "改写策略生成完成",
        description: "已成功生成个人陈述改写策略",
      });
    } catch (error) {
      console.error("生成改写策略失败:", error);

      // 计算执行时间（即使失败也要记录）
      const duration = Date.now() - startTime;

      // 记录失败的策略生成结果
      console.log("[StepResultDisplay] 准备记录失败的策略生成结果到数据库:", {
        requestData: {
          searchResult: !!searchResult,
          originalEssayFile: !!originalEssayFile,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        resultData: null,
        isSuccess: false,
        duration,
        errorMessage: error instanceof Error ? error.message : "未知错误",
      });

      await logStrategyResult(
        {
          searchResult,
          originalEssayFile: originalEssayFile || null,
          customStrategyGeneratorRole,
          customStrategyGeneratorTask,
          customStrategyGeneratorOutputFormat,
        },
        null,
        false,
        duration,
        error instanceof Error ? error.message : "未知错误"
      );

      console.log("[StepResultDisplay] 失败的策略生成结果已记录到数据库");

      toast({
        variant: "destructive",
        title: "生成失败",
        description:
          error instanceof Error ? error.message : "改写策略生成失败",
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  return (
    <Card className="shadow-md h-full flex flex-col border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-3 pb-4 pt-5 px-5 flex-shrink-0 bg-gradient-to-br from-stone-200/60 to-zinc-200/50">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-stone-200 to-zinc-200/95 flex items-center justify-center">
          <FileText className="h-5 w-5 text-stone-700" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base font-medium text-stone-700">
            {/* @ts-ignore */}
            {result._isStepContent && result._stepTitle
              ? `${title} - ${result._stepTitle}`
              : title}
          </CardTitle>
          <p className="text-sm text-stone-600">
            {new Date(result.timestamp).toLocaleString()}
            {/* @ts-ignore */}
            {result._isStepContent && (
              <span className="ml-2 text-xs text-stone-500">(步骤详情)</span>
            )}
          </p>
        </div>

        {/* 显示完整内容按钮 */}
        {/* @ts-ignore */}
        {result._isStepContent && onShowFullContent && (
          <Button
            variant="outline"
            size="sm"
            className="mr-2 text-xs bg-white/80 hover:bg-white/90 border-stone-300"
            onClick={onShowFullContent}
            title="返回查看完整生成内容"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            查看最终结果
          </Button>
        )}

        {/* 撰写改写策略按钮和自定义提示词 */}
        {(() => {
          const hasFile = !!originalEssayFile;
          const hasMaterialDoc = !!materialDoc.trim();
          const hasSearchResult = !!searchResult;
          
          console.log('[StepResultDisplay] 按钮显示条件检查:', {
            hasFile,
            hasMaterialDoc,
            hasSearchResult,
            materialDocLength: materialDoc.length,
            shouldShow: (hasFile || hasMaterialDoc) && hasSearchResult
          });
          
          return (hasFile || hasMaterialDoc) && hasSearchResult;
        })() && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="mr-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleGenerateStrategy}
                disabled={
                  isGeneratingStrategy ||
                  !result.isComplete ||
                  !result.content ||
                  result.currentStep === "生成出错，请重试"
                }
                title={
                  !result.isComplete
                    ? "请等待分稿策略生成完成后再生成改写策略"
                    : !result.content
                    ? "没有可用的分析结果"
                    : result.currentStep === "生成出错，请重试"
                    ? "请先重新生成分稿策略"
                    : "基于当前分析结果生成Essay改写策略"
                }
              >
                {isGeneratingStrategy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    撰写改写策略
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustomPrompts(!showCustomPrompts)}
                className="text-xs hidden hover:bg-stone-100/70"
              >
                {showCustomPrompts ? "隐藏" : "显示"}提示词设置
              </Button>
            </div>

            {/* 自定义策略生成提示词输入区域 */}
            {showCustomPrompts && (
              <Card className="mt-2 border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90">
                <CardHeader className="pb-2 bg-gradient-to-r from-stone-200/60 to-zinc-200/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-stone-700">
                      策略生成自定义提示词
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs px-2 py-1 h-6 hover:bg-stone-100/70"
                      onClick={() => {
                        setCustomStrategyGeneratorRole("");
                        setCustomStrategyGeneratorTask("");
                        setCustomStrategyGeneratorOutputFormat("");
                        toast({
                          title: "已清空",
                          description: "策略生成提示词已重置",
                        });
                      }}
                    >
                      <RefreshCcw className="h-3 w-3 mr-1 text-stone-600" />
                      重置
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <Label htmlFor="strategy-role" className="text-xs">
                      策略生成角色提示词
                    </Label>
                    <Textarea
                      id="strategy-role"
                      value={customStrategyGeneratorRole}
                      onChange={(e) =>
                        setCustomStrategyGeneratorRole(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：你是一位专业的Essay改写策略专家，擅长分析学术写作需求..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>

                  <div>
                    <Label htmlFor="strategy-task" className="text-xs">
                      策略生成任务提示词
                    </Label>
                    <Textarea
                      id="strategy-task"
                      value={customStrategyGeneratorTask}
                      onChange={(e) =>
                        setCustomStrategyGeneratorTask(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：请根据搜索结果和原稿分析，制定详细的Essay改写策略..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>

                  <div>
                    <Label htmlFor="strategy-format" className="text-xs">
                      策略生成输出格式提示词
                    </Label>
                    <Textarea
                      id="strategy-format"
                      value={customStrategyGeneratorOutputFormat}
                      onChange={(e) =>
                        setCustomStrategyGeneratorOutputFormat(e.target.value)
                      }
                      className="mt-1 min-h-[50px] text-xs"
                      placeholder="例如：请按照结构化格式输出改写策略，包含分析要点、改进建议等..."
                      disabled={isGeneratingStrategy}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardHeader>

      {/* 加载状态显示 */}
      {result.currentStep && (
        <div className="flex items-center gap-2 px-6 py-3 text-sm text-stone-600 bg-stone-200/60 border-t border-b border-stone-300/30 flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-stone-700" />
          <span>{result.currentStep}</span>
        </div>
      )}

      {/* 主要内容区域 */}
      <CardContent className="pt-6 px-6 pb-6 overflow-y-auto flex-grow custom-scrollbar bg-stone-50/50">
        <ContentRenderer content={processedContent} />
      </CardContent>
    </Card>
  );
}

export default StepResultDisplay;

/**
 * SectionalFileUploadForm 组件 - 现代化设计
 *
 * 功能：分稿助理的文件上传表单，支持初稿文件和支持文件上传
 *
 * 核心特性：
 * 1. 文件上传：
 *    - 初稿文件上传（必需）
 *    - 支持文件上传（可选）
 *    - 文件类型验证
 *    - 文件大小限制
 *
 * 2. 用户输入：
 *    - 分稿需求文本输入
 *    - 实时字符计数
 *    - 输入验证
 *
 * 3. 表单验证：
 *    - 必填字段检查
 *    - 文件格式验证
 *    - 提交前验证
 *
 * 4. 用户体验：
 *    - 拖拽上传支持
 *    - 上传进度显示
 *    - 错误提示
 *    - 成功反馈
 *
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 触摸友好
 *
 * @author EssayMaker Team
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Send, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DisplayResult } from "../../types";
import { apiService } from "@/app/console/essaymaker/api";
import { useSectionalLogger } from "./hooks/useSectionalLogger";

// 🆕 导入拆分的组件
import { QueryInputSection } from "./components/QueryInputSection";
import { PersonalizationSection } from "./components/PersonalizationSection";
import { FileUploadSection } from "./components/FileUploadSection";

interface SectionalFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  onDataUpdate?: (
    file: File | null,
    searchData: string,
    personalizationRequirements?: string
  ) => void;
  onScrollToResult?: () => void;
  onClearAll?: () => void;
}

export function SectionalFileUploadForm({
  onStepChange,
  setResult,
  onDataUpdate,
  onScrollToResult,
  onClearAll,
}: SectionalFileUploadFormProps) {
  const [userInput, setUserInput] = useState("");
  const [originalEssayFile, setOriginalEssayFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🆕 新增：卡片折叠状态
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🆕 新增：个性化需求定制状态
  const [personalizationRequirements, setPersonalizationRequirements] =
    useState("");

  // 🆕 新增：自定义提示词状态（保留状态变量但不显示UI）
  const [customWebSearcherRole, setCustomWebSearcherRole] =
    useState<string>("");
  const [customWebSearcherTask, setCustomWebSearcherTask] =
    useState<string>("");
  const [customWebSearcherOutputFormat, setCustomWebSearcherOutputFormat] =
    useState<string>("");

  // 拖拽状态管理
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);

  const { toast } = useToast();

  // 🆕 新增：数据存储Hook
  const { logSearchResult } = useSectionalLogger();

  // 处理查询提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!userInput.trim()) {
      setError("请输入查询内容");
      return;
    }

    if (!originalEssayFile) {
      setError("请上传初稿文件");
      return;
    }

    // 清除之前的错误
    setError("");
    setIsLoading(true);

    // 🆕 新增：点击生成查询结果按钮后自动折叠表单
    setIsCollapsed(true);

    // 🆕 新增：记录开始时间用于性能监控
    const startTime = Date.now();

    try {
      console.log("开始调用分稿助理API...");
      console.log("自定义提示词:", {
        role: customWebSearcherRole,
        task: customWebSearcherTask,
        outputFormat: customWebSearcherOutputFormat,
      });

      // 🆕 修改：直接调用第一步API，传递自定义提示词
      const response = await apiService.streamEssayRewriteSearchAndAnalyze(
        userInput,
        supportFiles, // 支持文件
        customWebSearcherRole,
        customWebSearcherTask,
        customWebSearcherOutputFormat,
        personalizationRequirements // 🆕 新增：传递个性化需求参数
      );

      console.log("分稿助理API响应:", response);

      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");

        // 🆕 新的流式处理逻辑：直接处理后端返回的JSON格式
        let accumulatedSteps: string[] = [];
        let stepContents: Record<string, string> = {};
        let currentStepName = "";
        let currentStepContent = "";
        let finalResult: DisplayResult | null = null;

        const reader = response.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解码数据
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 按行分割数据
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // 保留最后一行（可能不完整）

            for (const line of lines) {
              let trimmedLine = line.trim();
              if (!trimmedLine) continue;

              // 处理SSE格式的'data: '前缀
              if (trimmedLine.startsWith("data: ")) {
                trimmedLine = trimmedLine.substring(6);
              }

              // 跳过SSE的其他控制消息
              if (
                trimmedLine === "" ||
                trimmedLine.startsWith("event:") ||
                trimmedLine.startsWith("id:")
              ) {
                continue;
              }

              try {
                const data = JSON.parse(trimmedLine);
                console.log("收到数据:", data);

                if (data.type === "step") {
                  // 🔑 处理步骤数据：左侧新增一行

                  // 如果之前有步骤，先保存其内容
                  if (currentStepName && currentStepContent) {
                    stepContents[currentStepName] = currentStepContent;
                    console.log(
                      `保存步骤内容: ${currentStepName}`,
                      currentStepContent.substring(0, 100) + "..."
                    );
                  }

                  // 开始新步骤
                  currentStepName = data.content;
                  currentStepContent = ""; // 重置右侧内容

                  // 添加到步骤列表
                  if (!accumulatedSteps.includes(currentStepName)) {
                    accumulatedSteps.push(currentStepName);
                    console.log(`新增步骤: ${currentStepName}`);
                  }

                  // 实时更新UI：显示新步骤，清空右侧内容
                  if (setResult) {
                    const updatedResult: DisplayResult = {
                      content: currentStepContent, // 新步骤开始时内容为空
                      timestamp: new Date().toISOString(),
                      steps: [...accumulatedSteps],
                      currentStep: currentStepName,
                      isComplete: false,
                    } as DisplayResult;
                    setResult(updatedResult);
                  }
                } else if (data.type === "content") {
                  // 🔑 处理内容数据：右侧累积显示

                  // 根据content_type处理不同类型的内容
                  let contentToAdd = data.content || "";

                  if (data.content_type === "ai_thinking") {
                    // AI思考过程内容可以特殊处理，比如加上特殊标记
                    contentToAdd = data.content || "";
                  } else {
                    // 默认内容直接累积
                    contentToAdd = data.content || "";
                  }

                  // 累积到当前步骤的内容
                  currentStepContent += contentToAdd;
                  console.log(
                    `累积内容到步骤 ${currentStepName}:`,
                    contentToAdd.substring(0, 50) + "..."
                  );

                  // 实时更新UI：显示累积的内容
                  if (setResult) {
                    const updatedResult: DisplayResult = {
                      content: currentStepContent,
                      timestamp: new Date().toISOString(),
                      steps: [...accumulatedSteps],
                      currentStep: currentStepName,
                      isComplete: false,
                    } as DisplayResult;
                    setResult(updatedResult);
                  }

                  // 传递数据给父组件
                  if (onDataUpdate) {
                    onDataUpdate(
                      originalEssayFile,
                      currentStepContent,
                      personalizationRequirements
                    );
                  }
                } else if (data.type === "complete") {
                  // 🔑 处理完成信号

                  // 保存最后一个步骤的内容
                  if (currentStepName && currentStepContent) {
                    stepContents[currentStepName] = currentStepContent;
                  }

                  // 最终更新
                  if (setResult) {
                    finalResult = {
                      content: currentStepContent,
                      timestamp: new Date().toISOString(),
                      steps: [...accumulatedSteps],
                      currentStep: undefined,
                      isComplete: true,
                      _stepContents: stepContents,
                    } as DisplayResult;
                    setResult(finalResult);
                  }

                  if (onDataUpdate) {
                    onDataUpdate(
                      originalEssayFile,
                      currentStepContent,
                      personalizationRequirements
                    );
                  }

                  console.log("流式处理完成，最终步骤:", accumulatedSteps);
                  console.log("步骤内容映射:", stepContents);
                  break;
                }
              } catch (parseError) {
                console.warn(
                  "解析JSON失败:",
                  trimmedLine.substring(0, 100) + "...",
                  parseError
                );
                // 如果不是JSON格式，作为普通文本处理
                currentStepContent += trimmedLine + "\n";

                if (setResult) {
                  const updatedResult: DisplayResult = {
                    content: currentStepContent,
                    timestamp: new Date().toISOString(),
                    steps: [...accumulatedSteps],
                    currentStep: currentStepName,
                    isComplete: false,
                  } as DisplayResult;
                  setResult(updatedResult);
                }
              }
            }
          }

          // 流处理结束，确保最后的内容被保存
          if (currentStepName && currentStepContent) {
            stepContents[currentStepName] = currentStepContent;
          }

          // 最终状态更新
          if (setResult && !finalResult) {
            finalResult = {
              content: currentStepContent,
              timestamp: new Date().toISOString(),
              steps: [...accumulatedSteps],
              currentStep: undefined,
              isComplete: true,
              _stepContents: stepContents,
            } as DisplayResult;
            setResult(finalResult);
          }

          // 🆕 新增：计算执行时间
          const duration = Date.now() - startTime;

          // 🆕 新增：记录搜索分析结果
          if (finalResult) {
            await logSearchResult(
              {
                userInput,
                originalEssayFile,
                supportFiles,
                customWebSearcherRole,
                customWebSearcherTask,
                customWebSearcherOutputFormat,
              },
              finalResult,
              true,
              duration
            );
            console.log("[SectionalFileUploadForm] 搜索分析结果已记录到数据库");
          }

          toast({
            title: "查询成功",
            description: "查询结果已生成完成",
          });
        } catch (streamError) {
          console.error("流式处理出错:", streamError);
          throw streamError;
        }
      }
    } catch (error) {
      console.error("查询失败:", error);

      // 🆕 新增：计算执行时间（即使失败也要记录）
      const duration = Date.now() - startTime;

      // 🆕 新增：记录失败的搜索分析结果
      await logSearchResult(
        {
          userInput,
          originalEssayFile,
          supportFiles,
          customWebSearcherRole,
          customWebSearcherTask,
          customWebSearcherOutputFormat,
        },
        null,
        false,
        duration,
        error instanceof Error ? error.message : "未知错误"
      );

      setError(error instanceof Error ? error.message : "查询失败，请重试");

      // 🆕 出错时也保持结果对象，显示错误状态
      if (setResult) {
        setResult({
          content: "",
          steps: [],
          currentStep: "请求失败，请重试",
          timestamp: new Date().toISOString(),
          isComplete: true,
          isError: true,
          errorMessage: error instanceof Error ? error.message : "未知错误",
        } as DisplayResult);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = userInput.trim() && originalEssayFile && !isLoading;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card
        className="border shadow-md bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-xl overflow-hidden"
        style={{ border: "none !important", outline: "none !important" }}
      >
        {/* 🆕 新增：折叠状态下的摘要显示 */}
        {isCollapsed ? (
          <CardHeader
            className={`py-4 px-6 rounded-t-xl ${
              !isLoading
                ? "cursor-pointer hover:bg-stone-100/70 transition-colors"
                : ""
            }`}
            onClick={!isLoading ? () => setIsCollapsed(false) : undefined}
            style={{ border: "none !important", boxShadow: "none !important" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                  <Sparkles className="h-5 w-5 text-stone-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-600">
                    {isLoading ? "正在生成分析..." : "查询已完成"}
                  </div>
                  <div className="text-lg font-medium truncate text-stone-800">
                    {userInput.length > 50
                      ? `${userInput.substring(0, 50)}...`
                      : userInput}
                  </div>
                </div>
              </div>
              {!isLoading && (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <span>展开编辑</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              )}
            </div>
          </CardHeader>
        ) : (
          <>
            <CardHeader
              className="pb-4 bg-gradient-to-r from-stone-200/60 to-zinc-200/50 border-b border-stone-300/30 rounded-t-xl"
              style={{
                border: "none !important",
                boxShadow: "none !important",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                    <Sparkles className="h-6 w-6 text-stone-700" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-stone-800">
                    课程信息智能查询
                  </CardTitle>
                </div>
                {canSubmit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(true)}
                    className="text-stone-600 hover:text-stone-800 hover:bg-stone-100/70"
                  >
                    <ChevronUp className="h-4 w-4 mr-1" />
                    收起
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pt-6 pb-6 bg-stone-50/50 rounded-b-xl">
              {/* 🔄 使用拆分后的组件 */}
              <QueryInputSection
                userInput={userInput}
                setUserInput={setUserInput}
                isLoading={isLoading}
              />

              <Separator className="my-6" />

              <PersonalizationSection
                personalizationRequirements={personalizationRequirements}
                setPersonalizationRequirements={setPersonalizationRequirements}
                isLoading={isLoading}
              />

              <Separator className="my-6" />

              <FileUploadSection
                originalEssayFile={originalEssayFile}
                setOriginalEssayFile={setOriginalEssayFile}
                supportFiles={supportFiles}
                setSupportFiles={setSupportFiles}
                isDraggingOriginal={isDraggingOriginal}
                setIsDraggingOriginal={setIsDraggingOriginal}
                isDraggingSupport={isDraggingSupport}
                setIsDraggingSupport={setIsDraggingSupport}
                isLoading={isLoading}
              />

              {/* 错误提示 */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 提交按钮 */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-stone-700 hover:bg-stone-800 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      开始查询
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* 添加CSS样式来确保圆角效果 */}
      <style jsx>{`
        .rounded-xl {
          border-radius: 0.75rem !important;
          overflow: hidden !important;
        }
        .rounded-t-xl {
          border-top-left-radius: 0.75rem !important;
          border-top-right-radius: 0.75rem !important;
        }
        .rounded-b-xl {
          border-bottom-left-radius: 0.75rem !important;
          border-bottom-right-radius: 0.75rem !important;
        }
      `}</style>
    </div>
  );
}

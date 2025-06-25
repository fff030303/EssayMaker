/**
 * CottonUptoFileUploadForm 组件 - 现代化设计
 *
 * 功能：Cotton Upto 助手的文件上传表单，支持文档文件和内容上传
 *
 * 核心特性：
 * 1. 文件上传：
 *    - 主要文件上传（必需）
 *    - 支持文件上传（可选）
 *    - 文件类型验证
 *    - 文件大小限制
 *
 * 2. 用户输入：
 *    - 内容需求文本输入
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
 * @version 1.0.0
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
import { useCottonUptoLogger } from "./hooks/useCottonUptoLogger";

// 导入拆分的组件
import { QueryInputSection } from "./components/QueryInputSection";
import { PersonalizationSection } from "./components/PersonalizationSection";
import { FileUploadSection } from "./components/FileUploadSection";

interface CottonUptoFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  onDataUpdate?: (
    file: File | null,
    analysisData: string,
    personalizationRequirements?: string,
    materialDoc?: string
  ) => void;
  onScrollToResult?: () => void;
  onClearAll?: () => void;
}

export function CottonUptoFileUploadForm({
  onStepChange,
  setResult,
  onDataUpdate,
  onScrollToResult,
  onClearAll,
}: CottonUptoFileUploadFormProps) {
  const [userInput, setUserInput] = useState("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 卡片折叠状态
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 个性化需求定制状态
  const [personalizationRequirements, setPersonalizationRequirements] =
    useState("");

  // 自定义提示词状态（保留状态变量但不显示UI）
  const [customWebSearcherRole, setCustomWebSearcherRole] =
    useState<string>("");
  const [customWebSearcherTask, setCustomWebSearcherTask] =
    useState<string>("");
  const [customWebSearcherOutputFormat, setCustomWebSearcherOutputFormat] =
    useState<string>("");

  // 拖拽状态管理
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);

  // 文档粘贴模式状态
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState<string>("");

  const { toast } = useToast();

  // 数据存储Hook
  const { logAnalysisResult } = useCottonUptoLogger();

  // 处理查询提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证输入
    if (!userInput.trim()) {
      setError("请输入查询内容");
      return;
    }

    // 检查是否有内容（文件或粘贴文本，有任意一个即可）
    if (!originalFile && !pastedText.trim()) {
      setError("请上传文件或粘贴内容");
      return;
    }

    // 清除之前的错误
    setError("");
    setIsLoading(true);

    // 点击生成查询结果按钮后自动折叠表单
    setIsCollapsed(true);

    // 记录开始时间用于性能监控
    const startTime = Date.now();

    try {
      console.log("开始调用 Cotton Upto 助手API...");
      console.log("自定义提示词:", {
        role: customWebSearcherRole,
        task: customWebSearcherTask,
        outputFormat: customWebSearcherOutputFormat,
      });

      // 调用通用的内容分析API
      const materialDoc = pastedText.trim();
      const response = await apiService.streamGeneralQuery(
        userInput,
        originalFile ? [originalFile, ...supportFiles] : supportFiles
      );

      console.log("Cotton Upto 助手API响应:", response);

      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");

        // 流式处理逻辑
        let accumulatedContent = "";
        let currentStep = "正在分析内容...";
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
            buffer = lines.pop() || "";

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

                if (data.type === "content" && data.content) {
                  accumulatedContent += data.content;
                } else if (data.type === "step" && data.step) {
                  currentStep = data.step;
                } else if (data.type === "complete") {
                  // 处理完成信号
                  finalResult = {
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    steps: [currentStep],
                    currentStep: undefined,
                    isComplete: true,
                  };
                  break;
                }

                // 实时更新结果
                if (setResult) {
                  const currentResult: DisplayResult = {
                    content: accumulatedContent,
                    timestamp: new Date().toISOString(),
                    steps: [currentStep],
                    currentStep: currentStep,
                    isComplete: false,
                  };
                  setResult(currentResult);
                }
              } catch (parseError) {
                console.error("解析JSON数据失败:", parseError, "原始数据:", trimmedLine);
                // 如果不是JSON格式，直接当作内容处理
                accumulatedContent += trimmedLine + "\n";
              }
            }
          }

          // 如果没有接收到完成信号，创建最终结果
          if (!finalResult) {
            finalResult = {
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              steps: [currentStep],
              currentStep: undefined,
              isComplete: true,
            };
          }

          console.log("流式处理完成，最终结果:", finalResult);

          // 设置最终结果
          if (setResult && finalResult) {
            setResult(finalResult);
          }

          // 记录成功日志
          await logAnalysisResult(
            {
              userInput,
              originalFile: originalFile?.name,
              supportFiles: supportFiles.map(f => f.name),
              personalizationRequirements,
              materialDoc: materialDoc.substring(0, 100) + "...",
              timestamp: new Date().toISOString(),
            },
            finalResult || {
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              steps: [],
              isComplete: true,
            },
            true,
            Date.now() - startTime
          );

          // 更新数据状态
          if (onDataUpdate) {
            onDataUpdate(
              originalFile,
              accumulatedContent,
              personalizationRequirements,
              materialDoc
            );
          }

          // 滚动到结果区域
          if (onScrollToResult) {
            setTimeout(onScrollToResult, 500);
          }

        } catch (streamError) {
          console.error("处理流式响应时出错:", streamError);
          throw streamError;
        }
      } else {
        throw new Error("未收到有效的流式响应");
      }

    } catch (error) {
      console.error("Cotton Upto 助手API调用失败:", error);
      setError(error instanceof Error ? error.message : "处理请求时发生错误");
      
      // 记录失败日志
      await logAnalysisResult(
        {
          userInput,
          originalFile: originalFile?.name,
          supportFiles: supportFiles.map(f => f.name),
          timestamp: new Date().toISOString(),
        },
        {
          content: "",
          timestamp: new Date().toISOString(),
          steps: [],
          isComplete: true,
        },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : "Unknown error"
      );

      toast({
        variant: "destructive",
        title: "处理失败",
        description: error instanceof Error ? error.message : "处理请求时发生错误",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 检查表单是否可以提交
  const canSubmit = userInput.trim() && (originalFile || pastedText.trim()) && !isLoading;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <Card
        className="border shadow-md bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-xl overflow-hidden"
        style={{ border: "none !important", outline: "none !important" }}
      >
        {/* 折叠状态下的摘要显示 */}
        {isCollapsed ? (
          <CardHeader
            className={`py-4 px-6 rounded-t-xl ${
              !isLoading
                ? "cursor-pointer hover:bg-stone-100/70 transition-colors"
                : ""
            }`}
            onClick={!isLoading ? () => setIsCollapsed(false) : undefined}
            style={{
              border: "none !important",
              boxShadow: "none !important",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                  <Sparkles className="h-5 w-5 text-stone-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-600">
                    {isLoading ? "正在分析内容..." : "信息已填写"}
                  </div>
                  <div className="text-lg font-medium truncate text-stone-800">
                    {userInput || "Cotton Upto 内容生成"}
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
          // 展开状态下的完整表单
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
                    套瓷查询
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
              {/* 查询输入区域 */}
              <QueryInputSection
                userInput={userInput}
                setUserInput={setUserInput}
                isLoading={isLoading}
              />

              <Separator className="my-6" />

              {/* 个性化需求定制区域 */}
              <PersonalizationSection
                personalizationRequirements={personalizationRequirements}
                setPersonalizationRequirements={setPersonalizationRequirements}
                isLoading={isLoading}
              />

              <Separator className="my-6" />

              {/* 文件上传区域 */}
              <FileUploadSection
                originalFile={originalFile}
                setOriginalFile={setOriginalFile}
                supportFiles={supportFiles}
                setSupportFiles={setSupportFiles}
                isLoading={isLoading}
                isDraggingOriginal={isDraggingOriginal}
                setIsDraggingOriginal={setIsDraggingOriginal}
                isDraggingSupport={isDraggingSupport}
                setIsDraggingSupport={setIsDraggingSupport}
                isPasteMode={isPasteMode}
                setPasteMode={setIsPasteMode}
                pastedText={pastedText}
                setPastedText={setPastedText}
              />

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 提交按钮区域 */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  size="lg"
                  className="px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-stone-700 hover:bg-stone-800 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      开始分析
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
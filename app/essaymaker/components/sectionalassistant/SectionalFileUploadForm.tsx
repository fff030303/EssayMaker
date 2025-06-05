/**
 * SectionalFileUploadForm 组件
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
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  X,
  Loader2,
  Send,
  ArrowUp,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DisplayResult } from "../../types";
import { apiService } from "@/lib/api";
import { useSectionalLogger } from "./hooks/useSectionalLogger";

interface SectionalFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  onDataUpdate?: (file: File | null, searchData: string) => void;
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

  // 🆕 新增：自定义提示词状态
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

  // 文件输入引用
  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const supportFilesInputRef = useRef<HTMLInputElement>(null);

  // 🆕 新增：数据存储Hook
  const { logSearchResult } = useSectionalLogger();

  // 文件验证函数
  const validateFile = (
    file: File,
    isOriginalFile: boolean = false
  ): { isValid: boolean; error?: string } => {
    let allowedTypes: string[];
    let maxSize: number;

    if (isOriginalFile) {
      // 原始初稿文件只允许DOCX格式
      allowedTypes = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `文件 ${file.name} 类型不支持，初稿文件只支持DOCX格式`,
        };
      }
    } else {
      // 支持文件允许PDF、JPG、JPEG、PNG格式
      allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `文件 ${file.name} 类型不支持，支持文件只支持PDF、JPG、JPEG、PNG格式`,
        };
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `文件 ${file.name} 大小超过10MB限制`,
      };
    }

    return { isValid: true };
  };

  // 处理初稿文件拖拽
  const handleOriginalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(true);
  };

  const handleOriginalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(false);
  };

  const handleOriginalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // 只取第一个文件
      const validation = validateFile(file, true);

      if (validation.isValid) {
        setOriginalEssayFile(file);
        toast({
          title: "文件上传成功",
          description: `已上传初稿文件：${file.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "文件类型不支持",
          description: validation.error,
        });
      }
    }
  };

  // 处理支持文件拖拽
  const handleSupportDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(true);
  };

  const handleSupportDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(false);
  };

  const handleSupportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(false);

    const files = Array.from(e.dataTransfer.files);

    // 验证文件数量
    if (supportFiles.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "文件数量超限",
        description: "最多只能上传5个支持文件",
      });
      return;
    }

    // 验证每个文件
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file, false);

      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast({
          variant: "destructive",
          title: "文件类型不支持",
          description: validation.error,
        });
      }
    }

    if (validFiles.length > 0) {
      setSupportFiles((prev) => [...prev, ...validFiles]);
      toast({
        title: "文件上传成功",
        description: `已上传 ${validFiles.length} 个支持文件`,
      });
    }
  };

  // 处理初稿文件上传
  const handleOriginalFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFile(file, true);

      if (validation.isValid) {
        setOriginalEssayFile(file);
        toast({
          title: "文件上传成功",
          description: `已上传初稿文件：${file.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "文件上传失败",
          description: validation.error,
        });
      }
    }
  };

  // 处理支持文件上传
  const handleSupportFilesUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    // 验证文件数量（最多5个支持文件）
    if (supportFiles.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "文件数量超限",
        description: "最多只能上传5个支持文件",
      });
      return;
    }

    // 验证每个文件
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file, false);

      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast({
          variant: "destructive",
          title: "文件上传失败",
          description: validation.error,
        });
      }
    }

    if (validFiles.length > 0) {
      setSupportFiles((prev) => [...prev, ...validFiles]);
      toast({
        title: "文件上传成功",
        description: `已上传 ${validFiles.length} 个支持文件`,
      });
    }
  };

  // 移除初稿文件
  const removeOriginalFile = () => {
    setOriginalEssayFile(null);
    if (originalFileInputRef.current) {
      originalFileInputRef.current.value = "";
    }
  };

  // 移除支持文件
  const removeSupportFile = (index: number) => {
    setSupportFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
    setResult?.(null);

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
        customWebSearcherOutputFormat
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
                    onDataUpdate(originalEssayFile, currentStepContent);
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
                    } as DisplayResult;
                    setResult(finalResult);
                  }

                  if (onDataUpdate) {
                    onDataUpdate(originalEssayFile, currentStepContent);
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
            title: "生成成功",
            description: "分稿策略已生成完成",
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        {/* 🆕 新增：折叠状态下的摘要显示 */}
        {isCollapsed ? (
          <>
            <CardHeader className="py-2 px-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-400 truncate">
                    <span className="font-normal">正在执行查询：</span>
                    <span className="text-gray-500">
                      "
                      {userInput.length > 60
                        ? `${userInput.substring(0, 60)}...`
                        : userInput}
                      "
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(false)}
                    disabled={isLoading}
                    className="h-8 px-2 text-gray-400 hover:text-gray-600"
                  >
                    <ChevronDown className="h-4 w-4" />
                    展开
                  </Button>
                </div>
              </div>
            </CardHeader>
          </>
        ) : (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  分稿查询设置
                </CardTitle>
                {/* 🆕 新增：展开状态下的折叠按钮（仅在有内容时显示） */}
                {userInput.trim() && originalEssayFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(true)}
                    className="ml-2"
                  >
                    <ChevronUp className="h-4 w-4" />
                    折叠
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 pt-4">
              {/* 分稿需求输入 */}
              <div className="space-y-2">
                <Label htmlFor="user-input">查询需求描述</Label>
                <span className="text-red-500 ml-0.5">*</span>
                <span className="ml-1 text-xs text-red-500">(必填)</span>
                <Textarea
                  id="user-input"
                  placeholder="请描述您的查询需求，例如：请提供南加州大学(USC) 经济学硕士课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="min-h-[120px]"
                  disabled={isLoading}
                />
                <div className="text-sm text-gray-500 text-right">
                  {userInput.length} 字符
                </div>

                {/* 🆕 新增：快捷查询按钮 */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    快捷查询模板：
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供南加州大学(USC) 经济学硕士课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。"
                        )
                      }
                      disabled={isLoading}
                    >
                      USC 经济学硕士
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供斯坦福大学计算机科学硕士课程的详细信息，包括专业方向、核心课程、研究领域、申请要求和就业前景。"
                        )
                      }
                      disabled={isLoading}
                    >
                      斯坦福 CS 硕士
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供哈佛商学院MBA课程的详细信息，包括课程结构、核心科目、选修方向、案例研究方法和校友网络。"
                        )
                      }
                      disabled={isLoading}
                    >
                      哈佛 MBA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供麻省理工学院(MIT) 电子工程硕士课程的详细信息，包括研究方向、实验室资源、课程设置和技术要求。"
                        )
                      }
                      disabled={isLoading}
                    >
                      MIT 电子工程
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供加州大学伯克利分校数据科学硕士课程的详细信息，包括统计学基础、机器学习课程、项目实践和行业合作。"
                        )
                      }
                      disabled={isLoading}
                    >
                      UC Berkeley 数据科学
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() =>
                        setUserInput(
                          "请提供哥伦比亚大学金融工程硕士课程的详细信息，包括量化分析、风险管理、金融建模和实习机会。"
                        )
                      }
                      disabled={isLoading}
                    >
                      哥大 金融工程
                    </Button>
                  </div>
                </div>
              </div>

              {/* 文件上传区域 - 更紧凑的布局 */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                {/* 左侧 - 原始初稿文件上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center">
                    原始初稿文件 <span className="text-red-500 ml-0.5">*</span>
                    <span className="ml-1 text-xs text-red-500">(必填)</span>
                  </label>
                  <div
                    className={`border border-dashed rounded-md p-3 transition-colors cursor-pointer ${
                      isDraggingOriginal
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                    } ${isLoading && "opacity-50 cursor-not-allowed"}`}
                    onDragOver={handleOriginalDragOver}
                    onDragLeave={handleOriginalDragLeave}
                    onDrop={handleOriginalDrop}
                    onClick={
                      originalEssayFile
                        ? undefined
                        : () => originalFileInputRef.current?.click()
                    }
                  >
                    <input
                      ref={originalFileInputRef}
                      type="file"
                      accept=".docx"
                      onChange={handleOriginalFileUpload}
                      className="hidden"
                      disabled={isLoading}
                    />

                    {originalEssayFile ? (
                      <div className="flex items-center p-2 border rounded bg-muted/50">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm flex-1 truncate">
                          {originalEssayFile.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOriginalFile();
                          }}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[120px]">
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          点击或拖放文件到此处上传
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          只支持 DOCX 格式
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 右侧 - 支持文件上传 */}
                <div>
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      支持文件（选填）
                    </label>
                    {supportFiles.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSupportFiles([])}
                      >
                        清空全部
                      </Button>
                    )}
                  </div>
                  <div
                    className={`border border-dashed rounded-md p-3 transition-colors cursor-pointer ${
                      isDraggingSupport
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                    } ${isLoading && "opacity-50 cursor-not-allowed"}`}
                    onDragOver={handleSupportDragOver}
                    onDragLeave={handleSupportDragLeave}
                    onDrop={handleSupportDrop}
                    onClick={
                      supportFiles.length > 0
                        ? undefined
                        : () => supportFilesInputRef.current?.click()
                    }
                  >
                    <input
                      ref={supportFilesInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleSupportFilesUpload}
                      className="hidden"
                      disabled={isLoading}
                    />

                    {supportFiles.length > 0 ? (
                      <div className="space-y-2 max-h-[120px] overflow-y-auto">
                        {supportFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center p-2 border rounded bg-muted/50"
                          >
                            <FileText className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm flex-1 truncate">
                              {file.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSupportFile(index);
                              }}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            supportFilesInputRef.current?.click();
                          }}
                          disabled={isLoading}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1" />
                          添加更多文件
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[120px]">
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          添加额外支持材料（可选）
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持 PDF, JPG, JPEG, PNG 格式
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 自定义提示词输入框 */}
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    自定义提示词设置（可选）
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1 h-6"
                    onClick={() => {
                      setCustomWebSearcherRole("");
                      setCustomWebSearcherTask("");
                      setCustomWebSearcherOutputFormat("");
                      toast({
                        title: "已清空",
                        description: "提示词已重置",
                      });
                    }}
                  >
                    重置提示词
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    网络搜索角色提示词
                  </label>
                  <Textarea
                    placeholder="例如：你是一位专业的学术信息搜索专家，擅长查找和分析大学课程信息..."
                    className="min-h-[80px] resize-y"
                    value={customWebSearcherRole}
                    onChange={(e) => setCustomWebSearcherRole(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    网络搜索任务提示词
                  </label>
                  <Textarea
                    placeholder="例如：请根据用户的查询需求，搜索相关的学术信息并进行详细分析..."
                    className="min-h-[80px] resize-y"
                    value={customWebSearcherTask}
                    onChange={(e) => setCustomWebSearcherTask(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    网络搜索输出格式提示词
                  </label>
                  <Textarea
                    placeholder="例如：请按照结构化的格式输出搜索结果，包含课程概述、核心内容、学习要求等部分..."
                    className="min-h-[80px] resize-y"
                    value={customWebSearcherOutputFormat}
                    onChange={(e) =>
                      setCustomWebSearcherOutputFormat(e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isLoading || !userInput.trim() || !originalEssayFile
                  }
                  className="px-8"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      生成查询结果
                    </>
                  )}
                </Button>
              </div>
            </CardContent>

            {/* 控制按钮区域 - 放在Card底部 */}
            <CardFooter className="px-4 py-3 flex justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 h-8"
                  onClick={() => {
                    // 清空所有输入和文件
                    setUserInput("");
                    setOriginalEssayFile(null);
                    setSupportFiles([]);
                    setCustomWebSearcherRole("");
                    setCustomWebSearcherTask("");
                    setCustomWebSearcherOutputFormat("");

                    // 🆕 重置折叠状态
                    setIsCollapsed(false);

                    // 🆕 清空生成的结果
                    if (setResult) {
                      setResult(null);
                    }

                    // 🆕 重置文件输入框的值
                    if (originalFileInputRef.current) {
                      originalFileInputRef.current.value = "";
                    }
                    if (supportFilesInputRef.current) {
                      supportFilesInputRef.current.value = "";
                    }

                    // 显示清空提示
                    toast({
                      title: "已清空",
                      description: "所有内容和结果已重置",
                    });

                    // 🆕 调用清空所有内容回调
                    if (onClearAll) {
                      onClearAll();
                    }
                  }}
                  disabled={isLoading}
                >
                  <RefreshCcw className="h-3 w-3 mr-1" /> 清空所有内容
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}

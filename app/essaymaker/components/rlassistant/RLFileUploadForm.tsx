"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Upload,
  X,
  Loader2,
  ArrowUp,
  RefreshCcw,
  Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { DisplayResult } from "../../types";
import { AssistantTips } from "../AssistantTips";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface RLFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
}

export function RLFileUploadForm({
  onStepChange,
  setResult,
}: RLFileUploadFormProps = {}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);

  // 推荐信特定字段
  const [writingRequirements, setWritingRequirements] = useState<string>("");
  const [recommenderNumber, setRecommenderNumber] = useState<1 | 2>(1);

  // 自定义提示词状态
  const [customRolePrompt, setCustomRolePrompt] = useState<string>("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState<string>("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] =
    useState<string>("");

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const resumeDropAreaRef = useRef<HTMLDivElement>(null);
  const supportDropAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { processStream } = useStreamResponse();

  // 处理推荐信素材表文件上传
  const handleResumeFile = (file: File) => {
    if (!file) return;
    setResumeFile(file);
    toast({
      title: "推荐信素材表已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 处理支持文件上传
  const handleSupportFiles = (files: File[]) => {
    if (!files.length) return;
    setSupportFiles((prev) => [...prev, ...files]);
    toast({
      title: "支持文件已上传",
      description: `已添加 ${files.length} 个文件`,
    });
  };

  // 删除推荐信素材表文件
  const handleRemoveResumeFile = () => {
    setResumeFile(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
    toast({
      title: "文件已移除",
      description: "推荐信素材表已删除",
    });
  };

  // 删除支持文件
  const handleRemoveSupportFile = (index: number) => {
    setSupportFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 清空所有支持文件
  const handleClearAllSupportFiles = () => {
    if (supportFiles.length === 0) return;
    setSupportFiles([]);
    if (supportInputRef.current) {
      supportInputRef.current.value = "";
    }
    toast({
      title: "文件已清空",
      description: "所有支持文件已删除",
    });
  };

  // 触发文件选择对话框
  const triggerResumeFileInput = () => {
    resumeInputRef.current?.click();
  };

  const triggerSupportFileInput = () => {
    supportInputRef.current?.click();
  };

  // 处理文件选择
  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleResumeFile(file);
    }
  };

  const handleSupportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      handleSupportFiles(files);
    }
  };

  // 快速输入按钮处理
  const handleButtonClick = (text: string) => {
    if (text === "X位推荐人") {
      setWritingRequirements((prev) => prev + "请撰写第X位推荐人的推荐信\n");
      return;
    }
    setWritingRequirements((prev) => prev + text);
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传推荐信素材表",
      });
      return;
    }

    if (!writingRequirements.trim()) {
      toast({
        variant: "destructive",
        title: "要求缺失",
        description: "请填写推荐信写作要求",
      });
      return;
    }

    setIsLoading(true);
    setStreamContent("");
    setIsComplete(false);

    // 创建结果对象
    const resultObject: DisplayResult = {
      content: "",
      steps: [],
      timestamp: new Date().toISOString(),
      isComplete: false,
      currentStep: "生成推荐信分析",
    };

    // 更新结果状态
    if (setResult) {
      setResult(resultObject);
    }

    // 显示处理中提示
    toast({
      title: "正在处理",
      description: "推荐信分析正在生成中...",
    });

    // 立即跳转到第二步
    if (onStepChange) {
      onStepChange(2);
    }

    try {
      // 使用apiService中的推荐信生成方法
      const response = await apiService.generateRecommendationLetter(
        resumeFile,
        writingRequirements,
        recommenderNumber,
        supportFiles,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );

      console.log("API响应类型:", typeof response);

      // 检查响应类型
      if (response instanceof ReadableStream) {
        console.log("接收到流式响应，开始处理...");

        await processStream(response, {
          onUpdate: (result) => {
            setStreamContent(result.content);
            if (setResult) {
              setResult({
                ...result,
                currentStep: result.currentStep || "推荐信分析中",
              });
            }
          },
          onComplete: (result) => {
            setStreamContent(result.content);
            setIsComplete(true);
            setIsLoading(false); // 🆕 立即取消加载状态
            if (setResult) {
              setResult({
                ...result,
                currentStep: "推荐信分析完成",
              });
            }
            toast({
              title: "已提交",
              description: "您的推荐信分析已完成",
            });
          },
          onError: (error) => {
            console.error("处理推荐信时出错:", error);
            toast({
              variant: "destructive",
              title: "处理失败",
              description: "处理推荐信时发生错误，请重试",
            });
            if (setResult) {
              setResult({
                content: `生成推荐信时出错: ${error}`,
                steps: [],
                timestamp: new Date().toISOString(),
                isComplete: true,
                currentStep: "出错",
              });
            }
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 1,
        });
      } else {
        // 普通JSON响应
        console.log("API响应数据:", response);

        if (response && typeof response === "object") {
          const responseObj = response as any;
          const content = responseObj?.text || JSON.stringify(response);
          setStreamContent(content);
          setIsComplete(true);
          setIsLoading(false); // 立即取消加载状态

          if (setResult) {
            setResult({
              content,
              steps: [],
              timestamp: new Date().toISOString(),
              isComplete: true,
              currentStep: "推荐信分析完成",
            });
          }
        }
      }
    } catch (error) {
      console.error("提交推荐信时出错:", error);
      toast({
        variant: "destructive",
        title: "提交失败",
        description: "上传推荐信时发生错误，请重试",
      });

      if (setResult) {
        setResult({
          content: `生成推荐信时出错: ${error}`,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "出错",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
      <Card className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col space-y-1.5">
              <CardTitle className="text-xl font-semibold">
                推荐信助理
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                上传推荐信素材表，生成专业的推荐信分析和建议
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <AssistantTips />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-4">
          <div className="grid grid-cols-1 gap-3">
            {/* 文件上传区域 */}
            <div className="grid grid-cols-1 gap-4 mt-1">
              {/* 推荐信素材表上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  推荐信素材表 <span className="text-red-500">*</span>
                </label>
                <div
                  ref={resumeDropAreaRef}
                  className={cn(
                    "rounded-md p-3 transition-colors cursor-pointer",
                    resumeFile ? "border-0" : "border border-dashed",
                    isDraggingResume
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={resumeFile ? undefined : triggerResumeFileInput}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingResume(false);

                    if (
                      e.dataTransfer?.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      const file = e.dataTransfer.files[0];
                      handleResumeFile(file);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={resumeInputRef}
                    onChange={handleResumeFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    disabled={isLoading}
                  />

                  {resumeFile ? (
                    <div className="flex items-center p-2 border rounded bg-muted/50">
                      <FileText className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm flex-1 truncate">
                        {resumeFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveResumeFile();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[80px]">
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        点击或拖拽上传推荐信素材表
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持 PDF、DOC、DOCX 格式
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 支持文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  辅助支持材料（可选）
                </label>
                <div
                  ref={supportDropAreaRef}
                  className={cn(
                    "rounded-md p-3 transition-colors cursor-pointer",
                    "border border-dashed",
                    isDraggingSupport
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={triggerSupportFileInput}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingSupport(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingSupport(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingSupport(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingSupport(false);

                    if (
                      e.dataTransfer?.files &&
                      e.dataTransfer.files.length > 0
                    ) {
                      const fileList = Array.from(e.dataTransfer.files);
                      handleSupportFiles(fileList);
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={supportInputRef}
                    onChange={handleSupportFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    multiple
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
                              handleRemoveSupportFile(index);
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
                          triggerSupportFileInput();
                        }}
                        disabled={isLoading}
                      >
                        <ArrowUp className="h-3.5 w-3.5 mr-1" />
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
                        如成绩单、项目经历等
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 推荐信写作要求输入区域 */}
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  推荐信写作要求 <span className="text-red-500">*</span>
                </label>

                {/* 快速输入按钮 */}
                <div className="mb-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleButtonClick(
                        "请撰写学术推荐信，重点突出学术能力和研究潜力。"
                      )
                    }
                    disabled={isLoading}
                  >
                    学术推荐信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleButtonClick(
                        "请撰写工作推荐信，重点突出工作能力和职业素养。"
                      )
                    }
                    disabled={isLoading}
                  >
                    工作推荐信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleButtonClick(
                        "请撰写实习推荐信，重点突出实习期间的表现和成长。"
                      )
                    }
                    disabled={isLoading}
                  >
                    实习推荐信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleButtonClick("X位推荐人")}
                    disabled={isLoading}
                  >
                    X位推荐人
                  </Button>
                </div>

                <Textarea
                  placeholder="请详细描述您对推荐信的具体要求，例如：推荐人身份、重点突出的能力、推荐信用途等..."
                  className="min-h-[100px] resize-y"
                  value={writingRequirements}
                  onChange={(e) => setWritingRequirements(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* 推荐人选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  推荐人数量
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommender"
                      value={1}
                      checked={recommenderNumber === 1}
                      onChange={() => setRecommenderNumber(1)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    第1位推荐人
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="recommender"
                      value={2}
                      checked={recommenderNumber === 2}
                      onChange={() => setRecommenderNumber(2)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    第2位推荐人
                  </label>
                </div>
              </div>
            </div>

            {/* 自定义提示词输入框 */}
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  自定义角色提示词
                </label>
                <Textarea
                  placeholder="例如：你是一位经验丰富的推荐信写作专家，擅长为学术申请撰写有说服力的推荐信..."
                  className="min-h-[80px] resize-y"
                  value={customRolePrompt}
                  onChange={(e) => setCustomRolePrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  自定义任务提示词
                </label>
                <Textarea
                  placeholder="例如：请根据提供的材料，分析推荐信写作要点，并生成推荐信大纲和建议..."
                  className="min-h-[80px] resize-y"
                  value={customTaskPrompt}
                  onChange={(e) => setCustomTaskPrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  自定义输出格式提示词
                </label>
                <Textarea
                  placeholder="例如：请按照标准的推荐信格式输出，包含推荐人信息、申请者评价、具体事例等部分..."
                  className="min-h-[80px] resize-y"
                  value={customOutputFormatPrompt}
                  onChange={(e) => setCustomOutputFormatPrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 其他说明区域 */}
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                支持文件格式: PDF, DOC, DOCX。文件大小不超过10MB。
              </p>
            </div>
          </div>
        </CardContent>

        {/* 控制按钮区域 */}
        <CardFooter className="px-4 py-3 flex justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-8"
              onClick={() => {
                // 清空所有输入和文件
                setResumeFile(null);
                setSupportFiles([]);
                setWritingRequirements("");
                setCustomRolePrompt("");
                setCustomTaskPrompt("");
                setCustomOutputFormatPrompt("");

                // 重置文件输入元素
                if (resumeInputRef.current) {
                  resumeInputRef.current.value = "";
                }
                if (supportInputRef.current) {
                  supportInputRef.current.value = "";
                }

                toast({
                  title: "已清空",
                  description: "所有内容已重置",
                });
              }}
            >
              <RefreshCcw className="h-3 w-3 mr-1" /> 清空所有内容
            </Button>
          </div>

          <div className="flex gap-2 justify-end items-center">
            <Button
              variant="default"
              size="default"
              className="flex items-center gap-1"
              onClick={handleSubmit}
              disabled={isLoading || !resumeFile || !writingRequirements.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> 提交推荐信素材获取分析
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

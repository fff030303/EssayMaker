/**
 * RLFileUploadForm 组件 - 现代化设计
 *
 * 功能：推荐信助理的文件上传表单组件，处理推荐信相关文件的上传和管理
 *
 * 核心特性：
 * 1. 文件上传管理：
 *    - 支持多种文件格式（PDF、Word、图片等）
 *    - 拖拽上传和点击选择
 *    - 文件预览和删除功能
 *    - 上传进度指示
 *
 * 2. 文件分类：
 *    - 推荐信文件：现有推荐信文档
 *    - 支持材料：简历、成绩单等
 *    - 其他文件：证书、作品集等
 *    - 智能文件类型识别
 *
 * 3. 表单验证：
 *    - 文件格式验证
 *    - 文件大小限制
 *    - 必填字段检查
 *    - 实时验证反馈
 *
 * 4. 用户输入：
 *    - 推荐人信息填写
 *    - 申请方向选择
 *    - 特殊要求说明
 *    - 自动保存草稿
 *
 * 5. 数据处理：
 *    - 文件内容解析
 *    - 数据格式转换
 *    - 信息提取和整理
 *    - 错误处理和重试
 *
 * 6. 用户体验：
 *    - 直观的操作界面
 *    - 清晰的状态指示
 *    - 友好的错误提示
 *    - 响应式设计
 *
 * 支持的文件类型：
 * - DOCX, XLSX, XLS, PPTX, PPT
 * - TXT, MD, CSV, PDF
 * - JPG, JPEG, PNG
 *
 * @author EssayMaker Team
 * @version 2.0.0 - 现代化重设计
 */

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
  CheckCircle,
  Files,
  MessageSquareQuote,
  User,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/app/console/essaymaker/api";
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
import { RLRequest } from "./RLRequest";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { ToastAction } from "@/components/ui/toast";
import { useRLLogger } from "./hooks/useRLLogger";
import { Separator } from "@/components/ui/separator";

interface RLFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  // 新增：写作需求传递回调
  onWritingRequirementsChange?: (requirements: string) => void;
}

// 支持的文件格式
const SUPPORTED_FILE_TYPES = [
  ".docx",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".txt",
  ".md",
  ".csv",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
];

// 文件格式验证函数
const validateFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return SUPPORTED_FILE_TYPES.some((type) => fileName.endsWith(type));
};

// 获取文件扩展名
const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf("."));
};

// 格式化文件大小显示
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function RLFileUploadForm({
  onStepChange,
  setResult,
  onWritingRequirementsChange,
}: RLFileUploadFormProps = {}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);

  // 推荐信特定字段
  const [recommenderNumber, setRecommenderNumber] = useState<1 | 2>(1);

  // 新增：RLRequest组件需要的状态
  const [recommenderPosition, setRecommenderPosition] = useState<1 | 2 | 3>(1);
  const [recommenderPositionType, setRecommenderPositionType] = useState<
    "preset" | "custom"
  >("preset");
  const [customRecommenderPosition, setCustomRecommenderPosition] =
    useState<string>("");
  const [gender, setGender] = useState<"男生" | "女生" | "">("男生");
  const [additionalRequirements, setAdditionalRequirements] =
    useState<string>("");

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
  const { logAnalysisResult } = useRLLogger();

  // 处理推荐信素材表文件上传
  const handleResumeFile = (file: File) => {
    if (!file) return;

    // 验证文件格式
    if (!validateFileType(file)) {
      const fileExt = getFileExtension(file.name);
      toast({
        title: "文件格式不支持",
        description: `文件格式 ${fileExt} 不受支持。`,
        variant: "destructive",
      });
      return;
    }

    setResumeFile(file);
    toast({
      title: "推荐信素材表已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 处理支持文件上传
  const handleSupportFiles = (files: File[]) => {
    if (!files.length) return;

    // 验证所有文件格式
    const invalidFiles = files.filter((file) => !validateFileType(file));

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles
        .map((file) => `${file.name} (${getFileExtension(file.name)})`)
        .join(", ");
      toast({
        title: "部分文件格式不支持",
        description: `以下文件格式不受支持：${invalidFileNames}。`,
        variant: "destructive",
      });

      // 只添加格式正确的文件
      const validFiles = files.filter((file) => validateFileType(file));
      if (validFiles.length > 0) {
        setSupportFiles((prev) => [...prev, ...validFiles]);
        toast({
          title: "部分文件已上传",
          description: `已添加 ${validFiles.length} 个有效文件`,
        });
      }
      return;
    }

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

  // 处理提交
  const handleSubmit = async () => {
    console.log("[RLFileUploadForm] handleSubmit 被调用");
    console.log("[RLFileUploadForm] 当前推荐信文件:", resumeFile?.name);
    console.log(
      "[RLFileUploadForm] logAnalysisResult函数:",
      typeof logAnalysisResult
    );

    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传推荐信素材表",
      });
      return;
    }

    // 验证必填字段
    if (
      recommenderPositionType === "custom" &&
      !customRecommenderPosition.trim()
    ) {
      toast({
        variant: "destructive",
        title: "信息缺失",
        description: "请填写推荐人位置",
      });
      return;
    }

    if (!gender) {
      toast({
        variant: "destructive",
        title: "信息缺失",
        description: "请选择被推荐人的性别",
      });
      return;
    }

    const startTime = Date.now(); // 记录开始时间，用于计算处理时长

    // 构建完整的写作要求
    let fullWritingRequirements = "";

    // 添加推荐人位置信息
    if (recommenderPositionType === "preset") {
      fullWritingRequirements += `请撰写第${recommenderPosition}位推荐人的推荐信。`;
    } else {
      fullWritingRequirements += `请撰写第${customRecommenderPosition}位推荐人的推荐信。`;
    }

    // 添加性别信息
    fullWritingRequirements += `被推荐人是${gender}。`;

    // 添加额外要求
    if (additionalRequirements.trim()) {
      fullWritingRequirements += `其他写作要求：${additionalRequirements}`;
    }

    // 🆕 通过回调函数传递写作需求给父组件
    if (onWritingRequirementsChange) {
      onWritingRequirementsChange(fullWritingRequirements);
    }

    setIsLoading(true);
    setStreamContent("");
    setIsComplete(false);

    // 创建结果对象，包含写作需求信息
    const resultObject: DisplayResult = {
      content: "",
      steps: [],
      timestamp: new Date().toISOString(),
      isComplete: false,
      currentStep: "生成推荐信分析",
      // 🆕 在结果对象中包含写作需求
      writingRequirements: fullWritingRequirements,
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
      // 使用apiService中的推荐信生成方法，传入构建的完整要求
      const response = await apiService.generateRecommendationLetter(
        resumeFile,
        fullWritingRequirements, // 使用构建的完整要求
        recommenderNumber.toString(),
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
                // 🆕 确保写作需求被保留
                writingRequirements: fullWritingRequirements,
              });
            }
          },
          onComplete: async (result) => {
            setStreamContent(result.content);
            setIsComplete(true);
            setIsLoading(false); // 🆕 立即取消加载状态

            // 记录成功的分析结果
            await logAnalysisResult(
              {
                fileContent: resumeFile.name,
                supportFiles: supportFiles.map((f) => f.name),
                writingRequirements: fullWritingRequirements,
                hasCustomPrompt: !!(
                  customRolePrompt ||
                  customTaskPrompt ||
                  customOutputFormatPrompt
                ),
              },
              {
                content: result.content,
                isComplete: true,
                currentStep: "推荐信分析完成",
              },
              true,
              Date.now() - startTime
            );

            if (setResult) {
              setResult({
                ...result,
                currentStep: "推荐信分析完成",
                // 🆕 确保写作需求被保留
                writingRequirements: fullWritingRequirements,
              });
            }
            toast({
              title: "已提交",
              description: "您的推荐信分析已完成",
            });
          },
          onError: async (error) => {
            console.error("处理推荐信时出错:", error);

            // 记录失败的分析结果
            await logAnalysisResult(
              {
                fileContent: resumeFile.name,
                supportFiles: supportFiles.map((f) => f.name),
                writingRequirements: fullWritingRequirements,
                hasCustomPrompt: !!(
                  customRolePrompt ||
                  customTaskPrompt ||
                  customOutputFormatPrompt
                ),
              },
              { content: "", error: true },
              false,
              Date.now() - startTime,
              error instanceof Error ? error.message : "处理推荐信时发生错误"
            );

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
                // 🆕 即使出错也保留写作需求
                writingRequirements: fullWritingRequirements,
              });
            }
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 0.2, // 字符显示间隔0.2毫秒
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

          // 记录成功的分析结果
          await logAnalysisResult(
            {
              fileContent: resumeFile.name,
              supportFiles: supportFiles.map((f) => f.name),
              writingRequirements: fullWritingRequirements,
              hasCustomPrompt: !!(
                customRolePrompt ||
                customTaskPrompt ||
                customOutputFormatPrompt
              ),
            },
            { content, isComplete: true, currentStep: "推荐信分析完成" },
            true,
            Date.now() - startTime
          );

          if (setResult) {
            setResult({
              content,
              steps: [],
              timestamp: new Date().toISOString(),
              isComplete: true,
              currentStep: "推荐信分析完成",
              // 🆕 确保写作需求被保留
              writingRequirements: fullWritingRequirements,
            });
          }
        }
      }
    } catch (error) {
      console.error("提交推荐信时出错:", error);

      // 记录失败的分析结果
      await logAnalysisResult(
        {
          fileContent: resumeFile.name,
          supportFiles: supportFiles.map((f) => f.name),
          writingRequirements: fullWritingRequirements,
          hasCustomPrompt: !!(
            customRolePrompt ||
            customTaskPrompt ||
            customOutputFormatPrompt
          ),
        },
        { content: "", error: true },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : "上传推荐信时发生错误"
      );

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
          // 🆕 即使出错也保留写作需求
          writingRequirements: fullWritingRequirements,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 全屏加载动画 - 在生成过程中显示 */}
      {isLoading && (
        <FullScreenLoadingAnimation text="正在进行推荐信分析报告，请勿切换页面..." />
      )}

      <div className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-stone-200/60 to-zinc-200/50 border-b border-stone-300/30 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                <Mail className="h-6 w-6 text-stone-700" />
              </div>
              <CardTitle className="text-xl font-semibold text-stone-800">
                推荐信材料上传
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4 bg-gradient-to-b from-stone-50/30 to-zinc-50/20">
            <div className="space-y-6">
              {/* 🔄 文件上传区域 - 左右布局节省空间 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 推荐信素材表上传 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">推荐信素材表</h3>
                    <Badge
                      variant="destructive"
                      className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
                    >
                      必需
                    </Badge>
                  </div>

                  {resumeFile ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-sm font-medium">
                              {resumeFile.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(resumeFile.size)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveResumeFile}
                          disabled={isLoading}
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={resumeDropAreaRef}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer",
                        isDraggingResume
                          ? "border-stone-500 bg-stone-100/30"
                          : "border-stone-300 hover:border-stone-400 hover:bg-stone-100/40",
                        isLoading && "opacity-50 pointer-events-none"
                      )}
                      onClick={triggerResumeFileInput}
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
                        accept=".docx,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.pdf,.jpg,.jpeg,.png"
                        disabled={isLoading}
                      />
                      <Upload className="h-6 w-6 mx-auto mb-2 text-stone-600" />
                      <div className="text-sm font-medium mb-1">
                        点击上传或拖拽文件
                      </div>
                      <div className="text-xs text-muted-foreground">
                        推荐DOCX格式（≤10MB）
                      </div>
                    </div>
                  )}
                </div>

                {/* 支持材料上传 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Files className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">支持材料</h3>
                    <Badge
                      variant="outline"
                      className="ml-2 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
                    >
                      可选
                    </Badge>
                  </div>

                  {/* 已上传的支持文件列表 */}
                  {supportFiles.length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {supportFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSupportFile(index)}
                            disabled={isLoading}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 支持文件上传区域 */}
                  <div
                    ref={supportDropAreaRef}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer",
                      isDraggingSupport
                        ? "border-stone-500 bg-stone-100/30"
                        : "border-stone-300 hover:border-stone-400 hover:bg-stone-100/40",
                      isLoading && "opacity-50 pointer-events-none"
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
                      accept=".docx,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.pdf,.jpg,.jpeg,.png"
                      multiple
                      disabled={isLoading}
                    />
                    <Files className="h-5 w-5 mx-auto mb-2 text-stone-600" />
                    <div className="text-sm mb-1">添加支持材料</div>
                    <div className="text-xs text-muted-foreground">
                      简历、成绩单等
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* 推荐信写作要求输入区域 */}
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    推荐信写作要求 <span className="text-red-500">*</span>
                  </label>

                  {/* 使用新的RLRequest组件 */}
                  <RLRequest
                    recommenderPosition={recommenderPosition}
                    setRecommenderPosition={setRecommenderPosition}
                    recommenderPositionType={recommenderPositionType}
                    setRecommenderPositionType={setRecommenderPositionType}
                    customRecommenderPosition={customRecommenderPosition}
                    setCustomRecommenderPosition={setCustomRecommenderPosition}
                    gender={gender}
                    setGender={setGender}
                    additionalRequirements={additionalRequirements}
                    setAdditionalRequirements={setAdditionalRequirements}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 自定义提示词输入框 */}
              <div className="space-y-4 mt-4 hidden">
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
                    onChange={(e) =>
                      setCustomOutputFormatPrompt(e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          {/* 控制按钮区域 */}
          <CardFooter className="px-4 py-3 flex justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-8 border-stone-300 text-stone-600 hover:bg-stone-100"
                onClick={() => {
                  // 清空所有输入和文件
                  setResumeFile(null);
                  setSupportFiles([]);
                  setCustomRolePrompt("");
                  setCustomTaskPrompt("");
                  setCustomOutputFormatPrompt("");

                  // 清空RLRequest相关状态
                  setRecommenderPosition(1);
                  setRecommenderPositionType("preset");
                  setCustomRecommenderPosition("");
                  setGender("男生");
                  setAdditionalRequirements("");

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
                size="default"
                className="flex items-center gap-1 bg-gradient-to-r from-stone-600 to-stone-700 hover:from-stone-700 hover:to-stone-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleSubmit}
                disabled={isLoading || !resumeFile || !gender.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> 开始分析
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

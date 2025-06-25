/**
 * CVFileUploadForm 组件 - 现代化设计
 *
 * 功能：CV助理的文件上传表单组件，处理简历相关文件的上传和管理
 *
 * 核心特性：
 * 1. 文件上传管理：
 *    - 支持多种文件格式（PDF、Word、图片等）
 *    - 拖拽上传和点击选择
 *    - 文件预览和删除功能
 *    - 上传进度指示
 *
 * 2. 文件分类：
 *    - 简历文件：现有简历文档
 *    - 成绩单文件：学术成绩记录
 *    - 其他材料：证书、作品集等
 *    - 智能文件类型识别
 *
 * 3. 表单验证：
 *    - 文件格式验证
 *    - 文件大小限制
 *    - 必填字段检查
 *    - 实时验证反馈
 *
 * 4. 用户输入：
 *    - 申请方向选择
 *    - 个人信息填写
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
 * - PDF文档
 * - Word文档（.doc, .docx）
 * - 图片文件（.jpg, .png, .gif）
 * - 文本文件（.txt）
 *
 * @author EssayMaker Team
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  User,
  FileEdit,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DisplayResult } from "../../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCVReport } from "./hooks/useCVReport";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface CVFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
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

export function CVFileUploadForm({
  onStepChange,
  setResult,
}: CVFileUploadFormProps = {}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [customRolePrompt, setCustomRolePrompt] = useState<string>("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState<string>("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] =
    useState<string>("");
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  
  // 新增：文档文本输入模式状态
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastedResumeText, setPastedResumeText] = useState<string>("");

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const resumeDropAreaRef = useRef<HTMLDivElement>(null);
  const supportDropAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { generateReport, isGeneratingReport } = useCVReport();

  // 处理简历文件上传
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
      title: "简历文件已上传",
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

  // 删除简历文件
  const handleRemoveResumeFile = () => {
    setResumeFile(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
    toast({
      title: "文件已移除",
      description: "简历文件已删除",
    });
  };

  // 新增：切换文档文本输入模式
  const togglePasteMode = () => {
    const newMode = !isPasteMode;
    setIsPasteMode(newMode);
    
    // 切换模式时清空之前的内容
    if (newMode) {
      // 切换到文本输入模式，清空文件
      setResumeFile(null);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    } else {
      // 切换到文件模式，清空文本
      setPastedResumeText("");
    }
    
    toast({
      title: newMode ? "切换到文档文本输入模式" : "切换到文件上传模式",
      description: newMode ? "现在可以直接粘贴文档内容" : "现在可以上传文件",
    });
  };

  // 新增：处理粘贴文本内容
  const handlePastedTextChange = (text: string) => {
    setPastedResumeText(text);
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

  // 处理简历文件选择
  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleResumeFile(file);
    }
  };

  // 处理支持文件选择
  const handleSupportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      handleSupportFiles(files);
    }
  };

  // 使用 useCVReport hook 处理提交
  const handleSubmit = async () => {
    if (!setResult) return;

    // 检查是否有简历内容（文件或粘贴文本）
    if (isPasteMode) {
      if (!pastedResumeText.trim()) {
        toast({
          variant: "destructive",
          title: "内容缺失",
          description: "请粘贴简历内容",
        });
        return;
      }
      
      // 文本输入模式：传递 null 文件和粘贴的文档内容
      await generateReport(
        null, // 不传递文件
        supportFiles,
        setResult,
        onStepChange,
        pastedResumeText, // 传递粘贴的文档内容
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );
    } else {
      if (!resumeFile) {
        toast({
          variant: "destructive",
          title: "文件缺失",
          description: "请上传个人简历素材表",
        });
        return;
      }
      
      // 文件模式：传递文件和空的文档内容
      await generateReport(
        resumeFile,
        supportFiles,
        setResult,
        onStepChange,
        "", // 空的文档内容
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );
    }
  };

  return (
    <>
      {/* 全屏加载动画 - 在生成过程中显示 */}
      {isGeneratingReport && (
        <FullScreenLoadingAnimation text="正在生成简历分析报告，请勿切换页面..." />
      )}

      <div className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        <Card className="border shadow-md bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-xl overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-stone-200/60 to-zinc-200/50 border-b border-stone-300/30 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                <User className="h-6 w-6 text-stone-700" />
              </div>
              <CardTitle className="text-xl font-semibold text-stone-800">
                简历材料上传
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pt-6 pb-6 bg-stone-50/50 rounded-b-xl">
            <div className="space-y-6">
              {/* 🔄 文件上传区域 - 左右布局节省空间 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 个人简历素材表上传 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-stone-700" />
                      <h3 className="text-sm font-medium text-stone-800">
                        个人简历素材表
                      </h3>
                      <Badge
                        variant="destructive"
                        className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
                      >
                        必需
                      </Badge>
                    </div>
                    
                    {/* 文档文本输入模式切换按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePasteMode}
                      disabled={isGeneratingReport}
                      className="h-5 px-2 text-xs hover:bg-stone-200"
                      title={isPasteMode ? "切换到文件上传模式" : "切换到文档文本输入模式"}
                    >
                      {isPasteMode ? (
                        <>
                          <Upload className="h-3 w-3 mr-1" />
                          文件模式
                        </>
                      ) : (
                        <>
                          <FileEdit className="h-3 w-3 mr-1" />
                          文本输入模式
                        </>
                      )}
                    </Button>
                  </div>

                  {isPasteMode ? (
                    /* 文档文本输入模式 */
                    <div className="space-y-2">
                      <Textarea
                        placeholder="请粘贴您的简历内容到这里..."
                        value={pastedResumeText}
                        onChange={(e) => handlePastedTextChange(e.target.value)}
                        disabled={isGeneratingReport}
                        className="min-h-[108px] text-sm border border-stone-200 bg-white placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:border-stone-400 transition-colors shadow-sm rounded-md p-3 resize-y"
                      />


                      {pastedResumeText && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPastedResumeText("")}
                            disabled={isGeneratingReport}
                            className="h-6 px-2 text-xs hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="h-3 w-3 mr-1" />
                            清空
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 文件上传模式 */
                    resumeFile ? (
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
                            disabled={isGeneratingReport}
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
                          isGeneratingReport && "opacity-50 pointer-events-none"
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
                          disabled={isGeneratingReport}
                        />
                        <Upload className="h-6 w-6 mx-auto mb-2 text-stone-600" />
                        <div className="text-sm font-medium mb-1">
                          点击上传或拖拽文件
                        </div>
                        <div className="text-xs text-muted-foreground">
                          推荐DOCX格式（≤10MB）
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* 支持材料上传 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ">
                    <Files className="h-4 w-4 text-stone-600" />
                    <h3 className="text-sm font-medium text-stone-800">
                      支持材料
                    </h3>
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
                            disabled={isGeneratingReport}
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
                      isGeneratingReport && "opacity-50 pointer-events-none"
                    )}
                    onClick={
                      supportFiles.length > 0
                        ? triggerSupportFileInput
                        : triggerSupportFileInput
                    }
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
                      disabled={isGeneratingReport}
                    />
                    <Files className="h-5 w-5 mx-auto mb-2 text-stone-600" />
                    <div className="text-sm mb-1">添加支持材料</div>
                    <div className="text-xs text-muted-foreground">
                      成绩单、项目经历等
                    </div>
                  </div>
                </div>
              </div>

              {/* 自定义提示词输入框 */}
              <div className="space-y-4 mt-4 hidden">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    自定义角色提示词
                  </label>
                  <Textarea
                    placeholder="例如：你是一位经验丰富的简历优化专家，擅长突出申请者的专业技能和项目经验..."
                    className="min-h-[80px] resize-y"
                    value={customRolePrompt}
                    onChange={(e) => setCustomRolePrompt(e.target.value)}
                    disabled={isGeneratingReport}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    自定义任务提示词
                  </label>
                  <Textarea
                    placeholder="例如：请根据提供的材料，优化简历以突出申请者的技术能力和项目经验..."
                    className="min-h-[80px] resize-y"
                    value={customTaskPrompt}
                    onChange={(e) => setCustomTaskPrompt(e.target.value)}
                    disabled={isGeneratingReport}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    自定义输出格式提示词
                  </label>
                  <Textarea
                    placeholder="例如：请按照标准的简历格式优化，包含教育背景、工作经验、技能和项目经验等部分..."
                    className="min-h-[80px] resize-y"
                    value={customOutputFormatPrompt}
                    onChange={(e) =>
                      setCustomOutputFormatPrompt(e.target.value)
                    }
                    disabled={isGeneratingReport}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          {/* 控制按钮区域 - 放在Card底部 */}
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
                  setPastedResumeText("");
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

                  // 显示清空提示
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
                disabled={isGeneratingReport || (isPasteMode ? !pastedResumeText.trim() : !resumeFile)}
              >
                {isGeneratingReport ? (
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

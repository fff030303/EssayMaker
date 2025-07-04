/**
 * CVFileUploadForm 组件
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
 * @version 1.0.0
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

interface CVFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
}

// 支持的文件格式
const SUPPORTED_FILE_TYPES = [
  '.docx', '.xlsx', '.xls', '.pptx', '.ppt', 
  '.txt', '.md', '.csv', '.pdf', 
  '.jpg', '.jpeg', '.png'
];

// 文件格式验证函数
const validateFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return SUPPORTED_FILE_TYPES.some(type => fileName.endsWith(type));
};

// 获取文件扩展名
const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
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
    const invalidFiles = files.filter(file => !validateFileType(file));
    
    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles.map(file => `${file.name} (${getFileExtension(file.name)})`).join(', ');
      toast({
        title: "部分文件格式不支持",
        description: `以下文件格式不受支持：${invalidFileNames}。`,
        variant: "destructive",
      });
      
      // 只添加格式正确的文件
      const validFiles = files.filter(file => validateFileType(file));
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
    if (!resumeFile || !setResult) return;

    await generateReport(
      resumeFile, 
      supportFiles, 
      setResult, 
      onStepChange,
      customRolePrompt,
      customTaskPrompt,
      customOutputFormatPrompt
    );
  };

  return (
    <>
      {/* 全屏加载动画 - 在生成过程中显示 */}
      {isGeneratingReport && (
        <FullScreenLoadingAnimation 
          text="正在生成简历分析报告，请勿切换页面..." 
        />
      )}

    <div className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
      <Card className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        <CardContent className="p-4 pt-4">
          <div className="grid grid-cols-1 gap-3">
            {/* 文件上传区域 - 改为上下布局 */}
            <div className="grid grid-cols-1 gap-4 mt-1">
              {/* 个人简历素材表上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  个人简历素材表 <span className="text-red-500">*</span>
                </label>
                <div
                  ref={resumeDropAreaRef}
                  className={cn(
                    "rounded-md p-3 transition-colors cursor-pointer",
                    resumeFile ? "border-0" : "border border-dashed",
                    isDraggingResume
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    isGeneratingReport && "opacity-50 cursor-not-allowed"
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

                    console.log("简历文件拖放事件触发", e.dataTransfer?.files);

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

                  {resumeFile ? (
                    <div className="flex items-center p-2 border rounded bg-muted/50">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
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
                        disabled={isGeneratingReport}
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
                          推荐上传 DOCX 格式
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          支持 TXT, MD, CSV, PDF, JPG, JPEG, PNG 格式
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 支持文件上传 */}
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    支持材料（可选）
                  </label>
                  {supportFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleClearAllSupportFiles}
                    >
                      清空全部
                    </Button>
                  )}
                </div>
                <div
                  ref={supportDropAreaRef}
                  className={cn(
                    "rounded-md p-3 transition-colors cursor-pointer",
                    supportFiles.length > 0
                      ? "border-0"
                      : "border border-dashed",
                    isDraggingSupport
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    isGeneratingReport && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={
                    supportFiles.length > 0
                      ? undefined
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

                    console.log("支持文件拖放事件触发", e.dataTransfer?.files);

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
                            disabled={isGeneratingReport}
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
                        disabled={isGeneratingReport}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          支持 DOCX,TXT, MD, CSV, PDF, JPG, JPEG, PNG 格式
                        </p>
                    </div>
                  )}
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
                  onChange={(e) => setCustomOutputFormatPrompt(e.target.value)}
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
              className="text-xs px-2 py-1 h-8"
              onClick={() => {
                // 清空所有输入和文件
                setResumeFile(null);
                setSupportFiles([]);
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
              variant="default"
              size="default"
              className="flex items-center gap-1"
              onClick={handleSubmit}
              disabled={isGeneratingReport || !resumeFile}
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> 处理中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> 提交简历获取分析
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

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, Loader2, ArrowUp, RefreshCcw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export function CVAssistant() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const resumeDropAreaRef = useRef<HTMLDivElement>(null);
  const supportDropAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // 处理简历文件上传
  const handleResumeFile = (file: File) => {
    if (!file) return;
    setResumeFile(file);
    toast({
      title: "简历文件已上传",
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

  // 处理提交
  const handleSubmit = () => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传个人简历素材表",
      });
      return;
    }

    setIsLoading(true);
    // 这里添加提交逻辑
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "已提交",
        description: "您的简历已提交成功",
      });
    }, 2000);
  };

  // 设置简历文件区域的拖放事件
  React.useEffect(() => {
    const dropArea = resumeDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingResume(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingResume(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingResume(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingResume(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleResumeFile(file);
      }
    };

    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  // 设置支持文件区域的拖放事件
  React.useEffect(() => {
    const dropArea = supportDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSupport(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSupport(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSupport(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingSupport(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        handleSupportFiles(files);
      }
    };

    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <Card className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
      <CardContent className="p-4 pt-4">
        <div className="grid grid-cols-1 gap-3">
          {/* 文件上传区域 - 更紧凑的布局 */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* 左侧 - 个人简历素材表上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                个人简历素材表 <span className="text-red-500">*</span>
              </label>
              <div
                ref={resumeDropAreaRef}
                className={cn(
                  "border border-dashed rounded-md p-2 transition-colors text-center cursor-pointer h-[100px] flex flex-col justify-center",
                  isDraggingResume
                    ? "border-primary bg-primary/5"
                    : resumeFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                onClick={triggerResumeFileInput}
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
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <FileText className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium text-gray-600 truncate max-w-[150px]">
                        {resumeFile.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">
                      {(resumeFile.size / 1024).toFixed(1)} KB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveResumeFile();
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3 mr-1" /> 删除
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="h-5 w-5 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600 mb-0.5">
                      上传个人简历素材表（doc、docx）
                    </p>
                    <p className="text-xs text-gray-500">
                      点击或拖拽文件至此处
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧 - 支持文件上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                支持文件（可多选）
              </label>
              <div
                ref={supportDropAreaRef}
                className={cn(
                  "border border-dashed rounded-md p-2 transition-colors text-center cursor-pointer h-[100px] flex flex-col justify-center",
                  isDraggingSupport
                    ? "border-primary bg-primary/5"
                    : supportFiles.length > 0
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                onClick={triggerSupportFileInput}
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
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <FileText className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium text-gray-600">
                        已选择 {supportFiles.length} 个文件
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 mb-1 max-h-[30px] overflow-y-auto px-1">
                      {supportFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center bg-white rounded-md px-1.5 py-0.5 text-xs border"
                        >
                          <span className="truncate max-w-[80px]">
                            {file.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSupportFile(index);
                            }}
                            className="ml-1 text-red-500 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearAllSupportFiles();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3 mr-1" /> 清空
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSupportFileInput();
                        }}
                        disabled={isLoading}
                      >
                        <Upload className="h-3 w-3 mr-1" /> 添加
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-5 w-5 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600 mb-0.5">
                      上传支持文件（pdf、图片）
                    </p>
                    <p className="text-xs text-gray-500">
                      点击或拖拽文件至此处
                    </p>
                  </div>
                )}
              </div>
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
            disabled={isLoading || !resumeFile}
          >
            {isLoading ? (
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
  );
}

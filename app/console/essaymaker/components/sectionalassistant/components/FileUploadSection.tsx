/**
 * FileUploadSection 组件 - 现代化设计
 *
 * 文件上传区域，采用简洁现代的设计风格
 *
 * 特性：
 * - 拖放上传体验
 * - 清晰的文件状态显示
 * - 简化的视觉设计
 * - 直观的操作反馈
 *
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Files,
  FileEdit,
} from "lucide-react";
import { validateFile } from "../utils/fileValidation";

interface FileUploadSectionProps {
  originalEssayFile: File | null;
  setOriginalEssayFile: (file: File | null) => void;
  supportFiles: File[];
  setSupportFiles: (files: File[]) => void;
  isDraggingOriginal: boolean;
  setIsDraggingOriginal: (dragging: boolean) => void;
  isDraggingSupport: boolean;
  setIsDraggingSupport: (dragging: boolean) => void;
  isLoading: boolean;
  // 新增：粘贴模式相关
  isPasteMode?: boolean;
  setPasteMode?: (mode: boolean) => void;
  pastedText?: string;
  setPastedText?: (text: string) => void;
}

export function FileUploadSection({
  originalEssayFile,
  setOriginalEssayFile,
  supportFiles,
  setSupportFiles,
  isDraggingOriginal,
  setIsDraggingOriginal,
  isDraggingSupport,
  setIsDraggingSupport,
  isLoading,
  isPasteMode = false,
  setPasteMode,
  pastedText = "",
  setPastedText,
}: FileUploadSectionProps) {
  const { toast } = useToast();

  // 切换粘贴模式
  const togglePasteMode = () => {
    if (!setPasteMode) return;
    
    const newMode = !isPasteMode;
    setPasteMode(newMode);
    
    // 切换模式时清空之前的内容
    if (newMode) {
      // 切换到粘贴模式，清空文件
      setOriginalEssayFile(null);
    } else {
      // 切换到文件模式，清空文本
      if (setPastedText) {
        setPastedText("");
      }
    }
    
    toast({
      title: newMode ? "切换到文档粘贴模式" : "切换到文件上传模式",
      description: newMode ? "现在可以直接粘贴文档内容" : "现在可以上传文件",
    });
  };

  // 处理初稿文件上传
  const handleOriginalFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateFile(file, true);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setOriginalEssayFile(file);
  };

  // 处理支持文件上传
  const handleSupportFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const validation = validateFile(file, false);
      if (validation.isValid) {
        newFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (newFiles.length > 0) {
      setSupportFiles([...supportFiles, ...newFiles]);
    }
  };

  // 处理拖拽事件
  const handleDragEvents = (
    e: React.DragEvent,
    type: "original" | "support",
    eventType: "enter" | "leave" | "drop"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const setDragging =
      type === "original" ? setIsDraggingOriginal : setIsDraggingSupport;

    switch (eventType) {
      case "enter":
        setDragging(true);
        break;
      case "leave":
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragging(false);
        }
        break;
      case "drop":
        setDragging(false);
        const files = e.dataTransfer?.files;
        if (type === "original") {
          handleOriginalFileUpload(files);
        } else {
          handleSupportFileUpload(files);
        }
        break;
    }
  };

  // 移除文件
  const removeOriginalFile = () => setOriginalEssayFile(null);
  const removeSupportFile = (index: number) => {
    setSupportFiles(supportFiles.filter((_, i) => i !== index));
  };

  // 文件大小格式化
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 🔄 文件上传区域 - 左右布局节省空间 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 初稿文件上传 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-stone-700" />
              <h3 className="text-sm font-medium text-stone-800">初稿文件</h3>
              <Badge
                variant="destructive"
                className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
              >
                必需
              </Badge>
            </div>
            
            {/* 文档粘贴模式切换按钮 */}
            {setPasteMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePasteMode}
                disabled={isLoading}
                className="h-5 px-2 text-xs hover:bg-stone-200"
                title={isPasteMode ? "切换到文件上传模式" : "切换到文档粘贴模式"}
              >
                {isPasteMode ? (
                  <>
                    <Upload className="h-3 w-3 mr-1" />
                    文件模式
                  </>
                ) : (
                  <>
                    <FileEdit className="h-3 w-3 mr-1" />
                    粘贴模式
                  </>
                )}
              </Button>
            )}
          </div>

          {isPasteMode ? (
            // 文档粘贴模式
            <div className="space-y-2">
              <Textarea
                placeholder="请粘贴您的初稿内容到这里..."
                value={pastedText}
                onChange={(e) => setPastedText && setPastedText(e.target.value)}
                disabled={isLoading}
                className="min-h-[108px] text-sm border border-stone-200 bg-white placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:border-stone-400 transition-colors shadow-sm rounded-md p-3 resize-y"
              />

              {pastedText && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPastedText && setPastedText("")}
                    disabled={isLoading}
                    className="h-6 px-2 text-xs hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-3 w-3 mr-1" />
                    清空
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // 文件上传模式
            originalEssayFile ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-sm font-medium text-stone-800">
                        {originalEssayFile.name}
                      </div>
                      <div className="text-xs text-stone-600">
                        {formatFileSize(originalEssayFile.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeOriginalFile}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
                  ${
                    isDraggingOriginal
                      ? "border-stone-500 bg-stone-100/70"
                      : "border-stone-300 hover:border-stone-500 hover:bg-stone-50"
                  }
                  ${isLoading ? "opacity-50 pointer-events-none" : ""}
                `}
                onDragEnter={(e) => handleDragEvents(e, "original", "enter")}
                onDragLeave={(e) => handleDragEvents(e, "original", "leave")}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDragEvents(e, "original", "drop")}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf,.doc,.docx,.txt";
                  input.onchange = (e) =>
                    handleOriginalFileUpload(
                      (e.target as HTMLInputElement).files
                    );
                  input.click();
                }}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-stone-600" />
                <div className="text-sm font-medium mb-1 text-stone-800">
                  点击上传或拖拽文件
                </div>
                <div className="text-xs text-stone-600">
                  PDF、Word、TXT（≤10MB）
                </div>
              </div>
            )
          )}
        </div>

        {/* 支持文件上传 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Files className="h-4 w-4 text-stone-600" />
            <h3 className="text-sm font-medium text-stone-800">支持文件</h3>
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
                  className="flex items-center justify-between p-2 bg-stone-100 border border-stone-200 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-3 w-3 text-stone-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate text-stone-800">
                        {file.name}
                      </div>
                      <div className="text-xs text-stone-600">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSupportFile(index)}
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
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
              ${
                isDraggingSupport
                  ? "border-stone-500 bg-stone-100/70"
                  : "border-stone-300 hover:border-stone-500 hover:bg-stone-50"
              }
              ${isLoading ? "opacity-50 pointer-events-none" : ""}
            `}
            onDragEnter={(e) => handleDragEvents(e, "support", "enter")}
            onDragLeave={(e) => handleDragEvents(e, "support", "leave")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDragEvents(e, "support", "drop")}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".pdf,.doc,.docx,.txt";
              input.multiple = true;
              input.onchange = (e) =>
                handleSupportFileUpload((e.target as HTMLInputElement).files);
              input.click();
            }}
          >
            <Files className="h-5 w-5 mx-auto mb-2 text-stone-600" />
            <div className="text-sm mb-1 text-stone-800">添加相关资料</div>
            <div className="text-xs text-stone-600">课程大纲、教学资料等</div>
          </div>
        </div>
      </div>
    </div>
  );
}

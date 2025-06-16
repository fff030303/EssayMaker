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

import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X, GraduationCap, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  validateDraftFileType,
  validateOtherFileType,
  getFileExtension,
  formatFileSize,
  DRAFT_FILE_TYPES,
  OTHER_FILE_TYPES,
} from "../utils/fileValidation";

interface FileUploadSectionProps {
  draftFile: File | null;
  setDraftFile: (file: File | null) => void;
  otherFiles: File[];
  setOtherFiles: (files: File[]) => void;
  isLoading: boolean;
  // 新增：粘贴模式支持
  isPasteMode?: boolean;
  setPasteMode?: (isPaste: boolean) => void;
  pastedText?: string;
  setPastedText?: (text: string) => void;
}

export function FileUploadSection({
  draftFile,
  setDraftFile,
  otherFiles,
  setOtherFiles,
  isLoading,
  isPasteMode = false,
  setPasteMode,
  pastedText = "",
  setPastedText,
}: FileUploadSectionProps) {
  const { toast } = useToast();

  // 拖拽状态管理
  const [isDraggingDraft, setIsDraggingDraft] = React.useState(false);
  const [isDraggingOther, setIsDraggingOther] = React.useState(false);

  // 文件输入引用
  const draftFileInputRef = useRef<HTMLInputElement>(null);
  const otherFilesInputRef = useRef<HTMLInputElement>(null);
  const draftDropAreaRef = useRef<HTMLDivElement>(null);
  const otherDropAreaRef = useRef<HTMLDivElement>(null);

  // 设置个人陈述素材表文件区域的拖放事件
  useEffect(() => {
    const dropArea = draftDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingDraft(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        if (e.dataTransfer.files.length > 1) {
          toast({
            variant: "destructive",
            title: "只能选择一个个人陈述素材表文件",
            description: "已自动选择第一个文件作为初稿",
          });
        }

        const firstFile = e.dataTransfer.files[0];
        handleDraftFile(firstFile);
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
  }, [toast]);

  // 设置其他文件区域的拖放事件
  useEffect(() => {
    const dropArea = otherDropAreaRef.current;
    if (!dropArea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOther(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        handleOtherFiles(fileList);
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

  // 处理个人陈述素材表文件
  const handleDraftFile = (file: File) => {
    if (!file) return;

    const isValidFormat = validateDraftFileType(file);
    if (!isValidFormat) {
      const fileExt = getFileExtension(file.name);
      toast({
        title: "文件格式不支持",
        description: `个人陈述素材表文件格式 ${fileExt} 不受支持`,
        variant: "destructive",
      });
      return;
    }

    setDraftFile(file);
    toast({
      title: "个人陈述素材表文件已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 处理其他文件
  const handleOtherFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;

    const invalidFiles = newFiles.filter(
      (file) => !validateOtherFileType(file)
    );

    if (invalidFiles.length > 0) {
      const invalidFileNames = invalidFiles
        .map((file) => `${file.name} (${getFileExtension(file.name)})`)
        .join(", ");
      toast({
        title: "部分文件格式不支持",
        description: `以下成绩单文件格式不受支持：${invalidFileNames}。`,
        variant: "destructive",
      });

      const validFiles = newFiles.filter((file) => validateOtherFileType(file));
      if (validFiles.length > 0) {
        const updatedFiles = [...otherFiles, ...validFiles];
        setOtherFiles(updatedFiles);
        toast({
          title: "部分文件已上传",
          description: `已添加 ${validFiles.length} 个有效文件`,
        });
      }
      return;
    }

    const updatedFiles = [...otherFiles, ...newFiles];
    setOtherFiles(updatedFiles);

    toast({
      title: "其他文件已上传",
      description: `已添加 ${newFiles.length} 个文件`,
    });
  };

  // 处理个人陈述素材表文件选择
  const handleDraftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        toast({
          variant: "destructive",
          title: "只能选择一个个人陈述素材表文件",
          description: "已自动选择第一个文件",
        });
      }
      handleDraftFile(e.target.files[0]);
    }
  };

  // 处理其他文件选择
  const handleOtherFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      handleOtherFiles(fileList);
    }
  };

  // 处理删除个人陈述素材表文件
  const handleRemoveDraftFile = () => {
    setDraftFile(null);
    if (draftFileInputRef.current) {
      draftFileInputRef.current.value = "";
    }
    toast({
      title: "文件已移除",
      description: "个人陈述素材表文件已删除",
    });
  };

  // 处理删除其他文件
  const handleRemoveOtherFile = (index: number) => {
    const updatedFiles = otherFiles.filter((_, i: number) => i !== index);
    setOtherFiles(updatedFiles);
  };

  // 处理清空所有其他文件
  const handleClearAllOtherFiles = () => {
    if (otherFiles.length === 0) return;

    setOtherFiles([]);
    if (otherFilesInputRef.current) {
      otherFilesInputRef.current.value = "";
    }

    toast({
      title: "文件已清空",
      description: "所有其他文件已删除",
    });
  };

  // 触发文件选择
  const triggerDraftFileInput = () => {
    draftFileInputRef.current?.click();
  };

  const triggerOtherFilesInput = () => {
    otherFilesInputRef.current?.click();
  };

  // 切换粘贴模式
  const togglePasteMode = () => {
    if (!setPasteMode) return;
    
    const newMode = !isPasteMode;
    setPasteMode(newMode);
    
    // 切换模式时清空之前的内容
    if (newMode) {
      // 切换到粘贴模式，清空文件
      setDraftFile(null);
    } else {
      // 切换到文件模式，清空粘贴内容
      if (setPastedText) {
        setPastedText("");
      }
    }
  };

  // 处理粘贴文本变化
  const handlePastedTextChange = (text: string) => {
    if (setPastedText) {
      setPastedText(text);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-stone-700" />
        <h3 className="text-lg font-medium text-stone-800">文件上传</h3>
      </div>

      {/* 文件上传区域采用网格布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 个人陈述素材表上传 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-stone-700" />
              <h3 className="text-sm font-medium text-stone-800">
                个人陈述素材表
              </h3>
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
            /* 文档粘贴模式 */
            <div className="space-y-2">
              <Textarea
                placeholder="请粘贴您的个人陈述素材内容到这里..."
                value={pastedText}
                onChange={(e) => handlePastedTextChange(e.target.value)}
                disabled={isLoading}
                className="min-h-[108px] text-sm border border-stone-200 bg-white placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:border-stone-400 transition-colors shadow-sm rounded-md p-3 resize-y"
              />

              {pastedText && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePastedTextChange("")}
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
            /* 文件上传模式 */
            <div
              ref={draftDropAreaRef}
              className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                isDraggingDraft
                  ? "border-stone-500 bg-stone-100/30"
                  : "border-stone-300 hover:border-stone-400 hover:bg-stone-100/40",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              onClick={!isLoading ? triggerDraftFileInput : undefined}
            >
              {draftFile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-stone-700" />
                    <span className="text-sm font-medium text-stone-800">
                      {draftFile.name}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600">
                    {formatFileSize(draftFile.size)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDraftFile();
                    }}
                    className="h-6 px-2 text-xs border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400"
                  >
                    <X className="h-3 w-3 mr-1" />
                    移除
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-stone-600" />
                  <div className="text-sm text-stone-700">
                    点击或拖拽上传 DOCX 文件
                  </div>
                  <div className="text-xs text-stone-600">
                    支持格式：{DRAFT_FILE_TYPES.join(", ")}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 成绩单文件上传 */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-stone-700 flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            成绩单文件
            <Badge
              variant="outline"
              className="ml-2 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
            >
              可选
            </Badge>
          </div>
          <div
            ref={otherDropAreaRef}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
              isDraggingOther
                ? "border-stone-500 bg-stone-100/30"
                : "border-stone-300 hover:border-stone-400 hover:bg-stone-100/40",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            onClick={!isLoading ? triggerOtherFilesInput : undefined}
          >
            {otherFiles.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-stone-800">
                  已上传 {otherFiles.length} 个文件
                </div>
                <div className="space-y-1">
                  {otherFiles.slice(0, 3).map((file, index) => (
                    <div
                      key={index}
                      className="text-xs text-stone-600 truncate"
                    >
                      {file.name}
                    </div>
                  ))}
                  {otherFiles.length > 3 && (
                    <div className="text-xs text-stone-600">
                      还有 {otherFiles.length - 3} 个文件...
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearAllOtherFiles();
                  }}
                  className="h-6 px-2 text-xs border-stone-300 text-stone-700 hover:bg-stone-100 hover:border-stone-400"
                >
                  <X className="h-3 w-3 mr-1" />
                  清空
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-stone-600" />
                <div className="text-sm text-stone-700">
                  点击或拖拽上传成绩单
                </div>
                <div className="text-xs text-stone-600">
                  支持格式：{OTHER_FILE_TYPES.join(", ")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入元素 */}
      <input
        ref={draftFileInputRef}
        type="file"
        accept={DRAFT_FILE_TYPES.join(",")}
        onChange={handleDraftFileChange}
        className="hidden"
      />
      <input
        ref={otherFilesInputRef}
        type="file"
        accept={OTHER_FILE_TYPES.join(",")}
        multiple
        onChange={handleOtherFilesChange}
        className="hidden"
      />
    </div>
  );
}

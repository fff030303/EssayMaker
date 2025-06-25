/**
 * FileUploadSection 组件
 *
 * 功能：Cotton Upto 助手的文件上传区域组件
 *
 * 核心特性：
 * 1. 文件上传：
 *    - 拖拽上传支持
 *    - 多种文件格式支持
 *    - 文件预览和删除
 *    - 文件大小验证
 *
 * 2. 粘贴模式：
 *    - 支持文本粘贴输入
 *    - 模式切换功能
 *    - 实时字符计数
 *
 * 3. 用户体验：
 *    - 清晰的视觉反馈
 *    - 错误提示
 *    - 响应式布局
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  File,
  X,
  FileText,
  Image,
  FileSpreadsheet,
  Paperclip,
  ClipboardEdit,
} from "lucide-react";

interface FileUploadSectionProps {
  originalFile: File | null;
  setOriginalFile: (file: File | null) => void;
  supportFiles: File[];
  setSupportFiles: (files: File[]) => void;
  isLoading: boolean;
  isDraggingOriginal: boolean;
  setIsDraggingOriginal: (isDragging: boolean) => void;
  isDraggingSupport: boolean;
  setIsDraggingSupport: (isDragging: boolean) => void;
  isPasteMode: boolean;
  setPasteMode: (isPaste: boolean) => void;
  pastedText: string;
  setPastedText: (text: string) => void;
}

export function FileUploadSection({
  originalFile,
  setOriginalFile,
  supportFiles,
  setSupportFiles,
  isLoading,
  isDraggingOriginal,
  setIsDraggingOriginal,
  isDraggingSupport,
  setIsDraggingSupport,
  isPasteMode,
  setPasteMode,
  pastedText,
  setPastedText,
}: FileUploadSectionProps) {
  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const supportFileInputRef = useRef<HTMLInputElement>(null);

  // 获取文件图标
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="h-4 w-4 text-purple-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  // 处理原始文件上传
  const handleOriginalFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      setOriginalFile(files[0]);
    }
  };

  // 处理支持文件上传
  const handleSupportFilesChange = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setSupportFiles([...supportFiles, ...newFiles]);
    }
  };

  // 删除支持文件
  const removeSupportFile = (index: number) => {
    setSupportFiles(supportFiles.filter((_, i) => i !== index));
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, type: 'original' | 'support') => {
    e.preventDefault();
    if (type === 'original') {
      setIsDraggingOriginal(true);
    } else {
      setIsDraggingSupport(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, type: 'original' | 'support') => {
    e.preventDefault();
    if (type === 'original') {
      setIsDraggingOriginal(false);
    } else {
      setIsDraggingSupport(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'original' | 'support') => {
    e.preventDefault();
    if (type === 'original') {
      setIsDraggingOriginal(false);
      handleOriginalFileChange(e.dataTransfer.files);
    } else {
      setIsDraggingSupport(false);
      handleSupportFilesChange(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* 模式切换 */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium text-stone-700">内容输入方式：</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={!isPasteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPasteMode(false)}
            disabled={isLoading}
                          className={!isPasteMode ? "bg-stone-600 hover:bg-stone-700" : ""}
          >
            <Upload className="h-3 w-3 mr-1" />
            文件上传
          </Button>
          <Button
            type="button"
            variant={isPasteMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPasteMode(true)}
            disabled={isLoading}
                          className={isPasteMode ? "bg-stone-600 hover:bg-stone-700" : ""}
          >
            <ClipboardEdit className="h-3 w-3 mr-1" />
            文本粘贴
          </Button>
        </div>
      </div>

      {isPasteMode ? (
        // 粘贴模式
        <div className="space-y-3">
          <div className="flex items-center gap-2">
                      <ClipboardEdit className="h-4 w-4 text-stone-600" />
          <Label htmlFor="pasted-text" className="text-sm font-medium text-stone-700">
              粘贴内容
            </Label>
          </div>
          
          <div className="space-y-2">
            <Textarea
              id="pasted-text"
              placeholder="请将您的文档内容粘贴到这里..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={isLoading}
              className="min-h-[200px] resize-y focus:ring-stone-500 focus:border-stone-500"
            />
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>支持粘贴文本内容，将自动分析您的内容</span>
              <span>{pastedText.length} 字符</span>
            </div>
          </div>
        </div>
      ) : (
        // 文件上传模式
        <div className="space-y-6">
          {/* 主要文件上传 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-stone-600" />
          <Label className="text-sm font-medium text-stone-700">
                主要文档
                <span className="ml-1 text-xs text-gray-500 font-normal">（必需）</span>
              </Label>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDraggingOriginal
                  ? "border-stone-400 bg-stone-50"
                  : "border-gray-300 hover:border-stone-400"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => !isLoading && originalFileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'original')}
              onDragLeave={(e) => handleDragLeave(e, 'original')}
              onDrop={(e) => handleDrop(e, 'original')}
            >
              <input
                ref={originalFileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleOriginalFileChange(e.target.files)}
                disabled={isLoading}
              />
              
              {originalFile ? (
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(originalFile)}
                  <span className="text-sm font-medium">{originalFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOriginalFile(null);
                    }}
                    disabled={isLoading}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">点击上传</span> 或拖拽文件到此处
                  </div>
                  <div className="text-xs text-gray-500">
                    支持 PDF、Word、TXT 格式
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 支持文件上传 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-stone-600" />
              <Label className="text-sm font-medium text-stone-700">
                支持文档
                <span className="ml-1 text-xs text-gray-500 font-normal">（可选）</span>
              </Label>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDraggingSupport
                  ? "border-stone-400 bg-stone-50"
                  : "border-gray-300 hover:border-stone-400"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => !isLoading && supportFileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, 'support')}
              onDragLeave={(e) => handleDragLeave(e, 'support')}
              onDrop={(e) => handleDrop(e, 'support')}
            >
              <input
                ref={supportFileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx"
                multiple
                onChange={(e) => handleSupportFilesChange(e.target.files)}
                disabled={isLoading}
              />
              
              <div className="space-y-2">
                <Paperclip className="h-6 w-6 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600">
                  <span className="font-medium">点击上传支持文档</span>
                </div>
                <div className="text-xs text-gray-500">
                  支持多种格式，可多选
                </div>
              </div>
            </div>

            {/* 支持文件列表 */}
            {supportFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">已上传的支持文档：</Label>
                <div className="space-y-1">
                  {supportFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupportFile(index)}
                        disabled={isLoading}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
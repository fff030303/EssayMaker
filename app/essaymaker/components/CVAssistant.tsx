"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function CVAssistant() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  
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
    setSupportFiles(prev => [...prev, ...files]);
    toast({
      title: "支持文件已上传",
      description: `已添加 ${files.length} 个文件`,
    });
  };

  // 删除简历文件
  const handleRemoveResumeFile = () => {
    setResumeFile(null);
  };

  // 删除支持文件
  const handleRemoveSupportFile = (index: number) => {
    setSupportFiles(prev => prev.filter((_, i) => i !== index));
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
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 简历文件上传区域 */}
        <div>
          <Label className="block text-base font-medium text-gray-600 mb-1">
            个人简历素材表 <span className="text-red-500">*</span>
          </Label>
          <div
            ref={resumeDropAreaRef}
            className={cn(
              "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
              isDraggingResume
                ? "border-primary bg-primary/5"
                : resumeFile
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            )}
            onClick={triggerResumeFileInput}
          >
            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            
            {resumeFile ? (
              <div className="flex flex-col items-center">
                <FileText className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-base font-medium text-gray-600 mb-1 truncate max-w-full">
                  {resumeFile.name}
                </p>
                <p className="text-base font-medium text-gray-600 mb-2">
                  {(resumeFile.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-base h-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveResumeFile();
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> 删除
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600 mb-1">上传简历文件</p>
                <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
              </div>
            )}
          </div>
        </div>

        {/* 支持文件上传区域 */}
        <div>
          <Label className="block text-base font-medium text-gray-600 mb-1">
            支持文件（可选）
          </Label>
          <div
            ref={supportDropAreaRef}
            className={cn(
              "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
              isDraggingSupport
                ? "border-primary bg-primary/5"
                : supportFiles.length > 0
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            )}
            onClick={triggerSupportFileInput}
          >
            <input
              type="file"
              ref={supportInputRef}
              onChange={handleSupportFileChange}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            
            {supportFiles.length > 0 ? (
              <div className="flex flex-col items-center">
                <FileText className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-base font-medium text-gray-600 mb-1">
                  已上传 {supportFiles.length} 个文件
                </p>
                <div className="max-h-[60px] overflow-y-auto w-full">
                  {supportFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-1 rounded text-sm mb-1">
                      <span className="truncate flex-1 text-gray-700">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSupportFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-base h-7 mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSupportFileInput();
                  }}
                >
                  <Upload className="h-3 w-3 mr-1" /> 添加更多
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600 mb-1">上传支持文件</p>
                <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
                <p className="text-xs text-gray-400 mt-1">支持多个文件</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
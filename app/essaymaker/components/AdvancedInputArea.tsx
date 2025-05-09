// 高级输入区域组件，提供：
// - 申请方向输入框
// - 特定需求输入区域
// - 文件上传功能（分为初稿和其他文件）
// - 适用于初稿和定制内容等需要更复杂输入的场景

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileUp, Loader2, X, ChevronUp, Upload, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { DisplayResult } from "../types";

interface AdvancedInputAreaProps {
  isLoading: boolean;
  type: "draft" | "custom"; // 区分初稿还是定制内容类型
  // 添加新的props用于直接更新父组件状态
  direction: string;
  requirements: string;
  setDirection: (direction: string) => void;
  setRequirements: (requirements: string) => void;
  draftFile: File | null;
  otherFiles: File[];
  setDraftFile: (file: File | null) => void;
  setOtherFiles: (files: File[]) => void;
  onSubmitClick: () => void;
  // 添加输入变化回调
  onInputChange?: () => void;
  // 添加文件变化回调
  onFileChange?: () => void;
  // 新增：初稿文件提纯版状态
  purifiedDraft?: string | null;
  isPurifying?: boolean;
  // 新增：生成最终初稿按钮的回调
  onGenerateFinalDraft?: () => void;
  // 新增：清除生成内容的回调
  onClearGeneratedContent?: () => void;
  // 新增：最终初稿生成结果
  finalDraftResult?: DisplayResult | null;
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft?: boolean;
  // 新增：跳转到步骤的回调函数
  onStepChange?: (step: number) => void;
}

export function AdvancedInputArea({
  isLoading,
  type,
  // 使用父组件传入的状态和更新函数
  direction,
  requirements,
  setDirection,
  setRequirements,
  draftFile,
  otherFiles,
  setDraftFile,
  setOtherFiles,
  onSubmitClick,
  // 添加回调函数
  onInputChange,
  onFileChange,
  // 新增：初稿文件提纯版状态
  purifiedDraft,
  isPurifying,
  // 新增：生成最终初稿的回调
  onGenerateFinalDraft,
  // 新增：清除生成内容的回调
  onClearGeneratedContent,
  // 新增：最终初稿生成结果
  finalDraftResult,
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft,
  // 新增：跳转到步骤的回调函数
  onStepChange,
}: AdvancedInputAreaProps) {
  // 移除本地状态，改用父组件传入的状态
  // const [direction, setDirection] = useState("");
  // const [requirements, setRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatingFinalDraft, setGeneratingFinalDraft] = useState(false);
  
  // 拖拽状态 - 仍保留在本地
  const [isDraggingDraft, setIsDraggingDraft] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);
  
  // 文件输入引用
  const draftFileInputRef = useRef<HTMLInputElement>(null);
  const otherFilesInputRef = useRef<HTMLInputElement>(null);
  
  // 拖放区域引用
  const draftDropAreaRef = useRef<HTMLDivElement>(null);
  const otherDropAreaRef = useRef<HTMLDivElement>(null);
  
  // 使用toast钩子
  const { toast } = useToast();

  // 监听isLoading变化，重置submitting状态
  useEffect(() => {
    if (!isLoading && submitting) {
      setSubmitting(false);
      
      // 当加载完成且之前处于提交状态，自动跳转到第二步
      if (onStepChange && type === "draft") {
        // 延迟300ms再跳转，确保状态更新完成
        setTimeout(() => {
          onStepChange(2);
        }, 300);
      }
    }
  }, [isLoading, submitting, onStepChange, type]);

  // 设置初稿文件区域的拖放事件
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
        // 初稿文件只取第一个文件
        if (e.dataTransfer.files.length > 1) {
          toast({
            variant: "destructive",
            title: "只能选择一个初稿文件",
            description: "已自动选择第一个文件作为初稿",
          });
        }
        handleDraftFile(e.dataTransfer.files[0]);
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

  // 处理初稿文件 - 更新到父组件状态
  const handleDraftFile = (file: File) => {
    if (!file) return;
    setDraftFile(file);
    
    toast({
      title: "初稿文件已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 处理其他文件 - 更新到父组件状态
  const handleOtherFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    
    // 直接合并然后设置，而不是使用函数式更新
    const updatedFiles = [...otherFiles, ...newFiles];
    setOtherFiles(updatedFiles);
    
    toast({
      title: "其他文件已上传",
      description: `已添加 ${newFiles.length} 个文件`,
    });
  };

  // 处理初稿文件选择
  const handleDraftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        toast({
          variant: "destructive",
          title: "只能选择一个初稿文件",
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

  // 处理提交 - 简化成只调用父组件的提交函数
  const handleSubmit = () => {
    // 初稿模式下必须有初稿文件
    if (type === "draft" && !draftFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传初稿文件",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }
    


    // 防止重复提交，设置提交状态
    setSubmitting(true);
    
    // 直接调用父组件提交函数，不在这里构建queryText
    onSubmitClick();
    
  };

  // 监听最终初稿生成状态
  useEffect(() => {
    if (!finalDraftResult) return;

    console.log("检查 finalDraftResult:", {
      isComplete: finalDraftResult.isComplete,
      content: finalDraftResult.content,
      generatingFinalDraft
    });
    
    // 如果内容已经生成完成，直接设置状态为false
    if (finalDraftResult.isComplete) {
      console.log("检测到完成状态，设置 generatingFinalDraft 为 false");
      setGeneratingFinalDraft(false);
    }
  }, [finalDraftResult?.isComplete]);

  // 处理生成最终初稿
  const handleGenerateFinalDraft = () => {
    // 添加日志来检查purifiedDraft的值
    console.log("生成初稿时的purifiedDraft值:", purifiedDraft);
    console.log("生成初稿时的direction值:", direction);
    
    // 首先检查是否填写了申请方向
    if (!direction.trim()) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先填写申请方向",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }
    
    // 然后检查是否存在提纯版内容
    if (!purifiedDraft) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先提交初稿文件生成提纯版",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 调用父组件的回调函数
    if (onGenerateFinalDraft) {
      onGenerateFinalDraft();
    } else {
      console.error("未提供onGenerateFinalDraft回调函数");
    }
  };

  // 处理删除初稿文件
  const handleRemoveDraftFile = () => {
    setDraftFile(null);
    
    // 如果有文件输入元素，重置它
    if (draftFileInputRef.current) {
      draftFileInputRef.current.value = "";
    }
    
    toast({
      title: "文件已移除",
      description: "初稿文件已删除",
    });
  };

  // 处理删除其他文件
  const handleRemoveOtherFile = (index: number) => {
    // 直接过滤然后设置，而不是使用函数式更新
    const updatedFiles = otherFiles.filter((_, i: number) => i !== index);
    setOtherFiles(updatedFiles);
  };

  // 处理清空所有其他文件
  const handleClearAllOtherFiles = () => {
    if (otherFiles.length === 0) return;
    
    // 直接设置为空数组
    setOtherFiles([]);
    
    // 如果有文件输入元素，重置它
    if (otherFilesInputRef.current) {
      otherFilesInputRef.current.value = "";
    }
    
    toast({
      title: "文件已清空",
      description: "所有其他文件已删除",
    });
  };

  // 触发初稿文件选择
  const triggerDraftFileInput = () => {
    draftFileInputRef.current?.click();
  };

  // 触发其他文件选择
  const triggerOtherFilesInput = () => {
    otherFilesInputRef.current?.click();
  };

  // 监听输入变化
  useEffect(() => {
    // 构建查询文本
    let queryText = `请帮我写一份关于${direction}的初稿`;
    
    if (requirements) {
      queryText += `，具体需求：${requirements}`;
    }
    
    console.log("AdvancedInputArea - 输入变化，更新查询文本:", queryText);
    
    // 直接调用父组件函数更新查询文本
    if (onInputChange) {
      onInputChange();
    }
  }, [direction, requirements, onInputChange]);

  // 监听文件变化
  useEffect(() => {
    // 构建文件列表
    const allFiles = draftFile 
      ? [draftFile, ...otherFiles] 
      : [...otherFiles];
    
    console.log("AdvancedInputArea - 文件变化，更新文件数量:", allFiles.length);
    
    // 直接调用父组件函数更新文件
    if (onFileChange) {
      onFileChange();
    }
  }, [draftFile, otherFiles, onFileChange]);

  // 监听生成状态变化
  useEffect(() => {
    console.log("生成状态变化:", {
      generatingFinalDraft,
      finalDraftResult: {
        isComplete: finalDraftResult?.isComplete,
        content: finalDraftResult?.content
      }
    });
  }, [generatingFinalDraft, finalDraftResult?.isComplete]);

  console.log("状态变化:", {
    isLoading,
    submitting,
    generatingFinalDraft,
    disabled: isLoading || submitting || generatingFinalDraft
  });

  return (
    <div className="w-full max-w-[800px] mx-auto mb-8 mt-2">
      <div className="input-gradient-border rounded-3xl">
        <div className="w-full h-full flex flex-col bg-white rounded-[calc(1.5rem-3px)] p-4">
          <div className="grid grid-cols-1 gap-4">
            {/* 申请方向输入框 */}
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                申请方向 <span className="text-red-500">*</span>
              </label>
              <Input
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                placeholder="例如: 计算机科学、经济学、生物医学工程等"
                className="placeholder:text-gray-400 w-full !text-base md:!text-base rounded-md border-gray-300"
                disabled={isLoading || submitting || generatingFinalDraft || isGeneratingFinalDraft}
              />
            </div>

            {/* 特定需求输入区域 */}
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                具体需求（选填）
              </label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="例如：需要包含哪些方面的内容、字数要求、风格要求等"
                className="text-base placeholder:text-gray-400 w-full rounded-md border-gray-300"
                rows={3}
                disabled={isLoading || submitting || generatingFinalDraft || isGeneratingFinalDraft}
              />
            </div>

            {/* 文件上传区域 - 双列布局 */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* 左侧 - 初稿文件上传 */}
              <div>
                <label className="block text-base font-medium text-gray-600 mb-1">
                  {type === "draft" ? (
                    <span>初稿文件 <span className="text-red-500">*</span></span>
                  ) : (
                    "初稿文件（选填）"
                  )}
                </label>
                <div
                  ref={draftDropAreaRef}
                  className={cn(
                    "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
                    isDraggingDraft
                      ? "border-primary bg-primary/5"
                      : draftFile
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    (isLoading || submitting || generatingFinalDraft) && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={triggerDraftFileInput}
                >
                  <input
                    type="file"
                    ref={draftFileInputRef}
                    onChange={handleDraftFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    disabled={isLoading || submitting || generatingFinalDraft || isGeneratingFinalDraft}
                  />
                  
                  {draftFile ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-base font-medium text-gray-600 mb-1 truncate max-w-full">
                        {draftFile.name}
                      </p>
                      <p className="text-base font-medium text-gray-600 mb-2">
                        {(draftFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveDraftFile();
                        }}
                        disabled={isLoading || submitting || generatingFinalDraft}
                      >
                        <X className="h-3 w-3 mr-1" /> 删除
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600 mb-1">上传初稿文件</p>
                      <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 右侧 - 其他文件上传 */}
              <div>
                <label className="block text-base font-medium text-gray-600 mb-1">
                  成绩单文件
                </label>
                <div
                  ref={otherDropAreaRef}
                  className={cn(
                    "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
                    isDraggingOther
                      ? "border-primary bg-primary/5"
                      : otherFiles.length > 0
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    (isLoading || submitting || generatingFinalDraft) && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={triggerOtherFilesInput}
                >
                  <input
                    type="file"
                    ref={otherFilesInputRef}
                    onChange={handleOtherFilesChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    multiple
                    disabled={isLoading || submitting || generatingFinalDraft || isGeneratingFinalDraft}
                  />
                  
                  {otherFiles.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-green-500 mb-2" />
                      <p className="text-base font-medium text-gray-600 mb-1">
                        已选择 {otherFiles.length} 个成绩单文件
                      </p>
                      <div className="flex flex-wrap justify-center gap-1 mb-2 max-h-[60px] overflow-y-auto">
                        {otherFiles.map((file, index) => (
                          <div key={index} className="flex items-center bg-white rounded-md px-2 py-1 text-xs">
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveOtherFile(index);
                              }}
                              className="ml-1 text-red-500 hover:text-red-700"
                              disabled={isLoading || submitting || generatingFinalDraft}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-base h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearAllOtherFiles();
                          }}
                          disabled={isLoading || submitting || generatingFinalDraft}
                        >
                          <X className="h-3 w-3 mr-1" /> 清空
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-base h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerOtherFilesInput();
                          }}
                          disabled={isLoading || submitting || generatingFinalDraft}
                        >
                          <Upload className="h-3 w-3 mr-1" /> 添加更多
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600 mb-1">上传成绩单文件</p>
                      <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 提交按钮和生成初稿按钮区域 */}
          <div className="flex justify-between mt-4 space-x-3">
            {/* 清空按钮 */}
            <Button
              onClick={() => {
                // 清空所有内容
                setDirection("");
                setRequirements("");
                setDraftFile(null);
                setOtherFiles([]);
                
                // 如果有文件输入元素，重置它们
                if (draftFileInputRef.current) {
                  draftFileInputRef.current.value = "";
                }
                if (otherFilesInputRef.current) {
                  otherFilesInputRef.current.value = "";
                }
                
                // 通知父组件内容已清空
                if (onInputChange) {
                  onInputChange();
                }
                if (onFileChange) {
                  onFileChange();
                }
                
                // 清除生成的内容
                if (onClearGeneratedContent) {
                  onClearGeneratedContent();
                }
                
                // 显示提示
                toast({
                  title: "内容已清空",
                  description: "所有输入、文件和生成内容已重置",
                });
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-50 via-gray-50 to-gray-50
                text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
                hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              disabled={isLoading || submitting || generatingFinalDraft}
            >
              <X className="h-4 w-4 mr-2" />
              清空
            </Button>

            {/* 右侧按钮组 */}
            <div className="flex space-x-3">
              {/* 提交按钮 - 显示为"提交初稿文件"或"提交定制内容"*/}
              <Button
                onClick={handleSubmit}
                disabled={isLoading || submitting || generatingFinalDraft || (type === "draft" && !draftFile)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50
                  text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
                  hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-300"
              >
                {isLoading || submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isPurifying ? "生成中..." : "生成中..."}
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    {type === "draft" 
                      ? (purifiedDraft ? "提交初稿文件" : "提交初稿文件") 
                      : "提交初稿文件"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 添加渐变动画样式 */}
      <style jsx global>{`
        .input-gradient-border {
          margin: 15px;
          position: relative;
          padding: 1px;
          background-origin: border-box;
          background-clip: content-box, border-box;
          overflow: visible;
          transition: all 0.3s ease;
        }

        .input-gradient-border::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: inherit;
          padding: 3px;
          background: linear-gradient(
            45deg,
            #80e5d8,
            #bdb0ff,
            #ffe28a,
            #8ecffd,
            #80e5d8
          );
          background-size: 400% 400%;
          animation: animatedgradient 6s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          transition: all 0.3s ease;
        }

        .input-gradient-border::after {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: inherit;
          background: linear-gradient(
            45deg,
            #80e5d8,
            #bdb0ff,
            #ffe28a,
            #8ecffd,
            #80e5d8
          );
          background-size: 400% 400%;
          animation: animatedgradient 9s ease infinite;
          filter: blur(8px);
          opacity: 0.5;
          z-index: -1;
          transition: all 0.3s ease;
        }

        .input-gradient-border:hover::after {
          filter: blur(12px);
          opacity: 0.8;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
        }

        .input-gradient-border:hover::before,
        .input-gradient-border:hover::after {
          animation: animatedgradient 9s ease infinite;
        }

        @keyframes animatedgradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
} 
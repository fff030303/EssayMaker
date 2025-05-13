"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, Loader2, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { DisplayResult } from "../types";
import { AssistantTips } from "./AssistantTips";

interface CVAssistantProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
}

export function CVAssistant({ onStepChange, setResult }: CVAssistantProps = {}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  
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
    setSupportFiles(prev => prev.filter((_, i) => i !== index));
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

  // 修改处理提交函数
  const handleSubmit = async () => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传个人简历素材表",
      });
      return;
    }

    setIsLoading(true);
    setStreamContent(""); // 清空之前的内容
    setIsComplete(false);
    
    // 创建结果对象
    const resultObject: DisplayResult = {
      content: "",
      steps: [],
      timestamp: new Date().toISOString(),
      isComplete: false,
      currentStep: "生成简历内容"
    };
    
    // 更新结果状态
    if (setResult) {
      setResult(resultObject);
    }
    
    // 显示处理中提示
    toast({
      title: "正在处理",
      description: "简历正在生成中...",
    });
    
    // 立即跳转到第二步
    if (onStepChange) {
      onStepChange(2);
    }
    
    try {
      // 使用apiService中的generateResume方法
      const response = await apiService.generateResume(resumeFile, supportFiles);
      console.log('API响应类型:', typeof response);
      
      // 检查响应类型
      if (response instanceof ReadableStream) {
        // 处理流式响应
        console.log('接收到流式响应，开始处理...');
        
        // 使用流程器读取流
        const reader = response.getReader();
        const decoder = new TextDecoder();
        let result = '';
        // 添加一个Set用于存储已处理过的内容，避免重复
        const processedContents = new Set<string>();
        // 上一次处理的消息内容
        let lastContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 解码二进制数据
            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            
            // 处理SSE格式的数据
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const jsonStr = line.slice(5).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;
                
                try {
                  // 尝试解析JSON
                  const jsonData = JSON.parse(jsonStr);
                  // 如果包含content字段，更新内容
                  if (jsonData.content) {
                    // 检查是否已处理过相同的内容以避免重复
                    if (!processedContents.has(jsonData.content) && jsonData.content !== lastContent) {
                      // 记录这条内容已处理
                      processedContents.add(jsonData.content);
                      lastContent = jsonData.content;
                      
                      // 更新界面内容
                      setStreamContent(prev => prev + jsonData.content);
                      
                      // 更新结果对象，直接设置内容而不是追加
                      // 这样可以避免重复内容问题
                      resultObject.content = (resultObject.content || "") + jsonData.content;
                      if (setResult) {
                        setResult({...resultObject});
                      }
                    }
                  }
                } catch (e) {
                  // 如果不是JSON，检查这段文本是否之前已处理过
                  if (!processedContents.has(jsonStr) && jsonStr !== lastContent) {
                    // 记录已处理
                    processedContents.add(jsonStr);
                    lastContent = jsonStr;
                    
                    // 更新界面内容
                    setStreamContent(prev => prev + jsonStr);
                    
                    // 更新结果对象
                    resultObject.content = (resultObject.content || "") + jsonStr;
                    if (setResult) {
                      setResult({...resultObject});
                    }
                  }
                }
              }
            }
            
            console.log('接收到数据片段:', chunk.substring(0, 50) + '...');
          }
          
          console.log('流式响应接收完成，总长度:', result.length);
          setIsComplete(true);
          
          // 更新结果完成状态
          resultObject.isComplete = true;
          if (setResult) {
            setResult({...resultObject});
          }
          
          // 尝试解析最终结果
          try {
            // 可能包含多个JSON对象，尝试解析最后一个完整的JSON
            const jsonMatch = result.match(/\{.*\}/g);
            if (jsonMatch) {
              const lastJson = jsonMatch[jsonMatch.length - 1];
              const parsedData = JSON.parse(lastJson);
              console.log('解析成功的JSON数据:', parsedData);
            }
          } catch (parseError) {
            console.error('解析JSON失败:', parseError);
          }
        } catch (streamError) {
          console.error('读取流时发生错误:', streamError);
        }
      } else {
        // 普通JSON响应
        console.log('API响应数据:', response);
        
        // 如果有响应内容，创建结果对象
        if (response && typeof response === 'object') {
          const content = response.text || JSON.stringify(response);
          setStreamContent(content);
          setIsComplete(true);
          
          // 创建并更新结果对象
          if (setResult) {
            setResult({
              content,
              steps: [],
              timestamp: new Date().toISOString(),
              isComplete: true,
              currentStep: "简历生成完成"
            });
          }
        }
      }

      // 显示成功提示
      toast({
        title: "已提交",
        description: "您的简历已提交成功",
      });
    } catch (error) {
      console.error('提交简历时出错:', error);
      toast({
        variant: "destructive",
        title: "提交失败",
        description: "上传简历时发生错误，请重试",
      });
      
      // 更新错误状态
      if (setResult) {
        setResult({
          content: `生成简历时出错: ${error}`,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "出错"
        });
      }
    } finally {
      setIsLoading(false);
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
      
      console.log("简历文件拖放事件触发", e.dataTransfer?.files);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        // 初稿文件只取第一个文件
        if (e.dataTransfer.files.length > 1) {
          toast({
            variant: "destructive",
            title: "只能选择一个简历文件",
            description: "已自动选择第一个文件作为简历",
          });
        }
        handleResumeFile(e.dataTransfer.files[0]);
      }
    };

    // 添加事件监听器
    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      // 移除事件监听器
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, [toast]);

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
      
      console.log("支持文件拖放事件触发", e.dataTransfer?.files);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        handleSupportFiles(fileList);
      }
    };

    // 添加事件监听器
    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragenter", handleDragEnter);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      // 移除事件监听器
      dropArea.removeEventListener("dragover", handleDragOver);
      dropArea.removeEventListener("dragenter", handleDragEnter);
      dropArea.removeEventListener("dragleave", handleDragLeave);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div className="w-full max-w-[800px] mx-auto mb-8 mt-2">
      
      
      
      {/* 添加CV助理特定的提示信息 */}
      <div className="mb-4">
        <AssistantTips 
          type="cv" 
          content="" 
        />
      </div>
      
      <div className="input-gradient-border rounded-3xl">
        <div className="w-full h-full flex flex-col bg-white rounded-[calc(1.5rem-3px)] p-4">
          <div className="grid grid-cols-1 gap-4">
            {/* 个人简历素材表上传区域 */}
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                个人简历素材表 <span className="text-red-500">*</span>
              </label>
              <div
                ref={resumeDropAreaRef}
                className={cn(
                  "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
                  isDraggingResume
                    ? "border-primary bg-primary/5"
                    : resumeFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  isLoading && "opacity-50 cursor-not-allowed"
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
                  
                  console.log("简历文件拖放事件触发", e.dataTransfer?.files);
                  
                  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
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
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
                  disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3 mr-1" /> 删除
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600 mb-1">上传个人简历素材表（支持doc、docx、pdf）</p>
                    <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
                  </div>
                )}
              </div>
            </div>

            {/* 支持文件上传区域 */}
            <div>
              <label className="block text-base font-medium text-gray-600 mb-1">
                支持文件（可多选）
              </label>
              <div
                ref={supportDropAreaRef}
                className={cn(
                  "border-2 border-dashed rounded-md p-4 transition-colors text-center cursor-pointer h-[180px] flex flex-col justify-center",
                  isDraggingSupport
                    ? "border-primary bg-primary/5"
                    : supportFiles.length > 0
                    ? "border-green-500 bg-green-50"
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
                  
                  console.log("支持文件拖放事件触发", e.dataTransfer?.files);
                  
                  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
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
                  accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif"
                  multiple
                  disabled={isLoading}
                />
                
                {supportFiles.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 text-green-500 mb-2" />
                    <p className="text-base font-medium text-gray-600 mb-1">
                      已选择 {supportFiles.length} 个支持文件
                    </p>
                    <div className="flex flex-wrap justify-center gap-1 mb-2 max-h-[60px] overflow-y-auto">
                      {supportFiles.map((file, index) => (
                        <div key={index} className="flex items-center bg-white rounded-md px-2 py-1 text-xs">
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSupportFile(index);
                            }}
                            className="ml-1 text-red-500 hover:text-red-700"
                            disabled={isLoading}
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
                          handleClearAllSupportFiles();
                        }}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3 mr-1" /> 清空
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-base h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSupportFileInput();
                        }}
                        disabled={isLoading}
                      >
                        <Upload className="h-3 w-3 mr-1" /> 添加更多
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600 mb-1">上传支持文件（证书、成绩单等）</p>
                    <p className="text-sm font-medium text-gray-600">点击或拖拽文件至此处</p>
                    <p className="text-xs text-gray-400 mt-1">支持pdf、doc、图片格式</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 提交按钮和清空按钮区域 */}
          <div className="flex justify-between mt-4 space-x-3">
            {/* 清空按钮 */}
            <Button
              onClick={() => {
                // 清空所有内容
                setResumeFile(null);
                setSupportFiles([]);
                
                // 如果有文件输入元素，重置它们
                if (resumeInputRef.current) {
                  resumeInputRef.current.value = "";
                }
                if (supportInputRef.current) {
                  supportInputRef.current.value = "";
                }
                
                // 显示提示
                toast({
                  title: "内容已清空",
                  description: "所有文件已重置",
                });
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-50 via-gray-50 to-gray-50
                text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
                hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              清空
            </Button>

            {/* 提交按钮 */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !resumeFile}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50
                text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
                hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  提交简历
                </>
              )}
            </Button>
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
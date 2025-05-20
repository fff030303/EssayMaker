"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, Loader2, ArrowUp, RefreshCcw, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/api";
import { DisplayResult } from "../types";
import { AssistantTips } from "./AssistantTips";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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
          // 使用类型断言和可选链访问content属性
          const responseObj = response as any;
          const content = responseObj?.text || JSON.stringify(response);
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

  return (
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
                    resumeFile 
                      ? "border-0" 
                      : "border border-dashed",
                    isDraggingResume
                      ? "border-primary bg-primary/5"
                      : "border-gray-300 hover:border-primary hover:bg-gray-50",
                    isLoading && "opacity-50 cursor-not-allowed"
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
                    accept=".pdf,.doc,.docx,.txt,.md"
                    disabled={isLoading}
                  />
                  
                  {resumeFile ? (
                    <div className="flex items-center p-2 border rounded bg-muted/50">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm flex-1 truncate">{resumeFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveResumeFile();
                        }}
                        disabled={isLoading}
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
                        支持 PDF, Word, TXT 格式
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
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={supportFiles.length > 0 ? undefined : triggerSupportFileInput}
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
                    accept=".pdf,.doc,.docx,.txt,.md"
                    multiple
                    disabled={isLoading}
                  />
                  
                  {supportFiles.length > 0 ? (
                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {supportFiles.map((file, index) => (
                        <div key={index} className="flex items-center p-2 border rounded bg-muted/50">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSupportFile(index);
                            }}
                            disabled={isLoading}
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
                        disabled={isLoading}
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
    </div>
  );
}

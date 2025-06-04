/**
 * SectionalFileUploadForm 组件
 * 
 * 功能：分稿助理的文件上传表单，支持初稿文件和支持文件上传
 * 
 * 核心特性：
 * 1. 文件上传：
 *    - 初稿文件上传（必需）
 *    - 支持文件上传（可选）
 *    - 文件类型验证
 *    - 文件大小限制
 * 
 * 2. 用户输入：
 *    - 分稿需求文本输入
 *    - 实时字符计数
 *    - 输入验证
 * 
 * 3. 表单验证：
 *    - 必填字段检查
 *    - 文件格式验证
 *    - 提交前验证
 * 
 * 4. 用户体验：
 *    - 拖拽上传支持
 *    - 上传进度显示
 *    - 错误提示
 *    - 成功反馈
 * 
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 触摸友好
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DisplayResult } from "../../types";
import { apiService } from "@/lib/api";
import { useStreamResponse } from "../../hooks/useStreamResponse";

interface SectionalFileUploadFormProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  onDataUpdate?: (file: File | null, searchData: string) => void;
}

export function SectionalFileUploadForm({
  onStepChange,
  setResult,
  onDataUpdate,
}: SectionalFileUploadFormProps) {
  const [userInput, setUserInput] = useState("");
  const [originalEssayFile, setOriginalEssayFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 拖拽状态管理
  const [isDraggingOriginal, setIsDraggingOriginal] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  
  const { toast } = useToast();
  const { processStream } = useStreamResponse();

  // 文件输入引用
  const originalFileInputRef = useRef<HTMLInputElement>(null);
  const supportFilesInputRef = useRef<HTMLInputElement>(null);

  // 文件验证函数
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `文件 ${file.name} 类型不支持，请上传PDF、Word文档或文本文件`
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: `文件 ${file.name} 大小超过10MB限制`
      };
    }

    return { isValid: true };
  };

  // 处理初稿文件拖拽
  const handleOriginalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(true);
  };

  const handleOriginalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(false);
  };

  const handleOriginalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOriginal(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0]; // 只取第一个文件
      const validation = validateFile(file);
      
      if (validation.isValid) {
        setOriginalEssayFile(file);
        toast({
          title: "文件上传成功",
          description: `已上传初稿文件：${file.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "文件类型不支持",
          description: validation.error,
        });
      }
    }
  };

  // 处理支持文件拖拽
  const handleSupportDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(true);
  };

  const handleSupportDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(false);
  };

  const handleSupportDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingSupport(false);
    
    const files = Array.from(e.dataTransfer.files);
    
    // 验证文件数量
    if (supportFiles.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "文件数量超限",
        description: "最多只能上传5个支持文件",
      });
      return;
    }

    // 验证每个文件
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast({
          variant: "destructive",
          title: "文件类型不支持",
          description: validation.error,
        });
      }
    }

    if (validFiles.length > 0) {
      setSupportFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "文件上传成功",
        description: `已上传 ${validFiles.length} 个支持文件`,
      });
    }
  };

  // 处理初稿文件上传
  const handleOriginalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        setOriginalEssayFile(file);
        toast({
          title: "文件上传成功",
          description: `已上传初稿文件：${file.name}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "文件上传失败",
          description: validation.error,
        });
      }
    }
  };

  // 处理支持文件上传
  const handleSupportFilesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // 验证文件数量（最多5个支持文件）
    if (supportFiles.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "文件数量超限",
        description: "最多只能上传5个支持文件",
      });
      return;
    }

    // 验证每个文件
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        toast({
          variant: "destructive",
          title: "文件上传失败",
          description: validation.error,
        });
      }
    }

    if (validFiles.length > 0) {
      setSupportFiles(prev => [...prev, ...validFiles]);
      toast({
        title: "文件上传成功",
        description: `已上传 ${validFiles.length} 个支持文件`,
      });
    }
  };

  // 移除初稿文件
  const removeOriginalFile = () => {
    setOriginalEssayFile(null);
    if (originalFileInputRef.current) {
      originalFileInputRef.current.value = "";
    }
  };

  // 移除支持文件
  const removeSupportFile = (index: number) => {
    setSupportFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 处理表单提交
  const handleSubmit = async () => {
    // 验证必填字段
    if (!userInput.trim()) {
      toast({
        variant: "destructive",
        title: "请输入分稿需求",
        description: "请描述您的分稿需求和要求",
      });
      return;
    }

    if (!originalEssayFile) {
      toast({
        variant: "destructive",
        title: "请上传初稿文件",
        description: "分稿助理需要您的原始初稿文件",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("开始调用分稿助理API...");
      
      // 准备文件数组（初稿文件 + 支持文件）
      const allFiles = [originalEssayFile, ...supportFiles];
      
      // 调用分稿助理API并处理流式响应
      const response = await apiService.streamSectionalQuery(
        userInput,
        allFiles
      );

      console.log("分稿助理API响应:", response);

      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");

        // 🆕 用于累积steps的本地状态
        let accumulatedSteps: string[] = [];
        // 🆕 用于保存每个步骤的完整内容数据
        let stepContents: Record<string, string> = {};

        // 使用processStream处理流响应，但添加步骤累积逻辑
        await processStream(response, {
          realTimeStreaming: true,
          onUpdate: (result: DisplayResult) => {
            // 🆕 累积所有步骤，避免被新步骤覆盖
            if (result.steps && result.steps.length > 0) {
              result.steps.forEach(step => {
                if (!accumulatedSteps.includes(step)) {
                  accumulatedSteps.push(step);
                }
                // 保存该步骤对应的内容
                stepContents[step] = result.content;
              });
            }
            
            // 如果有当前步骤且不在累积列表中，添加进去
            if (result.currentStep && !accumulatedSteps.includes(result.currentStep)) {
              accumulatedSteps.push(result.currentStep);
              stepContents[result.currentStep] = result.content;
            }

            // 更新结果，使用累积的步骤
            if (setResult) {
              const updatedResult: DisplayResult = {
                ...result,
                steps: [...accumulatedSteps], // 使用累积的步骤
                // 添加步骤内容映射
                _stepContents: { ...stepContents },
              } as DisplayResult;
              setResult(updatedResult);
            }

            // 传递原始文件和搜索结果数据
            if (onDataUpdate && result.content) {
              onDataUpdate(originalEssayFile, result.content);
            }
          },
          onComplete: (finalResult: DisplayResult) => {
            // 完成时的回调
            // 确保最终结果包含所有累积的步骤
            const allSteps = finalResult.steps && finalResult.steps.length > 0 
              ? [...new Set([...accumulatedSteps, ...finalResult.steps])]
              : [...accumulatedSteps];
            
            // 保存最终内容到所有步骤
            allSteps.forEach(step => {
              if (!stepContents[step]) {
                stepContents[step] = finalResult.content;
              }
            });

            if (setResult) {
              const finalResultWithSteps: DisplayResult = {
                ...finalResult,
                steps: allSteps,
                // 添加步骤内容映射
                _stepContents: { ...stepContents },
              } as DisplayResult;
              setResult(finalResultWithSteps);
            }
            
            if (onDataUpdate && finalResult.content) {
              onDataUpdate(originalEssayFile, finalResult.content);
            }

            toast({
              title: "生成成功",
              description: "分稿策略已生成完成",
            });
            
            console.log("分稿策略生成完成，累积步骤:", allSteps);
          }
        });
      }
    } catch (error) {
      console.error("分稿助理API调用失败:", error);
      toast({
        variant: "destructive",
        title: "请求失败",
        description: error instanceof Error ? error.message : "未知错误",
      });

      // 🆕 出错时也保持结果对象，显示错误状态
      if (setResult) {
        setResult({
          content: "",
          steps: [],
          currentStep: "请求失败，请重试",
          timestamp: new Date().toISOString(),
          isComplete: true,
          isError: true,
          errorMessage: error instanceof Error ? error.message : "未知错误",
        } as DisplayResult);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card  className="w-full max-w-[800px] mx-auto mb-8 mt-4 shadow-lg">
        <CardContent className="space-y-6 p-4 pt-4">
          {/* 分稿需求输入 */}
          <div className="space-y-2">
            <Label htmlFor="user-input">查询需求描述 *</Label>
            <Textarea
              id="user-input"
              placeholder="请描述您的查询需求，例如：请提供南加州大学(USC) 经济学硕士课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="min-h-[120px]"
              disabled={isLoading}
            />
            <div className="text-sm text-gray-500 text-right">
              {userInput.length} 字符
            </div>
          </div>

          {/* 初稿文件上传 */}
          <div className="columns-2">
            <div className="space-y-2">
              <Label>原始初稿文件 *</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDraggingOriginal 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleOriginalDragOver}
                onDragLeave={handleOriginalDragLeave}
                onDrop={handleOriginalDrop}
              >
                {originalEssayFile ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{originalEssayFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(originalEssayFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeOriginalFile}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      {isDraggingOriginal ? '松开鼠标上传文件' : '点击上传或拖拽文件到此处'}
                    </p>
                    <p className="text-xs text-gray-500">
                      支持 PDF、Word、TXT 格式，最大 10MB
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => originalFileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      选择文件
                    </Button>
                  </div>
                )}
                <input
                  ref={originalFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleOriginalFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 支持文件上传 */}
            <div className="space-y-2">
              <Label>支持文件（可选）</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDraggingSupport 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleSupportDragOver}
                onDragLeave={handleSupportDragLeave}
                onDrop={handleSupportDrop}
              >
                {supportFiles.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {supportFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSupportFile(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    {isDraggingSupport ? '松开鼠标上传文件' : '上传相关参考文件（最多5个）'}
                  </p>
                  <p className="text-xs text-gray-500">
                    如：申请要求、学校信息、课程描述等
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => supportFilesInputRef.current?.click()}
                    disabled={isLoading || supportFiles.length >= 5}
                  >
                    添加文件
                  </Button>
                </div>
                <input
                  ref={supportFilesInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={handleSupportFilesUpload}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-center pt-4">
          <Button
              onClick={handleSubmit}
              disabled={isLoading || !userInput.trim() || !originalEssayFile}
              className="px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  生成查询结果
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 

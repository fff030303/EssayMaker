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
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface RLAssistantProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
}

export function RLAssistant({ onStepChange, setResult }: RLAssistantProps = {}) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const [isDraggingSupport, setIsDraggingSupport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  
  // 推荐人选择状态
  const [recommenderNumber, setRecommenderNumber] = useState<1 | 2>(1);
  
  // 替换推荐信相关字段为写作需求
  const [writingRequirements, setWritingRequirements] = useState<string>("");

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const resumeDropAreaRef = useRef<HTMLDivElement>(null);
  const supportDropAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();

  // 处理简历文件上传
  const handleResumeFile = (file: File) => {
    if (!file) return;
    setResumeFile(file);
    toast({
      title: "推荐信素材表已上传",
      description: `已设置: ${file.name}`,
    });
  };

  // 添加按钮点击处理函数
  const handleButtonClick = (text: string) => {
    // 处理推荐人按钮点击
    if (text === "X位推荐人") {
      setWritingRequirements(prev => prev + "请撰写第X位推荐人的推荐信\n");
      return;
    }
    
    // 处理其他按钮点击
    setWritingRequirements(prev => prev  + text);
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
      description: "推荐信素材表已删除",
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

  // 验证推荐信表单
  const validateForm = () => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传推荐信素材表",
      });
      return false;
    }
    
    return true;
  };

  // 处理提交函数
  const handleSubmit = async () => {
    if (!validateForm()) {
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
      currentStep: "生成推荐信内容"
    };
    
    // 更新结果状态
    if (setResult) {
      setResult(resultObject);
    }
    
    // 显示处理中提示
    toast({
      title: "正在处理",
      description: "推荐信正在生成中...",
    });
    
    // 立即跳转到第二步
    if (onStepChange) {
      onStepChange(2);
    }
    
    try {
      // 确保resumeFile不为null (validateForm已经检查过，这里再次确认)
      if (!resumeFile) {
        throw new Error("推荐信素材表文件不能为空");
      }
      
      // 使用apiService中的generateRecommendationLetter方法
      const response = await apiService.generateRecommendationLetter(
        resumeFile, 
        writingRequirements,
        supportFiles
      );
      
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
                      
                      // 更新结果对象
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
          }
          
          console.log('流式响应接收完成，总长度:', result.length);
          setIsComplete(true);
          
          // 更新结果完成状态
          resultObject.isComplete = true;
          if (setResult) {
            setResult({...resultObject});
          }
          
        } catch (error) {
          console.error('处理流式响应时出错:', error);
          toast({
            variant: "destructive",
            title: "处理错误",
            description: "处理推荐信内容时出错",
          });
        }
      } else {
        // 处理非流式响应
        console.log('接收到非流式响应');
        
        if (typeof response === 'string') {
          setStreamContent(response);
          
          resultObject.content = response;
          resultObject.isComplete = true;
          if (setResult) {
            setResult({...resultObject});
          }
        } else if (response && typeof response === 'object') {
          // 使用类型断言和可选链访问content属性
          const responseObj = response as any;
          const content = responseObj?.content || JSON.stringify(response);
          setStreamContent(content);
          
          resultObject.content = content;
          resultObject.isComplete = true;
          if (setResult) {
            setResult({...resultObject});
          }
        }
        
        setIsComplete(true);
      }
      
    } catch (error) {
      console.error('提交推荐信请求时出错:', error);
      
      // 显示更详细的错误信息
      let errorMessage = "生成推荐信时发生错误，请重试";
      
      if (error instanceof Error) {
        // 如果错误信息包含404，提示API不存在
        if (error.message.includes("404")) {
          errorMessage = "推荐信生成API不存在，请联系管理员配置相应的接口";
        } else if (error.message.includes("401")) {
          errorMessage = "API密钥错误或无效，请检查配置";
        } else if (error.message.includes("422")) {
          // 处理表单字段验证错误
          errorMessage = "请求参数错误，请检查上传的文件和表单字段";
          if (error.message.includes("缺少必要字段")) {
            errorMessage = error.message; // 使用服务器返回的详细错误信息
          }
        } else if (error.message.includes("timeout") || error.message.includes("Network Error")) {
          errorMessage = "网络连接超时，请检查服务器状态";
        } else {
          // 显示原始错误信息
          errorMessage = `错误详情: ${error.message}`;
        }
      }
      
      toast({
        variant: "destructive",
        title: "提交错误",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理拖放区域的事件
  const handleDrag = (event: React.DragEvent, isDragging: boolean, type: 'resume' | 'support') => {
    event.preventDefault();
    event.stopPropagation();
    if (type === 'resume') {
      setIsDraggingResume(isDragging);
    } else {
      setIsDraggingSupport(isDragging);
    }
  };

  // 处理拖放文件
  const handleDrop = (event: React.DragEvent, type: 'resume' | 'support') => {
    event.preventDefault();
    event.stopPropagation();
    
    if (type === 'resume') {
      setIsDraggingResume(false);
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleResumeFile(event.dataTransfer.files[0]);
      }
    } else {
      setIsDraggingSupport(false);
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        handleSupportFiles(Array.from(event.dataTransfer.files));
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AssistantTips type="rl" />
      
      <div className="grid grid-cols-1 gap-6 mt-4">
        {/* 同一张卡片包含写作需求和文件上传 */}
        <Card className="border rounded-lg">
          <CardHeader className="pb-3">
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 写作需求区域 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  写作需求
                </Label>
                
                {/* 写作需求快速选择按钮 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted px-3 py-1"
                    onClick={() => handleButtonClick("X位推荐人")}
                  >
                    X位推荐人
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted px-3 py-1"
                    onClick={() => handleButtonClick("被推荐人是男生\n")}
                  >
                    男生
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted px-3 py-1"
                    onClick={() => handleButtonClick("被推荐人是女生\n")}
                  >
                    女生
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted px-3 py-1"
                    onClick={() => handleButtonClick("请补充更多课堂互动细节\n")}
                  >
                    课堂互动细节
                  </Badge>
                  
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-muted px-3 py-1"
                    onClick={() => handleButtonClick("请补充更多科研项目细节\n")}
                  >
                    科研项目细节
                  </Badge>
                </div>
                
                {/* 写作需求文本框 */}
                <Textarea
                  ref={textareaRef}
                  placeholder="例如：这是申请斯坦福大学计算机科学硕士项目的推荐信，推荐人是我的本科导师王教授，我们的关系是他指导了我的毕业设计，希望推荐信突出我在算法研究和项目实践方面的能力..."
                  className="min-h-[120px] resize-y"
                  value={writingRequirements}
                  onChange={(e) => setWritingRequirements(e.target.value)}
                />
              </div>
              
              {/* 文件上传区域 - 左右布局 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 左侧：推荐信素材表上传区域 */}
                <div className="space-y-2">
                  <Label htmlFor="resume-upload" className="text-sm font-medium">
                    推荐信素材表 <span className="text-red-500">*</span>
                  </Label>
                  
                  <input
                    ref={resumeInputRef}
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeFileChange}
                  />
                  
                  {resumeFile ? (
                    <div className="flex items-center p-2 border rounded bg-muted/50">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm flex-1 truncate">{resumeFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleRemoveResumeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      ref={resumeDropAreaRef}
                      onClick={triggerResumeFileInput}
                      onDragOver={(e) => handleDrag(e, true, 'resume')}
                      onDragEnter={(e) => handleDrag(e, true, 'resume')}
                      onDragLeave={(e) => handleDrag(e, false, 'resume')}
                      onDrop={(e) => handleDrop(e, 'resume')}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer h-[120px]",
                        "hover:border-primary/50 hover:bg-muted/50 transition-colors",
                        isDraggingResume && "border-primary bg-primary/5"
                      )}
                    >
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
                
                {/* 右侧：支持材料上传区域 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="support-upload" className="text-sm font-medium">
                      支持材料（可选）
                    </Label>
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
                  
                  <input
                    ref={supportInputRef}
                    type="file"
                    id="support-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onChange={handleSupportFileChange}
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
                            onClick={() => handleRemoveSupportFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={triggerSupportFileInput}
                      >
                        <ArrowUp className="h-3.5 w-3.5 mr-1" />
                        添加更多文件
                      </Button>
                    </div>
                  ) : (
                    <div
                      ref={supportDropAreaRef}
                      onClick={triggerSupportFileInput}
                      onDragOver={(e) => handleDrag(e, true, 'support')}
                      onDragEnter={(e) => handleDrag(e, true, 'support')}
                      onDragLeave={(e) => handleDrag(e, false, 'support')}
                      onDrop={(e) => handleDrop(e, 'support')}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer h-[120px]",
                        "hover:border-blue-400/50 hover:bg-blue-50/50 transition-colors",
                        isDraggingSupport && "border-blue-400 bg-blue-50/50"
                      )}
                    >
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-8"
              onClick={() => {
                // 清空写作需求
                setWritingRequirements("");
                
                // 清空文件
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
            
            <Button 
              className="w-full max-w-[200px]" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  生成推荐信
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 
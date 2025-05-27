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
import { useStreamResponse } from "../hooks/useStreamResponse";

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
  // 添加自定义提示词状态
  const [customRolePrompt, setCustomRolePrompt] = useState<string>("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState<string>("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] = useState<string>("");

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const supportInputRef = useRef<HTMLInputElement>(null);
  const resumeDropAreaRef = useRef<HTMLDivElement>(null);
  const supportDropAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const { processStream } = useStreamResponse();

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
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传个人简历素材表",
      });
      return;
    }

    if (!writingRequirements.trim()) {
      toast({
        variant: "destructive",
        title: "要求缺失",
        description: "请填写推荐信写作要求",
      });
      return;
    }

    setIsLoading(true);
    setStreamContent("");
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
      // 使用apiService中的generateRecommendationLetter方法
      const response = await apiService.generateRecommendationLetter(
        resumeFile,
        writingRequirements,
        supportFiles,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );
      
      // 检查响应类型
      if (response instanceof ReadableStream) {
        // 使用统一的流式处理
        console.log('接收到流式响应，开始处理...');
        
        await processStream(response, {
          onUpdate: (result) => {
            setStreamContent(result.content);
            if (setResult) {
              setResult({
                ...result,
                currentStep: result.currentStep || "推荐信分析中"
              });
            }
          },
          onComplete: (result) => {
            setStreamContent(result.content);
            setIsComplete(true);
            if (setResult) {
              setResult({
                ...result,
                currentStep: "推荐信分析完成"
              });
            }
            toast({
              title: "已提交",
              description: "您的推荐信已分析完成",
            });
          },
          onError: (error) => {
            console.error('处理推荐信时出错:', error);
            toast({
              variant: "destructive",
              title: "处理失败",
              description: "处理推荐信时发生错误，请重试",
            });
            if (setResult) {
              setResult({
                content: `生成推荐信时出错: ${error}`,
                steps: [],
                timestamp: new Date().toISOString(),
                isComplete: true,
                currentStep: "出错"
              });
            }
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 1 // 字符显示间隔1毫秒
        });
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
        toast({
          title: "已提交",
          description: "您的推荐信已分析完成",
        });
      }
    } catch (error) {
      console.error('提交推荐信时出错:', error);
      toast({
        variant: "destructive",
        title: "提交失败",
        description: "上传推荐信时发生错误，请重试",
      });
      
      // 更新错误状态
      if (setResult) {
        setResult({
          content: `生成推荐信时出错: ${error}`,
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="writing-requirements" className="text-sm font-medium">
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
                  
                  <Textarea
                    ref={textareaRef}
                    id="writing-requirements"
                    placeholder="例如：这是申请斯坦福大学计算机科学硕士项目的推荐信，推荐人是我的本科导师王教授，我们的关系是他指导了我的毕业设计，希望推荐信突出我在算法研究和项目实践方面的能力..."
                    className="min-h-[120px] resize-y"
                    value={writingRequirements}
                    onChange={(e) => setWritingRequirements(e.target.value)}
                  />
                </div>

                {/* 自定义提示词输入框 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="custom-role-prompt" className="text-sm font-medium">
                      自定义角色提示词
                    </Label>
                    <Textarea
                      id="custom-role-prompt"
                      placeholder="例如：你是一位经验丰富的推荐信写作专家，擅长突出学生的学术成就和研究能力..."
                      className="min-h-[80px] resize-y"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom-task-prompt" className="text-sm font-medium">
                      自定义任务提示词
                    </Label>
                    <Textarea
                      id="custom-task-prompt"
                      placeholder="例如：请根据提供的材料，撰写一封突出申请者研究能力和学术潜力的推荐信..."
                      className="min-h-[80px] resize-y"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom-output-format-prompt" className="text-sm font-medium">
                      自定义输出格式提示词
                    </Label>
                    <Textarea
                      id="custom-output-format-prompt"
                      placeholder="例如：请按照学术推荐信的标准格式撰写，包含推荐人与申请者的关系、具体事例和评价..."
                      className="min-h-[80px] resize-y"
                      value={customOutputFormatPrompt}
                      onChange={(e) => setCustomOutputFormatPrompt(e.target.value)}
                    />
                  </div>
                </div>
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
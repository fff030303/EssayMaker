// 输入区域组件，提供：

// - 文本输入框，支持动态调整高度
// - 提交按钮
// - 预设示例选择功能
// - 可展开/折叠的交互设计
// - 支持文件上传和粘贴图片功能

"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Loader2,
  FileUp,
  X,
} from "lucide-react";
import { ExampleList } from "./ExampleList";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgentType } from "../types";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

// 从types导入的Example类型
interface Example {
  title: string;
  content: string;
  type?: AgentType;
}

interface InputAreaProps {
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  isInputExpanded: boolean;
  setIsInputExpanded: (expanded: boolean) => void;
  handleSubmit: () => void;
  handleExampleClick: (content: string) => void;
  files?: File[];
  setFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  placeholder?: string;
}

export function InputArea({
  query,
  setQuery,
  isLoading,
  isInputExpanded,
  setIsInputExpanded,
  handleSubmit,
  handleExampleClick,
  files = [],
  setFiles = () => {},
  placeholder = "你可以说：查询UCL的MSc Global Prosperity的课程介绍...",
}: InputAreaProps) {
  // 创建文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 使用toast钩子
  const { toast } = useToast();

  // 默认案例列表
  const defaultExamples: Example[] = [
    {
      title: "分稿课程信息",
      content:
        "请提供南加州大学(USC) 经济学硕士课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。",
      type: AgentType.COURSE_INFO,
    },
    {
      title: "学校与专业分析",
      content:
        "请全面分析纽约大学(NYU)数据科学硕士项目，包括申请要求（GPA、GRE、语言成绩、申请材料）和学校概况（排名、地理位置、就业前景、师资力量）。",
      type: AgentType.UNIVERSITY_RESEARCH,
    },
    {
      title: "申请规划",
      content:
        "我是一名中国211大学计算机专业应届毕业生，GPA 3.6/4.0，托福105，GRE 325，有一段互联网公司实习经历和一篇普通期刊论文。请根据我的背景推荐适合的计算机科学硕士项目，并制定申请时间规划。",
      type: AgentType.APPLICATION_ADVISOR,
    },
    {
      title: "通用研究",
      content:
        "请研究人工智能在医疗领域的最新应用，特别是在疾病诊断和药物研发方面的突破和挑战。",
      type: AgentType.RESEARCH,
    },
    {
      title: "博士学校查询",
      content: "查询加利福尼亚州开设计算机专业的学校",
      type: AgentType.UNIVERSITY_RESEARCH,
    },
    {
      title: "教授查询",
      content: "查询杭州师范大学的计算机方面的教授",
      type: AgentType.UNIVERSITY_RESEARCH,
    },
    {
      title: "教授背景查询",
      content: "Get details of Professor Andrew Ng and Nima Anari",
      type: AgentType.UNIVERSITY_RESEARCH,
    },
  ];

  // 防抖处理的查询
  const debouncedQuery = useCallback((value: string) => {
    if (value.trim().length > 0) {
      // 这里可以添加实时建议或预览功能
      console.log("Debounced query:", value);
    }
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedQuery(value);

    // 调整高度
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;

    // 确保滚动功能正常工作
    if (newHeight >= 200) {
      textarea.style.overflowY = "scroll";
      textarea.classList.add("scrollable");
    } else {
      textarea.style.overflowY = "hidden";
      textarea.classList.remove("scrollable");
    }
  };

  // 自定义提交处理函数
  const handleSubmitAndCollapse = () => {
    // 检查查询是否为空
    if (!query.trim()) {
      return;
    }

    handleSubmit();
    // 如果有内容，提交后折叠输入框
    setIsInputExpanded(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      (e.ctrlKey || e.metaKey) &&
      !isLoading &&
      query.trim()
    ) {
      e.preventDefault();
      handleSubmitAndCollapse();
    }
  };

  // 处理示例点击
  const handleExampleSelection = (content: string, type?: AgentType) => {
    handleExampleClick(content);
    setIsInputExpanded(true);
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 处理文件删除
  const handleFileDelete = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // 处理粘贴事件，自动识别图片
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (e.clipboardData) {
        // 检查是否有图片在剪贴板中
        const items = e.clipboardData.items;

        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              e.preventDefault();

              // 从剪贴板获取图片文件
              const blob = items[i].getAsFile();
              if (blob) {
                // 创建唯一文件名
                const now = new Date().getTime();
                const fileName = `pasted-image-${now}.png`;

                // 将blob转换为File对象
                const file = new File([blob], fileName, { type: blob.type });

                // 添加到文件列表
                setFiles((prev) => [...prev, file]);
              }
            }
          }
        }
      }
    },
    [setFiles]
  );

  // 添加和移除粘贴事件监听器
  useEffect(() => {
    if (isInputExpanded && textareaRef.current) {
      textareaRef.current.addEventListener("paste", handlePaste);
    }

    return () => {
      if (textareaRef.current) {
        textareaRef.current.removeEventListener("paste", handlePaste);
      }
    };
  }, [isInputExpanded, handlePaste]);

  // 初始化时调整高度
  const initTextarea = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) {
      // 不要直接修改textareaRef.current
      setTimeout(() => {
        if (node) {
          node.style.height = "auto";
          const newHeight = Math.min(node.scrollHeight, 150);
          node.style.height = `${newHeight}px`;

          // 确保滚动功能正常工作
          if (newHeight >= 150) {
            node.style.overflowY = "scroll";
            node.classList.add("scrollable");
          } else {
            node.style.overflowY = "hidden";
            node.classList.remove("scrollable");
          }
        }
      }, 0);
    }
  }, []);

  // 使用useEffect初始化textarea高度
  useEffect(() => {
    const currentTextarea = textareaRef.current;
    if (currentTextarea && isInputExpanded) {
      initTextarea(currentTextarea);
    }
  }, [isInputExpanded, initTextarea]);

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="relative">
        {/* 折叠状态的输入框 */}
        {!isInputExpanded && (
          <div
            className="border rounded-md shadow-sm bg-white p-2 cursor-text flex items-center justify-between"
            onClick={() => setIsInputExpanded(true)}
          >
            <div className="text-gray-400 text-sm truncate">
              {query || placeholder}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* 展开状态的输入框 */}
        {isInputExpanded && (
          <div className="border rounded-md shadow-sm bg-white p-3">
            <div className="flex flex-col space-y-2">
              {/* 文本输入区域 */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  className="w-full border-0 focus:ring-0 resize-none text-sm text-gray-700 placeholder:text-gray-400 min-h-[40px] p-0 focus:outline-none"
                  disabled={isLoading}
                />

                {/* 折叠按钮 - 放在右上角 */}
                <button
                  className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setIsInputExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>

              {/* 显示上传的文件 */}
              {files.length > 0 && (
                <div className="mt-1 space-y-1 border rounded p-2 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">
                    已上传文件:
                  </div>
                  <div className="max-h-[80px] overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-1 rounded text-xs mb-1 border"
                      >
                        <div className="truncate flex-1 text-gray-700">
                          {file.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-gray-500 hover:text-red-500"
                          onClick={() => handleFileDelete(index)}
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer 行 */}
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center space-x-2">
                  {/* 示例按钮 */}
                  <Popover>
                    <PopoverTrigger asChild></PopoverTrigger>
                    <PopoverContent
                      className="w-[240px] p-4 z-50 border-0"
                      align="start"
                      sideOffset={8}
                    >
                      <ExampleList
                        examples={defaultExamples}
                        onExampleClick={(content, index) => {
                          const example = defaultExamples[index];
                          handleExampleSelection(content, example.type);
                        }}
                        inPopover={true}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* 文件上传按钮 */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md bg-background hover:bg-muted text-muted-foreground hover:text-foreground border"
                    onClick={triggerFileInput}
                    disabled={isLoading}
                  >
                    <FileUp className="h-3 w-3" />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />

                  {/* 可以在这里添加粘贴提示 */}
                  <span className="text-xs text-gray-400 hidden sm:inline-block">
                    支持粘贴图片
                  </span>
                </div>

                <Button
                  variant={query.trim() ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-7 w-7 rounded-md border",
                    query.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={handleSubmitAndCollapse}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

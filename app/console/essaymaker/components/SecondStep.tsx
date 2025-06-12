/**
 * SecondStep 组件
 *
 * 功能：显示查询结果和处理步骤的第二步界面
 *
 * 核心特性：
 * 1. 结果展示：
 *    - 智能内容渲染
 *    - 多格式支持（HTML/Markdown）
 *    - 实时更新显示
 *    - 流式内容处理
 *
 * 2. 步骤跟踪：
 *    - 处理步骤可视化
 *    - 进度指示器
 *    - 展开/折叠控制
 *    - 步骤详情查看
 *
 * 3. 交互功能：
 *    - 返回上一步
 *    - 继续下一步
 *    - 重新生成内容
 *    - 导出结果
 *
 * 4. 状态管理：
 *    - 加载状态处理
 *    - 错误状态显示
 *    - 完成状态检测
 *    - 内容验证
 *
 * 5. 响应式布局：
 *    - 移动端适配
 *    - 动态高度调整
 *    - 内容溢出处理
 *
 * 使用场景：
 * - 查询结果展示
 * - 内容生成过程显示
 * - 中间步骤确认
 * - 结果预览和编辑
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, ArrowRight, FileText, Pencil } from "lucide-react";
import { DisplayResult } from "../types";
import { StepResultDisplay } from "./StepResultDisplay";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FullScreenLoadingAnimation } from "./LoadingAnimation";

interface SecondStepProps {
  secondStepInput: string;
  setSecondStepInput: (input: string) => void;
  secondStepLoading: boolean;
  secondStepResult: DisplayResult | null;
  thirdStepLoading: boolean;
  handleSecondStepSubmit: () => void;
  handleFinalGeneration: () => void;
  handleSecondStepInputChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  onStepChange?: (step: number) => void;
}

export function SecondStep({
  secondStepInput,
  setSecondStepInput,
  secondStepLoading,
  secondStepResult,
  thirdStepLoading,
  handleSecondStepSubmit,
  handleFinalGeneration,
  handleSecondStepInputChange,
  onStepChange,
}: SecondStepProps) {
  // 文本区域引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 添加结果内容区域的引用
  const resultContentRef = useRef<HTMLDivElement>(null);
  // 添加自动滚动状态
  const [autoScroll, setAutoScroll] = useState(true);

  // 增强的输入处理函数
  const enhancedInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // 调用原始处理函数
    handleSecondStepInputChange(e);

    // 动态调整文本区域高度
    const textarea = e.target;
    textarea.style.height = "auto";
    const maxHeight = 200; // 设置统一的最大高度
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;

    // 根据内容高度决定是否显示滚动条
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = "auto";
      textarea.classList.add("scrollable");
    } else {
      textarea.style.overflowY = "hidden";
      textarea.classList.remove("scrollable");
    }
  };

  // 初始化时调整高度
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      const maxHeight = 200; // 设置统一的最大高度
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;

      // 根据实际内容高度决定是否显示滚动条
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
        textarea.classList.add("scrollable");
      } else {
        textarea.style.overflowY = "hidden";
        textarea.classList.remove("scrollable");
      }
    }
  }, [secondStepInput]);

  // 添加自动滚动效果
  useEffect(() => {
    if (autoScroll && resultContentRef.current && secondStepResult?.content) {
      // 使用setTimeout确保DOM更新后再滚动
      setTimeout(() => {
        if (resultContentRef.current) {
          resultContentRef.current.scrollTop =
            resultContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [secondStepResult?.content, autoScroll]);

  // 处理用户手动滚动
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    // 只有当用户向上滚动时才禁用自动滚动
    if (element.scrollHeight - element.scrollTop > element.clientHeight + 50) {
      setAutoScroll(false);
    } else {
      // 当滚动到接近底部时重新启用自动滚动
      setAutoScroll(true);
    }
  }, []);

  return (
    <>
      {/* 全屏加载动画 - 在第二步和第三步生成过程中显示 */}
      {(secondStepLoading || thirdStepLoading) && (
        <FullScreenLoadingAnimation
          text={
            secondStepLoading
              ? "正在生成修改建议，请勿切换页面..."
              : "正在生成最终文章，请勿切换页面..."
          }
        />
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
        {/* 用户输入 */}
        <div className="flex flex-col">
          <div className="p-2 sm:p-3 md:p-5 overflow-visible">
            <Card className="shadow-lg flex flex-col">
              <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 pb-3 pt-4 px-3 sm:pb-4 sm:pt-5 sm:px-5 flex-shrink-0">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm sm:text-base font-medium">
                    个人陈述原稿
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 px-3 pb-4 sm:pt-6 sm:px-6 sm:pb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        请输入补充信息：
                      </label>
                    </div>
                    <Textarea
                      ref={textareaRef}
                      placeholder="请输入您的补充信息..."
                      value={secondStepInput}
                      onChange={enhancedInputChange}
                      className="w-full resize-none text-sm sm:text-base overflow-auto"
                      disabled={secondStepLoading}
                      style={{
                        minHeight: "120px",
                        maxHeight: "200px",
                        transition: "height 0.1s ease",
                      }}
                      onKeyDown={(e) => {
                        // 添加Ctrl+Enter提交功能
                        if (
                          (e.ctrlKey || e.metaKey) &&
                          e.key === "Enter" &&
                          !secondStepLoading &&
                          secondStepInput.trim()
                        ) {
                          e.preventDefault();
                          handleSecondStepSubmit();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm text-gray-500">
                        提示：使用 Ctrl/Cmd + Enter 快速提交
                      </p>
                      <Button
                        onClick={handleSecondStepSubmit}
                        disabled={secondStepLoading || !secondStepInput.trim()}
                        size="sm"
                        className="h-8 gap-1 text-xs sm:text-sm bg-sky-500 hover:bg-sky-600 text-white"
                      >
                        {secondStepLoading ? (
                          <>
                            <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          "撰写改写策略"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 第二步结果 */}
        <div className="flex flex-col">
          <div className="p-2 sm:p-3 md:p-5 overflow-visible">
            {secondStepResult ? (
              <Card className="shadow-lg flex flex-col">
                {/* 结果卡片头部保持不变 */}
                <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 pb-3 pt-4 px-3 sm:pb-4 sm:pt-5 sm:px-5 flex-shrink-0">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm sm:text-base font-medium">
                      修改建议
                    </CardTitle>
                  </div>
                </CardHeader>

                {secondStepResult.currentStep && (
                  <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm text-gray-500 bg-gray-50 border-t border-b border-gray-100 flex-shrink-0">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span>{secondStepResult.currentStep}</span>
                  </div>
                )}

                {/* 添加onScroll事件处理和ref */}
                <CardContent
                  ref={resultContentRef}
                  onScroll={handleScroll}
                  className="pt-4 px-3 pb-4 sm:pt-6 sm:px-6 sm:pb-6 overflow-y-auto flex-grow"
                >
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-4 leading-relaxed" {...props} />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-xl font-bold mt-6 mb-4 text-gray-900"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-lg font-bold mt-5 mb-3 text-gray-900"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-base font-bold mt-4 mb-2 text-gray-900"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="my-3 pl-6 list-disc" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="my-3 pl-6 list-decimal" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mb-1" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-4 border-gray-200 pl-4 italic my-4 text-gray-600"
                            {...props}
                          />
                        ),
                        code: ({ node, className, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || "");
                          const isInline =
                            !match &&
                            !className?.includes("contains-task-list");
                          return isInline ? (
                            <code
                              className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block bg-gray-100 p-3 rounded-md text-sm font-mono overflow-x-auto my-4 text-gray-800"
                              {...props}
                            />
                          );
                        },
                      }}
                    >
                      {secondStepResult.content || "正在生成内容..."}
                    </ReactMarkdown>
                  </div>

                  {/* 将按钮移到内容底部 */}
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleFinalGeneration}
                      disabled={
                        thirdStepLoading ||
                        !secondStepResult ||
                        !secondStepResult.isComplete
                      }
                      size="sm"
                      className="h-8 gap-1 text-xs sm:text-sm bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      {thirdStepLoading ? (
                        <>
                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        "生成最终文章"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg h-[calc(100%-3px)] flex flex-col">
                <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 pb-3 pt-4 px-3 sm:pb-4 sm:pt-5 sm:px-5 flex-shrink-0">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm sm:text-base font-medium">
                      等待生成
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-3 pb-4 sm:pt-6 sm:px-6 sm:pb-6 overflow-y-auto flex-grow">
                  <div className="text-center text-gray-500 text-xs sm:text-sm">
                    请在左侧输入补充信息并点击生成
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * StepIndicator 组件
 * 
 * 功能：可视化展示查询处理的各个步骤和进度
 * 
 * 核心特性：
 * 1. 步骤可视化：
 *    - 垂直时间线布局
 *    - 数字编号指示器
 *    - 当前步骤高亮显示
 *    - 连接线显示步骤关系
 * 
 * 2. 交互功能：
 *    - 可展开/折叠步骤详情
 *    - 点击步骤查看内容
 *    - 支持全部展开/折叠
 *    - 响应式交互反馈
 * 
 * 3. 内容展示：
 *    - 步骤标题和类型图标
 *    - Markdown格式的详细内容
 *    - 支持链接和富文本
 *    - 智能内容过滤
 * 
 * 4. 状态管理：
 *    - 跟踪展开状态
 *    - 加载状态指示
 *    - 步骤执行进度
 * 
 * 5. 视觉设计：
 *    - 渐变透明度效果
 *    - 平滑过渡动画
 *    - 响应式布局
 *    - 统一的间距和颜色
 * 
 * 步骤类型支持：
 * - analysis：分析步骤
 * - generation：生成步骤
 * - web：网络查询步骤
 * - 其他自定义类型
 * 
 * 内容处理：
 * - 自动解析步骤内容
 * - 提取标题和详情
 * - Markdown渲染
 * - 链接安全处理
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { StepContentResult } from "../types";
import { getStepIcon, parseStepContent } from "../utils/helpers";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface StepIndicatorProps {
  steps: string[];
  expandedSteps: string[];
  toggleStep: (stepId: string) => void;
  toggleAllSteps: (steps: string[]) => void;
  isLoading: boolean;
  onStepClick: (step: string, stepId: string) => void;
}

export function StepIndicator({
  steps,
  expandedSteps,
  toggleStep,
  toggleAllSteps,
  isLoading,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      {/* 进度指示器 */}
      {steps.length > 0 && (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-2">
            {steps.map((step, index) => {
              const stepData = parseStepContent(step);
              const isCurrentStep = index === steps.length - 1 && isLoading;
              const stepId = `step-${index}`;
              const isExpanded = expandedSteps.includes(stepId);

              return (
                <div
                  key={index}
                  className={`relative pl-8 transition-all duration-200 ${
                    isCurrentStep ? "opacity-100" : "opacity-80"
                  }`}
                >
                  {/* 步骤指示器 */}
                  <div
                    className={`absolute left-0 w-6 h-6 rounded-full flex items-center justify-center
                    ${isCurrentStep ? "bg-primary" : "bg-muted"}`}
                  >
                    <span
                      className={`text-xs font-medium
                      ${
                        isCurrentStep
                          ? "text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* 步骤内容 */}
                  <div
                    className={`rounded-lg transition-colors cursor-pointer overflow-hidden
                    ${isCurrentStep ? "bg-muted/50" : "bg-background"}
                    ${isExpanded ? "shadow-sm" : ""}`}
                  >
                    <div
                      className="flex items-center justify-between p-2"
                      onClick={() => onStepClick(step, stepId)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0 w-4">
                          {stepData.type ? getStepIcon(stepData.type) : null}
                        </div>
                        <span className="font-medium truncate text-xs">
                          {stepData.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {isExpanded &&
                      stepData.content &&
                      stepData.type !== "generation" &&
                      !(stepData.type === "analysis" && stepData.details) && (
                        <div className="px-3 pb-2">
                          <div className="prose prose-xs dark:prose-invert max-w-none break-words overflow-hidden [&>h3]:mt-2 [&>h3]:mb-1 [&>h3]:text-xs [&>h3]:font-medium [&>p]:my-1 [&>p]:text-xs [&>p]:text-muted-foreground [&>blockquote]:mt-2 [&>blockquote]:border-l-2 [&>blockquote]:pl-2 [&>blockquote]:italic [&>blockquote]:text-xs [&>*]:break-words [&>*]:overflow-wrap-anywhere">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {stepData.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                    {stepData.details &&
                      stepData.type !== "generation" &&
                      stepData.type !== "web" &&
                      stepData.type !== "analysis" &&
                      isExpanded && (
                        <div className="px-3 pb-2">
                          <div className="prose prose-xs dark:prose-invert max-w-none break-words overflow-hidden">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {stepData.details}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

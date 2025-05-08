// 步骤指示器组件，显示：

// - 查询处理的各个步骤
// - 步骤的类型和内容
// - 当前正在执行的步骤
// - 可展开/折叠的步骤详情
// - 步骤执行状态

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
                          {getStepIcon(stepData.type)}
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

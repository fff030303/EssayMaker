"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Upload, FileText } from "lucide-react";
import { AgentType } from "../types";
import { cn } from "@/lib/utils";
// 移除侧边栏导入
// import { useSidebar } from "@/components/ui/sidebar";

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  shouldShowMultiStepFlow: boolean;
  hasSecondStepResult: boolean;
  hasFinalResult: boolean;
  isThirdStepLoading: boolean;
  agentType: AgentType;
  isProfessorSearch: boolean;
  isPSAssistant: boolean;
  isCVAssistant: boolean;
}

export function StepNavigation({
  currentStep,
  onStepChange,
  shouldShowMultiStepFlow,
  hasSecondStepResult,
  hasFinalResult,
  isThirdStepLoading,
  agentType,
  isProfessorSearch = false,
  isPSAssistant = false,
  isCVAssistant = false,
}: StepNavigationProps) {
  // 如果不需要多步骤流程且不是教授搜索且不是PS初稿助理且不是CV助理，则不显示导航
  if (!shouldShowMultiStepFlow && !isProfessorSearch && !isPSAssistant && !isCVAssistant) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border left-0",
        "transition-all duration-300"
      )}
    >
      <div className="mx-auto p-2 max-w-3xl">
        <div className="flex justify-center items-center gap-2 md:gap-8">
          {/* 步骤1按钮 */}
          <Button
            variant={currentStep === 1 ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-10 min-w-[100px] rounded-md",
              currentStep === 1
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : ""
            )}
            onClick={() => onStepChange(1)}
          >
            {currentStep > 1 ? (
              <ArrowLeft className="h-4 w-4 mr-1" />
            ) : (
              <span className="h-5 w-5 flex items-center justify-center bg-background text-primary rounded-full mr-1 text-xs font-bold">
                1
              </span>
            )}
            {isProfessorSearch 
              ? "查询结果" 
              : isPSAssistant 
                ? <><Upload className="h-4 w-4 mr-1" />文件上传</> 
                : isCVAssistant
                  ? <><Upload className="h-4 w-4 mr-1" />简历上传</>
                  : "查询信息"}
          </Button>

          {/* 步骤分隔线 */}
          <div className="h-[2px] w-8 md:w-12 bg-muted"></div>

          {/* 步骤2按钮 */}
          <Button
            variant={currentStep === 2 ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-10 min-w-[100px] rounded-md",
              currentStep === 2
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : currentStep < 2
                ? "text-muted-foreground"
                : ""
            )}
            onClick={() => onStepChange(2)}
            disabled={currentStep < 2 && !shouldShowMultiStepFlow && !isProfessorSearch && !isPSAssistant && !isCVAssistant}
          >
            {currentStep > 2 ? (
              <ArrowLeft className="h-4 w-4 mr-1" />
            ) : currentStep < 2 ? (
              <span className="h-5 w-5 flex items-center justify-center bg-muted text-muted-foreground rounded-full mr-1 text-xs font-bold">
                2
              </span>
            ) : (
              <span className="h-5 w-5 flex items-center justify-center bg-background text-primary rounded-full mr-1 text-xs font-bold">
                2
              </span>
            )}
            {isProfessorSearch 
              ? "教授信息" 
              : isPSAssistant 
                ? <><FileText className="h-4 w-4 mr-1" />初稿生成</> 
                : isCVAssistant
                  ? <><FileText className="h-4 w-4 mr-1" />简历生成</>
                  : "补充信息"}
          </Button>

          {/* 如果是常规多步骤流程，显示第三步按钮；如果是教授搜索类型或PS初稿助理，不显示第三步按钮 */}
          {shouldShowMultiStepFlow && !isProfessorSearch && !isPSAssistant && (
            <>
              {/* 步骤分隔线 */}
              <div className="h-[2px] w-8 md:w-12 bg-muted"></div>

              {/* 步骤3按钮 */}
              <Button
                variant={currentStep === 3 ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-10 min-w-[100px] rounded-md",
                  currentStep === 3
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : currentStep < 3 || !hasSecondStepResult
                    ? "text-muted-foreground"
                    : ""
                )}
                onClick={() => onStepChange(3)}
                disabled={
                  currentStep < 3 && 
                  (!hasSecondStepResult || isThirdStepLoading)
                }
              >
                {currentStep === 3 && hasFinalResult ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : currentStep < 3 || !hasSecondStepResult ? (
                  <span className="h-5 w-5 flex items-center justify-center bg-muted text-muted-foreground rounded-full mr-1 text-xs font-bold">
                    3
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4 mr-1" />
                )}
                最终文章
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StepNavigation 组件
 * 
 * 功能：提供多步骤流程的导航控制界面
 * 
 * 核心特性：
 * 1. 步骤导航：
 *    - 显示当前步骤位置
 *    - 支持前进/后退操作
 *    - 步骤状态可视化
 *    - 进度条指示
 * 
 * 2. 交互控制：
 *    - 点击切换步骤
 *    - 键盘快捷键支持
 *    - 条件性导航限制
 *    - 状态验证
 * 
 * 3. 视觉反馈：
 *    - 当前步骤高亮
 *    - 完成状态标记
 *    - 禁用状态显示
 *    - 平滑过渡动画
 * 
 * 4. 响应式设计：
 *    - 移动端适配
 *    - 紧凑布局选项
 *    - 自适应间距
 * 
 * 5. 状态管理：
 *    - 步骤完成跟踪
 *    - 验证状态检查
 *    - 错误状态处理
 * 
 * 使用场景：
 * - 多步骤表单流程
 * - 向导式操作指导
 * - 工作流程管理
 * - 进度跟踪显示
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  FileText,
  Navigation2,
} from "lucide-react";
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
  isRLAssistant: boolean;
  isDraftAssistant?: boolean;
  hasSubmittedDraft?: boolean;
  hasAnalysisResult?: boolean;
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
  isRLAssistant = false,
  isDraftAssistant = false,
  hasSubmittedDraft = false,
  hasAnalysisResult = false,
}: StepNavigationProps) {
  // 如果不需要多步骤流程且不是教授搜索且不是PS初稿助理且不是CV助理且不是RL助理且不是分稿助理，则不显示导航
  if (
    !shouldShowMultiStepFlow &&
    !isProfessorSearch &&
    !isPSAssistant &&
    !isCVAssistant &&
    !isRLAssistant &&
    !isDraftAssistant
  ) {
    return null;
  }

  // 确定总步骤数
  const totalSteps =
    (shouldShowMultiStepFlow || isDraftAssistant) &&
    !isProfessorSearch &&
    !isPSAssistant &&
    !isRLAssistant
      ? 3
      : 2;

  return (
    <div
      className={cn(
        "fixed bottom-0 right-0 z-10 bg-background border-t border-border",
        "transition-all duration-300 ml-[60px] left-0"
      )}
    >
      {/* 添加超细线进度条 - 不增加高度 */}
      <div className="h-[1px] bg-muted w-full">
        <div
          className="h-full bg-primary/40 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>

      <div className="mx-auto py-1 px-2 max-w-2xl">
        {/* 使用标签页样式的导航 */}
        <nav className="flex justify-center items-center">
          {/* 步骤1标签 */}
          <div
            onClick={() => onStepChange(1)}
            className={cn(
              "px-3 py-1 text-xs cursor-pointer relative flex items-center",
              "border-0 hover:bg-transparent transition-colors duration-150",
              currentStep === 1
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <div className="flex items-center justify-center">
              {isProfessorSearch
                ? "查询结果"
                : isPSAssistant
                ? "文件上传"
                : isCVAssistant
                ? "简历上传"
                : isRLAssistant
                ? "推荐信信息"
                : "查询信息"}
            </div>
            {/* 当前步骤的下划线指示器 */}
            {currentStep === 1 && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full"></div>
            )}
          </div>

          {/* 分隔符 */}
          <div className="text-muted-foreground/30 px-2">/</div>

          {/* 步骤2标签 */}
          <div
            onClick={() => {
              if (
                !(
                  currentStep < 2 &&
                  !shouldShowMultiStepFlow &&
                  !isProfessorSearch &&
                  !isPSAssistant &&
                  !isCVAssistant &&
                  !isRLAssistant &&
                  !isDraftAssistant
                )
              ) {
                onStepChange(2);
              }
            }}
            className={cn(
              "px-3 py-1 text-xs cursor-pointer relative flex items-center",
              "border-0 hover:bg-transparent transition-colors duration-150",
              currentStep === 2
                ? "text-primary font-medium"
                : "text-muted-foreground",
              currentStep < 2 &&
                !shouldShowMultiStepFlow &&
                !isProfessorSearch &&
                !isPSAssistant &&
                !isCVAssistant &&
                !isRLAssistant &&
                !isDraftAssistant
                ? "opacity-50 cursor-not-allowed"
                : ""
            )}
          >
            <div className="flex items-center justify-center">
              {isProfessorSearch
                ? "教授信息"
                : isPSAssistant
                ? "素材分析"
                : isCVAssistant
                ? "简历生成"
                : isRLAssistant
                ? "推荐信生成"
                : "补充信息"}
            </div>
            {/* 当前步骤的下划线指示器 */}
            {currentStep === 2 && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full"></div>
            )}
          </div>

          {/* 如果是常规多步骤流程或分稿助理，显示第三步标签 */}
          {(shouldShowMultiStepFlow || isDraftAssistant) &&
            !isProfessorSearch &&
            !isPSAssistant &&
            !isRLAssistant && (
              <>
                {/* 分隔符 */}
                <div className="text-muted-foreground/30 px-2">/</div>

                {/* 步骤3标签 */}
                <div
                  onClick={() => {
                    if (
                      !(
                        currentStep < 3 &&
                        (!hasSecondStepResult || isThirdStepLoading)
                      )
                    ) {
                      onStepChange(3);
                    }
                  }}
                  className={cn(
                    "px-3 py-1 text-xs cursor-pointer relative flex items-center",
                    "border-0 hover:bg-transparent transition-colors duration-150",
                    currentStep === 3
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                    currentStep < 3 &&
                      (!hasSecondStepResult || isThirdStepLoading)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  )}
                >
                  <div className="flex items-center justify-center">
                    最终文章
                    {currentStep === 3 && hasFinalResult && (
                      <Check className="h-3 w-3 ml-1 text-primary" />
                    )}
                  </div>
                  {/* 当前步骤的下划线指示器 */}
                  {currentStep === 3 && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full"></div>
                  )}
                </div>
              </>
            )}
        </nav>
      </div>
    </div>
  );
}

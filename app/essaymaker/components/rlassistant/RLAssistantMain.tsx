/**
 * RLAssistantMain 组件
 * 
 * 功能：推荐信助理的主界面组件，协调推荐信生成的完整流程
 * 
 * 核心特性：
 * 1. 流程管理：
 *    - 两步式推荐信生成流程
 *    - 步骤状态跟踪和切换
 *    - 进度指示和导航
 *    - 流程完成度检测
 * 
 * 2. 组件协调：
 *    - 文件上传组件集成
 *    - 分析报告显示组件
 *    - 推荐信生成组件
 *    - 状态在组件间传递
 * 
 * 3. 状态管理：
 *    - 当前步骤状态
 *    - 结果数据管理
 *    - 加载状态控制
 *    - 用户交互状态
 * 
 * 4. 用户体验：
 *    - 平滑的步骤切换
 *    - 清晰的操作指引
 *    - 实时反馈机制
 *    - 错误提示和处理
 * 
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 内容溢出处理
 * 
 * 流程步骤：
 * 1. 文件上传：上传推荐信相关文件
 * 2. 结果展示：显示分析报告和生成的推荐信
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState } from "react";
import { RLFileUploadForm } from "./RLFileUploadForm";
import { RLReportAndResumeDisplay } from "./RLAnalysisReportDisplay";
import { DisplayResult } from "../../types";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";

interface RLAssistantMainProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  isRLGenerating?: boolean;
  onWritingRequirementsChange?: (requirements: string) => void;
}

export function RLAssistantMain({
  onStepChange,
  setResult,
  isRLGenerating = false,
  onWritingRequirementsChange,
}: RLAssistantMainProps = {}) {
  const [internalResult, setInternalResult] = useState<DisplayResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [writingRequirements, setWritingRequirements] = useState<string>("");

  // 创建统一的结果处理函数
  const handleResultChange = (result: DisplayResult | null) => {
    setInternalResult(result);
    if (setResult) {
      setResult(result);
    }
  };

  // 🆕 处理写作需求变化
  const handleWritingRequirementsChange = (requirements: string) => {
    setWritingRequirements(requirements);
    if (onWritingRequirementsChange) {
      onWritingRequirementsChange(requirements);
    }
  };

  return (
    <>
      {/* RL助理全屏加载动画 - 在第一步界面显示 */}
      {isRLGenerating && (
        <FullScreenLoadingAnimation 
          text="正在生成推荐信，请勿切换页面..." 
        />
      )}

      <div className="w-full max-w-[800px] mx-auto space-y-6">
        {/* 文件上传表单 */}
        <RLFileUploadForm
          onStepChange={onStepChange}
          setResult={handleResultChange}
          onWritingRequirementsChange={handleWritingRequirementsChange}
        />

        {/* 结果显示组件 */}
        <RLReportAndResumeDisplay
          result={internalResult}
          isLoading={isLoading}
          streamContent={streamContent}
          isComplete={isComplete}
        />
      </div>
    </>
  );
}

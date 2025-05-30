/**
 * CVAssistantMain 组件
 * 
 * 功能：CV助理的主界面组件，协调简历生成的完整流程
 * 
 * 核心特性：
 * 1. 流程管理：
 *    - 两步式简历生成流程
 *    - 步骤状态跟踪和切换
 *    - 进度指示和导航
 *    - 流程完成度检测
 * 
 * 2. 组件协调：
 *    - 文件上传组件集成
 *    - 报告和简历显示组件
 *    - 状态在组件间传递
 *    - 统一的错误处理
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
 * 1. 文件上传：上传简历相关文件
 * 2. 结果展示：显示分析报告和生成的简历
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

// CV助理主组件 - 统一管理CV助理的所有功能
// 参考PSAssistantMain的结构设计

import React, { useState } from "react";
import { DisplayResult } from "../../types";
import { CVFileUploadForm } from "./CVFileUploadForm";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
// 暂时注释掉这个导入来测试
// import { CVReportAndResumeDisplay } from "./CVReportAndResumeDisplay";

interface CVAssistantMainProps {
  onStepChange: (step: number) => void;
  setResult: (result: DisplayResult | null) => void;
  result?: DisplayResult | null;
  formattedResume?: DisplayResult | null;
  setFormattedResume?: (resume: DisplayResult | null) => void;
  isGeneratingResume?: boolean;
  handleResumeGeneration?: () => void;
  handleStreamResponse?: (response: ReadableStream) => void;
  isLoading?: boolean;
  // 新增：CV生成状态
  isCVGenerating?: boolean;
}

export function CVAssistantMain({
  onStepChange,
  setResult,
  result,
  formattedResume,
  setFormattedResume,
  isGeneratingResume,
  handleResumeGeneration,
  handleStreamResponse,
  isLoading,
  isCVGenerating = false,
}: CVAssistantMainProps) {
  // 本地状态管理
  const [localResult, setLocalResult] = useState<DisplayResult | null>(null);
  const [localFormattedResume, setLocalFormattedResume] =
    useState<DisplayResult | null>(null);

  // 使用传入的状态或本地状态
  const currentResult = result || localResult;
  const currentFormattedResume = formattedResume || localFormattedResume;

  // 处理结果更新
  const handleResultUpdate = (newResult: DisplayResult | null) => {
    if (setResult) {
      setResult(newResult);
    } else {
      setLocalResult(newResult);
    }
  };

  // 处理格式化简历更新
  const handleFormattedResumeUpdate = (newResume: DisplayResult | null) => {
    if (setFormattedResume) {
      setFormattedResume(newResume);
    } else {
      setLocalFormattedResume(newResume);
    }
  };

  return (
    <>
      {/* CV助理全屏加载动画 - 在第一步界面显示 */}
      {isCVGenerating && (
        <FullScreenLoadingAnimation 
          text="正在生成简历，请勿切换页面..." 
        />
      )}

      <div className="w-full space-y-6">
        {/* 文件上传表单 */}
        <CVFileUploadForm
          onStepChange={onStepChange}
          setResult={handleResultUpdate}
        />

        {/* 暂时注释掉结果显示区域来测试导入问题 */}
        {/* 
        {currentResult && (
          <CVReportAndResumeDisplay
            result={currentResult}
            formattedResume={currentFormattedResume}
            onFormattedResumeChange={handleFormattedResumeUpdate}
            onStepChange={onStepChange}
          />
        )}
        */}

        {/* 临时的简单显示 */}
        {currentResult && (
          <div className="p-4 border rounded">
            <h3>简历分析结果</h3>
            <p>结果已生成，请切换到第二步查看详细内容。</p>
          </div>
        )}
      </div>
    </>
  );
}

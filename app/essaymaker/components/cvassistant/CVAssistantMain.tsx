// CV助理主组件 - 统一管理CV助理的所有功能
// 参考PSAssistantMain的结构设计

import React, { useState } from "react";
import { DisplayResult } from "../../types";
import { CVFileUploadForm } from "./CVFileUploadForm";
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
  );
}

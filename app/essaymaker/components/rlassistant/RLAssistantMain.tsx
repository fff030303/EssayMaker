"use client";

import React, { useState } from "react";
import { RLFileUploadForm } from "./RLFileUploadForm";
import { RLReportAndResumeDisplay } from "./RLAnalysisReportDisplay";
import { DisplayResult } from "../../types";

interface RLAssistantMainProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
}

export function RLAssistantMain({
  onStepChange,
  setResult,
}: RLAssistantMainProps = {}) {
  const [internalResult, setInternalResult] = useState<DisplayResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [streamContent, setStreamContent] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);

  // 创建统一的结果处理函数
  const handleResultChange = (result: DisplayResult | null) => {
    setInternalResult(result);
    if (setResult) {
      setResult(result);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-6">
      {/* 文件上传表单 */}
      <RLFileUploadForm
        onStepChange={onStepChange}
        setResult={handleResultChange}
      />

      {/* 结果显示组件 */}
      <RLReportAndResumeDisplay
        result={internalResult}
        isLoading={isLoading}
        streamContent={streamContent}
        isComplete={isComplete}
      />
    </div>
  );
}

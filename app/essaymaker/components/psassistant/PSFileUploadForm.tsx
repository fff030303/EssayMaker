"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { DisplayResult } from "../../types";
import { usePSReport } from "./hooks/usePSReport";
import { AdvancedInputArea } from "./AdvancedInputArea";
import { Session } from "next-auth";

interface PSFileUploadFormProps {
  setResult: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any;
  session: Session | null;
  onStepChange?: (step: number) => void;
  onUserInputChange?: (
    direction: string,
    requirements: string,
    transcriptAnalysis: string | null
  ) => void;
}

export function PSFileUploadForm({
  setResult,
  toast,
  session,
  onStepChange,
  onUserInputChange,
}: PSFileUploadFormProps) {
  const { isLoading, handleStreamResponse } = usePSReport({
    setResult,
    toast,
    session,
  });

  // 本地状态管理
  const [direction, setDirection] = useState("");
  const [requirements, setRequirements] = useState("");
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // 监听输入变化并通知父组件
  useEffect(() => {
    if (onUserInputChange) {
      onUserInputChange(direction, requirements, null);
      console.log("PSDraftAssistant - 通知父组件输入变化", {
        direction,
        requirements,
      });
    }
  }, [direction, requirements, onUserInputChange]);

  // 处理提交 - 无参数函数，内部收集数据
  const handleSubmit = () => {
    console.log("PSFileUploadForm - 处理提交", {
      direction,
      requirements,
      draftFile: draftFile?.name,
      otherFilesCount: otherFiles.length,
    });

    // 立即跳转到第二步显示生成过程
    if (onStepChange) {
      console.log("PSFileUploadForm - 立即跳转到第二步");
      onStepChange(2);
    }

    // 构建查询文本
    let queryText = `请帮我写一份关于${direction}的初稿`;
    if (requirements) {
      queryText += `，具体需求：${requirements}`;
    }

    // 准备文件数组
    const files = draftFile ? [draftFile, ...otherFiles] : [...otherFiles];

    console.log("PSFileUploadForm - 调用 handleStreamResponse", {
      queryText,
      filesCount: files.length,
    });

    // 调用流处理函数
    handleStreamResponse(queryText, files);
  };

  // 输入变化处理
  const handleInputChange = () => {
    console.log("PSDraftAssistant - 输入变化", { direction, requirements });
  };

  // 文件变化处理
  const handleFileChange = () => {
    console.log("PSDraftAssistant - 文件变化", {
      draftFile: draftFile?.name,
      otherFilesCount: otherFiles.length,
    });
  };

  return (
    <AdvancedInputArea
      isLoading={isLoading}
      type="draft"
      direction={direction}
      requirements={requirements}
      setDirection={setDirection}
      setRequirements={setRequirements}
      draftFile={draftFile}
      otherFiles={otherFiles}
      setDraftFile={setDraftFile}
      setOtherFiles={setOtherFiles}
      onSubmitClick={handleSubmit}
      onInputChange={handleInputChange}
      onFileChange={handleFileChange}
    />
  );
}

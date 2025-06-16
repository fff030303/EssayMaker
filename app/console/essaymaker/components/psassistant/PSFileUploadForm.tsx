/**
 * PSFileUploadForm 组件
 *
 * 功能：PS助理的文件上传表单组件，处理个人陈述相关文件的上传
 *
 * 核心特性：
 * 1. 文件上传管理：
 *    - 支持多种文件格式（PDF、Word、图片等）
 *    - 拖拽上传和点击选择
 *    - 文件预览和删除功能
 *    - 上传进度指示
 *
 * 2. 文件分类：
 *    - 素材文件：个人经历、成就等
 *    - 成绩单文件：学术成绩记录
 *    - 其他材料：证书、推荐信等
 *    - 智能文件类型识别
 *
 * 3. 表单验证：
 *    - 文件格式验证
 *    - 文件大小限制
 *    - 必填字段检查
 *    - 实时验证反馈
 *
 * 4. 用户体验：
 *    - 直观的操作界面
 *    - 清晰的状态指示
 *    - 友好的错误提示
 *    - 响应式设计
 *
 * 5. 数据处理：
 *    - 文件内容解析
 *    - 数据格式转换
 *    - 信息提取和整理
 *    - 错误处理和重试
 *
 * 支持的文件类型：
 * - PDF文档
 * - Word文档（.doc, .docx）
 * - 图片文件（.jpg, .png, .gif）
 * - 文本文件（.txt）
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { DisplayResult } from "../../types";
import { usePSReport } from "./hooks/usePSReport";
import { usePSLogger } from "./hooks/usePSLogger";
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
  const { logReportResult } = usePSLogger();

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
  // 新增的高级信息状态
  const [schoolInfo, setSchoolInfo] = useState("");
  const [programInfo, setProgramInfo] = useState("");
  const [otherRequirementsInput, setOtherRequirementsInput] = useState("");
  
  // 🆕 粘贴模式状态
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pastedText, setPastedText] = useState("");

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
  const handleSubmit = async () => {
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

    // 准备文件数组 - 根据模式决定是否使用文件
    const files = (isPasteMode || !draftFile) ? [] : [draftFile, ...otherFiles];
    const transcriptFiles = isPasteMode ? [] : otherFiles; // 成绩单文件
    const materialDoc = isPasteMode ? pastedText : ""; // 粘贴的文档内容

    console.log("PSFileUploadForm - 调用 handleStreamResponse", {
      queryText,
      isPasteMode,
      filesCount: files.length,
      transcriptFilesCount: transcriptFiles.length,
      materialDocLength: materialDoc.length,
    });

    // 调用handleStreamResponse，传递正确的参数
    await handleStreamResponse(
      queryText,
      files,
      transcriptFiles,
      materialDoc, // 🆕 传递粘贴的文档内容
      async (requestData, resultData, isSuccess, duration, errorMessage) => {
        console.log("[PSFileUploadForm] 记录PS报告结果日志", {
          isSuccess,
          duration,
          contentLength: resultData?.content?.length || 0,
        });

        await logReportResult(
          requestData,
          resultData,
          isSuccess,
          duration,
          errorMessage
        );
      }
    );
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
      // 传递新增的高级信息props
      schoolInfo={schoolInfo}
      setSchoolInfo={setSchoolInfo}
      programInfo={programInfo}
      setProgramInfo={setProgramInfo}
      otherRequirements={otherRequirementsInput}
      setOtherRequirements={setOtherRequirementsInput}
      // 🆕 粘贴模式相关props
      isPasteMode={isPasteMode}
      setPasteMode={setIsPasteMode}
      pastedText={pastedText}
      setPastedText={setPastedText}
    />
  );
}

// 第一步界面组件，负责：

// - 显示查询输入区域
// - 处理用户输入和提交
// - 展示查询结果
// - 检测查询类型并通知父组件
// - 根据查询结果决定是否需要进入多步骤流程

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { DisplayResult, AgentType } from "../types";
import { InputArea } from "./InputArea";
import { ResultSection } from "./ResultSection";
import { debounce } from "../utils/helpers";
import { QuickActionButtons, ButtonType } from "./QuickActionButtons";
import { useToast } from "@/hooks/use-toast";
import { ResultDisplay } from "./ResultDisplay";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { AssistantTips } from "./AssistantTips";
import { Button } from "@/components/ui/button";
import { CVAssistantMain } from "./cvassistant";
import { PSAssistantMain } from "./psassistant/index";
import { RLAssistantMain } from "./rlassistant/RLAssistantMain";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Sparkles, User, FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// 在 FirstStepProps 接口中添加 isProfessorSearch 属性
interface FirstStepProps {
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  result: DisplayResult | null;
  setResult: (result: DisplayResult | null) => void;
  showExamples: boolean;
  setShowExamples: (show: boolean) => void;
  isInputExpanded: boolean;
  setIsInputExpanded: (expanded: boolean) => void;
  expandedSteps: string[];
  setExpandedSteps: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: () => void;
  handleStepClick: (step: string, stepId: string) => void;
  handleExampleClick: (content: string) => void;
  setDetectedAgentType?: (type: AgentType) => void;
  onStepChange?: (step: number) => void;
  isProfessorSearch?: boolean; // 添加这个属性
  isPSAssistant?: boolean; // 添加这个属性，表示当前是否为PS初稿助理模式
  isCVAssistant?: boolean; // 添加这个属性，表示当前是否为CV助理模式
  isRLAssistant?: boolean; // 添加这个属性，表示当前是否为RL助理模式
  files: File[]; // 添加文件状态
  setFiles: React.Dispatch<React.SetStateAction<File[]>>; // 添加文件状态设置函数
  // 添加最终初稿相关的属性
  finalDraft?: DisplayResult | null;
  isGeneratingFinalDraft?: boolean;
  handleFinalDraftSubmit?: (
    draftQuery: string,
    draftFiles: File[],
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null // 添加成绩单解析参数，支持null
  ) => Promise<void>;
  setFinalDraft?: (finalDraft: DisplayResult | null) => void;
  onButtonChange?: (type: ButtonType) => void; // 添加按钮切换处理函数
  setIsPSAssistant?: (isPS: boolean) => void; // 添加设置PS初稿助理状态
  setIsCVAssistant?: (isCV: boolean) => void; // 添加设置CV助理状态
  setIsRLAssistant?: (isRL: boolean) => void; // 添加设置RL助理状态
  setShowStepNavigation?: (show: boolean) => void; // 添加控制步骤导航显示
  onUserInputChange?: (
    direction: string,
    requirements: string,
    transcriptAnalysis: string | null
  ) => void; // 添加接收用户输入的回调
  onOtherFilesChange?: (files: File[]) => void; // 添加接收其他文件的回调
  // 添加直接访问API的函数，以绕过handleSubmit
  handleStreamResponse?: (
    query: string,
    materialFiles?: File[],
    transcriptFiles?: File[]
  ) => Promise<void>;
  currentAssistantType?: string; // 添加当前助理类型属性
  onCvClick?: () => void; // 添加CV助理按钮点击回调
  onRlClick?: () => void; // 添加RL助理按钮点击回调
}

export function FirstStep({
  query,
  setQuery,
  isLoading,
  result,
  setResult,
  showExamples,
  setShowExamples,
  isInputExpanded,
  setIsInputExpanded,
  expandedSteps,
  setExpandedSteps,
  handleSubmit,
  handleStepClick,
  handleExampleClick,
  setDetectedAgentType,
  onStepChange,
  isProfessorSearch = false, // 设置默认值
  isPSAssistant, // 使用外部传入的isPSAssistant
  isCVAssistant, // 使用外部传入的isCVAssistant
  isRLAssistant, // 使用外部传入的isRLAssistant
  files, // 使用外部传入的files
  setFiles, // 使用外部传入的setFiles
  finalDraft,
  isGeneratingFinalDraft,
  handleFinalDraftSubmit,
  setFinalDraft,
  onButtonChange,
  setIsPSAssistant,
  setIsCVAssistant,
  setIsRLAssistant,
  setShowStepNavigation,
  onUserInputChange,
  onOtherFilesChange,
  handleStreamResponse,
  currentAssistantType,
  onCvClick,
  onRlClick,
}: FirstStepProps) {
  // 创建结果区域的引用
  const resultRef = useRef<HTMLDivElement>(null);

  // 使用toast钩子
  const { toast } = useToast();

  // 添加状态来跟踪当前输入模式
  const [inputMode, setInputMode] = useState<"simple" | "draft" | "custom">(
    "draft"
  );

  // 添加状态控制是否应该隐藏结果（用于清空初稿提纯结果）
  const [shouldHideResult, setShouldHideResult] = useState(false);

  // 记录上一次的输入模式
  const prevInputModeRef = useRef(inputMode);

  // 当输入模式变化时，如果从draft切换到其他模式，设置shouldHideResult为true
  useEffect(() => {
    if (prevInputModeRef.current === "draft" && inputMode !== "draft") {
      console.log("从初稿模式切换出去，隐藏结果");
      setShouldHideResult(true);

      // 为了安全起见，也清空query和files
      setQuery("");
      setFiles([]);
    } else if (inputMode === "draft") {
      // 当进入draft模式时，重置shouldHideResult
      setShouldHideResult(false);
    }

    // 更新上一次的输入模式记录
    prevInputModeRef.current = inputMode;
  }, [inputMode, setQuery, setFiles]);

  // 当用户在非draft模式下提交新的查询时，重置shouldHideResult
  useEffect(() => {
    if (inputMode !== "draft" && result) {
      setShouldHideResult(false);
    }
  }, [result, inputMode]);

  // 为简单输入区域单独保存一个状态
  const [simpleQuery, setSimpleQuery] = useState<string>("");
  const [simpleFiles, setSimpleFiles] = useState<File[]>([]);

  // 添加提示文本状态
  const [placeholder, setPlaceholder] =
    useState<string>("你可以在这里输入问题或要求...");

  // 新增: 最终初稿生成状态
  const [finalDraftResult, setFinalDraftResult] =
    useState<DisplayResult | null>(null);
  const [localIsGeneratingFinalDraft, setLocalIsGeneratingFinalDraft] =
    useState<boolean>(false);

  // 跟踪files状态变化
  useEffect(() => {
    console.log("FirstStep - files状态更新 - 文件数量:", files.length);
  }, [files]);

  // 同步简单模式的状态到父组件
  useEffect(() => {
    if (inputMode === "simple" || inputMode === "custom") {
      setQuery(simpleQuery);
      setFiles(simpleFiles);
    }
  }, [inputMode, simpleQuery, simpleFiles, setQuery, setFiles]);

  // 从步骤中检测agent类型
  const detectAgentTypeFromSteps = (steps: string[]): AgentType => {
    // 查找包含转移到特定agent的步骤
    for (const step of steps) {
      const lowerStep = step.toLowerCase();

      if (
        lowerStep.includes("transfer to course info compile expert") ||
        lowerStep.includes("course_info_compile_expert")
      ) {
        return AgentType.COURSE_INFO;
      }

      if (
        lowerStep.includes("transfer to university research coordinator") ||
        lowerStep.includes("university_research_coordinator")
      ) {
        return AgentType.UNIVERSITY_RESEARCH;
      }

      if (
        lowerStep.includes("transfer to application advisor") ||
        lowerStep.includes("application_advisor")
      ) {
        return AgentType.APPLICATION_ADVISOR;
      }

      if (
        lowerStep.includes("transfer to research expert") ||
        lowerStep.includes("research_expert")
      ) {
        return AgentType.RESEARCH;
      }

      if (
        lowerStep.includes("transfer to professor search expert") ||
        lowerStep.includes("professor_search_expert")
      ) {
        return AgentType.PROFESSOR_SEARCH; // 需要在AgentType枚举中添加这个类型
      }
    }

    return AgentType.UNKNOWN;
  };

  // 为跟踪上一次检测到的agent类型添加ref
  const prevAgentTypeRef = useRef<AgentType>(AgentType.UNKNOWN);

  // 当结果更新时，检测agent类型并通知父组件
  useEffect(() => {
    if (result?.steps && result.steps.length > 0 && setDetectedAgentType) {
      const agentType = detectAgentTypeFromSteps(result.steps);

      // 只有当检测到的类型与之前不同时才更新
      if (agentType !== prevAgentTypeRef.current) {
        prevAgentTypeRef.current = agentType;
        setDetectedAgentType(agentType);
      }
    }
  }, [result, setDetectedAgentType]);

  // 新增：监听finalDraftResult变化，实现流式生成检测
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (finalDraftResult && !finalDraftResult.isComplete) {
      // 设置3秒定时器
      timeoutId = setTimeout(() => {
        // 3秒内没有新内容，认为生成完成
        setFinalDraftResult((prev) => {
          if (prev) {
            return {
              ...prev,
              isComplete: true,
            };
          }
          return prev;
        });
      }, 3000);
    }

    // 清理定时器
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [finalDraftResult]);

  // 为跟踪上一次的输入值添加ref
  const prevInputValueRef = useRef<string>("");

  // 处理简单输入区域的提交
  const handleSimpleSubmit = useCallback(() => {
    // 验证输入
    if (!simpleQuery.trim()) {
      toast({
        title: "输入错误",
        description: "请输入内容",
        variant: "destructive",
      });
      return;
    }

    // 在提交新查询时重置shouldHideResult
    setShouldHideResult(false);

    // 处理PS分稿助理模式 - 通过placeholder检测当前模式
    let finalQuery = simpleQuery;

    // 检测是否处于PS分稿助理模式
    if (inputMode === "simple" && placeholder.includes("分稿")) {
      // 自动为用户输入添加详细的查询模板
      finalQuery = `请提供${simpleQuery}课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。`;
      console.log("PS分稿助理 - 自动拼接查询:", finalQuery);
    }

    // 更新父组件状态
    setQuery(finalQuery);
    setFiles(simpleFiles);
    setShowExamples(false);
    setIsInputExpanded(false);

    // 调用父组件提交
    handleSubmit();
  }, [
    simpleQuery,
    simpleFiles,
    setQuery,
    setFiles,
    setShowExamples,
    setIsInputExpanded,
    handleSubmit,
    toast,
    inputMode,
    placeholder,
  ]);

  // 处理快速操作按钮点击事件
  const handleDraftClick = () => {
    // 切换到初稿高级输入模式
    setInputMode("draft");
    // 不再需要在这里清空，因为会在统一的handleButtonChange中处理
  };

  // 切换到简单模式，而不是复杂模式的custom类型
  const handleCustomClick = () => {
    setInputMode("simple");
    // 设置适合分稿的简洁提示文本
    setPlaceholder(
      "例如：请提供南加州大学(USC) 经济学硕士课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。"
    );
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  // 切换到简单模式
  const handleSchoolProfessorClick = () => {
    setInputMode("simple");
    // 更改提示文本而不是直接设置查询内容
    setPlaceholder("例如：查询斯坦福大学计算机科学系的教授信息");
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  const handleQuestionClick = () => {
    // 切换到简单模式
    setInputMode("simple");
    // 更改提示文本而不是直接设置查询内容
    setPlaceholder("例如：介绍一下留学申请的主要步骤和注意事项");
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  // 添加统一的按钮切换处理函数 - 清空输入和文件
  const handleButtonChange = useCallback(
    (type: ButtonType) => {
      console.log("按钮切换至:", type);

      // 清空所有输入和文件
      setSimpleQuery("");
      setSimpleFiles([]);

      // 同时清空父组件的状态
      setQuery("");
      setFiles([]);

      // 直接将result设为null，确保结果不会显示
      setResult(null);

      // 设置shouldHideResult为true，确保即使有result也不会显示
      setShouldHideResult(true);

      // 清空个人陈述初稿
      if (setFinalDraft) {
        setFinalDraft(null);
      }

      // 设置CV助理状态
      if (setIsCVAssistant) {
        setIsCVAssistant(type === "cv");
      }

      // 同步更新inputMode，确保状态一致
      if (type === "draft") {
        setInputMode("draft");
      } else {
        setInputMode("simple");
      }
    },
    [
      setQuery,
      setFiles,
      setResult,
      setShouldHideResult,
      setFinalDraft,
      setIsCVAssistant,
    ]
  );

  // 新增：处理清空生成内容
  const handleClearGeneratedContent = useCallback(() => {
    // 清空最终初稿结果
    setFinalDraftResult(null);
    // 清空父组件的result
    setResult(null);

    // 新增：清空用户输入和上传的文件
    setSimpleQuery("");
    setSimpleFiles([]);

    // 显示清空成功提示
    toast({
      title: "已清空",
      description: "所有内容已重置",
    });
  }, [setResult, setFinalDraftResult, setSimpleQuery, setSimpleFiles]);

  // 添加状态来跟踪当前助理类型
  const [internalAssistantType, setInternalAssistantType] = useState<
    "draft" | "cv" | "ps" | "custom" | "rl"
  >("draft");

  return (
    <div className="w-full flex flex-col items-center">
      {/* 快速操作按钮 */}
      <QuickActionButtons
        onDraftClick={handleDraftClick}
        onSchoolProfessorClick={handleSchoolProfessorClick}
        onQuestionClick={handleQuestionClick}
        onCustomClick={handleCustomClick}
        onCvClick={onCvClick}
        onRlClick={onRlClick}
        onButtonChange={onButtonChange}
        setResult={setResult}
        setIsPSAssistant={setIsPSAssistant}
        setShowStepNavigation={setShowStepNavigation}
        setIsCVAssistant={setIsCVAssistant}
        setIsRLAssistant={setIsRLAssistant}
        setCurrentAssistantType={setInternalAssistantType}
      />

      {/* 使用互斥条件显示提示组件，确保同时只显示一个提示 */}
      {(() => {
        // 按照优先级顺序显示提示
        if (internalAssistantType === "cv") {
          return <AssistantTips type="cv" />;
        } else if (internalAssistantType === "rl") {
          return <AssistantTips type="rl" />;
        } else if (internalAssistantType === "draft") {
          // PS助理的提示现在由PSAssistant组件内部处理，这里不再显示
          return null;
        }
        return null;
      })()}

      {/* 根据当前助理类型显示不同的输入区域 */}
      {internalAssistantType === "cv" ? (
        /* CV助理界面 */
        <div className="w-full">
          <CVAssistantMain
            onStepChange={onStepChange || (() => {})}
            setResult={setResult}
          />
        </div>
      ) : internalAssistantType === "rl" ? (
        /* RL助理界面 */
        <div className="w-full">
          <RLAssistantMain onStepChange={onStepChange} setResult={setResult} />
        </div>
      ) : internalAssistantType === "draft" ? (
        /* PS助理界面 - 使用新的PSAssistant组件 */
        <div className="w-full">
          <PSAssistantMain
            onStepChange={onStepChange}
            setResult={setResult}
            result={result}
            finalDraft={finalDraft}
            setFinalDraft={setFinalDraft}
            isGeneratingFinalDraft={isGeneratingFinalDraft}
            handleFinalDraftSubmit={handleFinalDraftSubmit}
            handleStreamResponse={handleStreamResponse}
            isLoading={isLoading}
            onUserInputChange={onUserInputChange}
          />
        </div>
      ) : inputMode === "simple" ? (
        /* 简单输入区域 - 现在也用于custom类型 */
        <InputArea
          query={simpleQuery}
          setQuery={setSimpleQuery}
          isLoading={isLoading}
          isInputExpanded={isInputExpanded}
          setIsInputExpanded={setIsInputExpanded}
          handleSubmit={handleSimpleSubmit}
          handleExampleClick={handleExampleClick}
          files={simpleFiles}
          setFiles={setSimpleFiles}
          placeholder={placeholder} // 传递提示文本
        />
      ) : null}

      {/* 结果区域 - 如果有结果且不是CV助理或RL助理模式 */}
      <div ref={resultRef}>
        {/* 不在CV助理、RL助理或PS助理模式时才显示结果区域 */}
        {internalAssistantType !== "cv" &&
          internalAssistantType !== "rl" &&
          internalAssistantType !== "draft" &&
          result &&
          !shouldHideResult && (
            <ResultSection
              result={result}
              expandedSteps={expandedSteps}
              setExpandedSteps={setExpandedSteps}
              handleStepClick={handleStepClick}
            />
          )}
      </div>
    </div>
  );
}

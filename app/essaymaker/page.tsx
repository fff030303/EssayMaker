// 主页面组件，整合所有功能：

// - 使用useEssayMaker钩子管理状态和逻辑
// - 根据查询类型决定是否显示多步骤流程
// - 实现步骤之间的滑动切换效果
// - 条件渲染不同步骤的内容
// - 管理整个应用的状态和流程

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";
import { scrollbarStyles } from "./utils/styles";
import { FirstStep } from "./components/FirstStep";
import { SecondStep } from "./components/SecondStep";
import { ThirdStep } from "./components/ThirdStep";
import { StepNavigation } from "./components/StepNavigation";
import { PSReportAndDraftDisplay } from "./components/psassistant/PSReportAndDraftDisplay";
import { CVAssistantMain } from "./components/cvassistant/CVAssistantMain";
import { CVReportAndResumeDisplay } from "./components/cvassistant/CVReportAndResumeDisplay";
import { RLAssistantMain } from "./components/rlassistant/RLAssistantMain";
import { useEssayMaker } from "./hooks/useEssayMaker";
import { AgentType, DisplayResult } from "./types";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ButtonType } from "./components/QuickActionButtons";
import { Card, CardHeader } from "@/components/ui/card";
import { DraftResultDisplay } from "./components/DraftResultDisplay/DraftResultComponent";
import { RLGeneration } from "./components/rlassistant/RLGeneration";
// 移除侧边栏导入
// import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/use-toast";
import { FullScreenLoadingAnimation } from "./components/LoadingAnimation";

// 导入全局流式生成相关组件
import { StreamingProvider } from "./contexts/StreamingContext";

// 导入分稿助理组件
import { SectionalAssistantMain } from "./components/sectionalassistant/SectionalAssistantMain";
import { SectionalStrategyAndDraftDisplay } from "./components/sectionalassistant/SectionalStrategyAndDraftDisplay";
import { ResultSection } from "./components/ResultSection";

// 导入API服务
import { apiService } from "@/lib/api";

export default function EssayMakerPage() {
  // 移除侧边栏状态
  // const { state: sidebarState } = useSidebar();
  const {
    // 状态
    query,
    setQuery,
    firstStepLoading,
    secondStepLoading,
    thirdStepLoading,
    result,
    setResult,
    showExamples,
    setShowExamples,
    isInputExpanded,
    setIsInputExpanded,
    expandedSteps,
    setExpandedSteps,
    currentStep,
    secondStepInput,
    secondStepResult,
    finalResult,
    files,
    setFiles,
    finalDraft,
    isGeneratingFinalDraft,
    setFinalDraft,
    currentAssistantType,
    setCurrentAssistantType,

    // refs
    firstStepRef,
    secondStepRef,
    thirdStepRef,
    containerRef,

    // 函数
    handleExampleClick,
    handleSubmit,
    handleStepChange,
    handleSecondStepSubmit,
    handleStepClick,
    handleSecondStepInputChange,
    handleFinalGeneration,
    // 添加新的函数
    handleFinalDraftSubmit,
    handleStreamResponse,
  } = useEssayMaker(null); // 传入null代替session

  const [detectedAgentType, setDetectedAgentType] = useState<AgentType>(
    AgentType.UNKNOWN
  );

  // 判断是否应该显示多步骤流程
  const shouldShowMultiStepFlow = detectedAgentType === AgentType.COURSE_INFO;

  // 添加判断是否为教授搜索类型
  const isProfessorSearch = detectedAgentType === AgentType.PROFESSOR_SEARCH;

  // 添加判断是否为PS初稿助理
  const [isPSAssistant, setIsPSAssistant] = useState<boolean>(false);

  // 添加判断是否为CV助理
  const [isCVAssistant, setIsCVAssistant] = useState<boolean>(false);

  // 添加判断是否为RL助理
  const [isRLAssistant, setIsRLAssistant] = useState<boolean>(false);

  // 添加判断是否为分稿助理
  const [isDraftAssistant, setIsDraftAssistant] = useState<boolean>(false);

  // 新增：添加判断是否为分稿助理
  const [isSectionalAssistant, setIsSectionalAssistant] = useState<boolean>(false);

  // 添加控制步骤导航显示状态，默认显示
  const [showStepNavigation, setShowStepNavigation] = useState<boolean>(true);

  // 添加finalDraftResult状态用于初稿生成
  const [finalDraftResult, setFinalDraftResult] = useState<any>(null);

  // 添加申请方向和要求状态，从FirstStep组件中获取
  const [userDirection, setUserDirection] = useState<string>("");
  const [userRequirements, setUserRequirements] = useState<string>("");

  // 添加成绩单解析结果状态
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<string | null>(
    null
  );

  // 添加otherFiles状态，用于存储辅助资料文件
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // 添加控制是否已提交PS初稿的状态，默认为true以便和CV助理保持一致
  const [hasSubmittedDraft, setHasSubmittedDraft] = useState<boolean>(true);

  // 添加formattedResume状态
  const [formattedResume, setFormattedResume] = useState<DisplayResult | null>(
    null
  );

  // 添加formattedLetter状态
  const [formattedLetter, setFormattedLetter] = useState<DisplayResult | null>(
    null
  );

  // 🆕 添加RL助理写作需求状态
  const [rlWritingRequirements, setRlWritingRequirements] = useState<string>("");

  // 🆕 新增：分稿助理改写策略结果状态
  const [sectionalStrategyResult, setSectionalStrategyResult] = useState<DisplayResult | null>(null);

  // 🆕 新增：分稿助理改写策略生成状态
  const [isSectionalStrategyGenerating, setIsSectionalStrategyGenerating] = useState(false);

  // 🆕 新增：分稿助理最终稿件状态
  const [sectionalFinalDraft, setSectionalFinalDraft] = useState<DisplayResult | null>(null);

  // 🆕 新增：分稿助理最终稿件生成状态
  const [isSectionalFinalGenerating, setIsSectionalFinalGenerating] = useState(false);

  // 🆕 新增：分稿助理原始文件和改写策略数据
  const [sectionalOriginalFile, setSectionalOriginalFile] = useState<File | null>(null);
  const [sectionalStrategyContent, setSectionalStrategyContent] = useState<string>("");

  // 🆕 新增：清空时间戳，用于触发子组件清空
  const [sectionalClearTimestamp, setSectionalClearTimestamp] = useState<number>(0);

  // 🆕 添加监听器来调试时间戳变化
  useEffect(() => {
    if (sectionalClearTimestamp > 0) {
      console.log("[PAGE] 🚀 sectionalClearTimestamp 状态已更新:", sectionalClearTimestamp);
      console.log("[PAGE] 🔍 当前第二步渲染状态:", {
        isSectionalAssistant,
        currentStep,
        sectionalStrategyResult: !!sectionalStrategyResult,
        sectionalFinalDraft: !!sectionalFinalDraft,
      });
    }
  }, [sectionalClearTimestamp, isSectionalAssistant, currentStep, sectionalStrategyResult, sectionalFinalDraft]);

  // 添加CV和RL助理的生成状态
  const [isCVGenerating, setIsCVGenerating] = useState<boolean>(false);
  const [isRLGenerating, setIsRLGenerating] = useState<boolean>(false);

  // 新增：添加分稿助理的生成状态
  const [isSectionalGenerating, setIsSectionalGenerating] = useState<boolean>(false);

  // 监控文件状态变化
  useEffect(() => {
    console.log("[PAGE] 📁 文件数量:", files.length);
  }, [files]);

  // 监控助理状态变化
  useEffect(() => {
    console.log("[PAGE] 🤖 助理状态变化:", {
      isPSAssistant,
      isCVAssistant,
      isRLAssistant,
      isDraftAssistant,
      isSectionalAssistant,
      currentStep,
      isGeneratingFinalDraft,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [
    isPSAssistant,
    isCVAssistant,
    isRLAssistant,
    isDraftAssistant,
    isSectionalAssistant,
    currentStep,
    isGeneratingFinalDraft,
  ]);

  // 添加清除步骤内容的函数
  const clearSteps = useCallback(() => {
    setResult(null);
    setDetectedAgentType(AgentType.UNKNOWN);

    // 如果需要切换回第一步，可以使用handleStepChange函数
    handleStepChange(1);
  }, [setResult, setDetectedAgentType, handleStepChange]);

  // 修改handleButtonChange函数
  const handleButtonChange = useCallback(
    (type: ButtonType) => {
      // 如果正在生成初稿，不允许切换助理状态
      if (isGeneratingFinalDraft && isPSAssistant) {
        console.log("[PAGE] 🚫 正在生成初稿，拒绝状态切换");
        toast({
          title: "提示",
          description: "正在生成初稿，请稍后再切换",
          variant: "default",
        });
        return;
      }

      console.log("[PAGE] 按钮状态切换:", type);

      // 通用状态清理函数
      const clearAllStates = () => {
        setQuery("");
        setResult(null);
        setFinalDraft(null);
        setFinalDraftResult(null);
        setUserDirection("");
        setUserRequirements("");
        setTranscriptAnalysis(null);
        setOtherFiles([]);
        setFormattedResume(null);
        setFormattedLetter(null);
        // 🆕 清理RL助理写作需求状态
        setRlWritingRequirements("");
        // 🆕 清理分稿助理改写策略状态
        setSectionalStrategyResult(null);
        setIsSectionalStrategyGenerating(false);
        // 🆕 清理分稿助理最终稿件状态
        setSectionalFinalDraft(null);
        setIsSectionalFinalGenerating(false);
        setSectionalOriginalFile(null);
        setSectionalStrategyContent("");
      };

      if (type === "draft") {
        clearAllStates();
        setIsPSAssistant(true);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setIsSectionalAssistant(false);
        setShowStepNavigation(true);
        setHasSubmittedDraft(true);
        handleStepChange(1);
        console.log("[PAGE] 切换到PS助理模式，已清理所有相关状态");
      } else if (type === "cv") {
        clearAllStates();
        setIsCVAssistant(true);
        setIsPSAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setIsSectionalAssistant(false);
        setShowStepNavigation(true);
        setHasSubmittedDraft(true);
        handleStepChange(1);
        console.log("[PAGE] 切换到CV助理模式，已清理所有相关状态");
      } else if (type === "rl") {
        clearAllStates();
        setIsRLAssistant(true);
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsDraftAssistant(false);
        setIsSectionalAssistant(false);
        setShowStepNavigation(true);
        setHasSubmittedDraft(true);
        handleStepChange(1);
        console.log("[PAGE] 切换到RL助理模式，已清理所有相关状态");
      } else if (type === "custom") {
        clearAllStates();
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setIsSectionalAssistant(true);
        setShowStepNavigation(true);
        setHasSubmittedDraft(true);
        handleStepChange(1);
        console.log("[PAGE] 切换到分稿助理模式，已清理所有相关状态");
      } else {
        clearAllStates();
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setIsSectionalAssistant(false);
        setShowStepNavigation(false);
        setHasSubmittedDraft(false);
        handleStepChange(1);
        console.log("[PAGE] 切换到其他模式，已清理所有相关状态");
      }
    },
    [
      isGeneratingFinalDraft,
      isPSAssistant,
      toast,
      setQuery,
      setResult,
      setFinalDraft,
      setFinalDraftResult,
      setUserDirection,
      setUserRequirements,
      setTranscriptAnalysis,
      setOtherFiles,
      setFormattedResume,
      setFormattedLetter,
      setIsPSAssistant,
      setIsCVAssistant,
      setIsRLAssistant,
      setIsDraftAssistant,
      setIsSectionalAssistant,
      setShowStepNavigation,
      setHasSubmittedDraft,
      handleStepChange,
    ]
  );

  // 创建一个函数，用于PS初稿助理提交文件后显示导航栏
  const handleDraftFileSubmitted = useCallback(() => {
    if (isPSAssistant) {
      console.log(
        "[PAGE] 执行handleDraftFileSubmitted，处理文件提交后的切换步骤"
      );
      // 由于已经默认设置了hasSubmittedDraft为true，这里不需要再设置
      // 但仍然需要确保它为true，以防万一
      setHasSubmittedDraft(true);
      console.log("[PAGE] 确保已提交文件状态为true");

      // 自动切换到步骤2
      handleStepChange(2);
      console.log("[PAGE] 已切换到步骤2");
    }
  }, [isPSAssistant, handleStepChange, setHasSubmittedDraft]);

  // 创建高级提交处理函数，在原本的onSubmitClick基础上添加导航栏显示逻辑
  const handleAdvancedSubmit = useCallback(() => {
    console.log("[PAGE] 执行handleAdvancedSubmit，处理提交");
    handleSubmit();
    // 如果是PS初稿助理，提交后设置已提交状态并切换到步骤2
    if (isPSAssistant) {
      // 设置已提交文件状态为true (这是冗余的，因为已经默认为true，但为安全起见保留)
      setHasSubmittedDraft(true);
      console.log("[PAGE] 确认已提交文件状态为true");

      // 使用setTimeout确保步骤切换在提交完成后执行
      setTimeout(() => {
        handleDraftFileSubmitted();
      }, 500);
    }
  }, [
    handleSubmit,
    isPSAssistant,
    handleDraftFileSubmitted,
    setHasSubmittedDraft,
  ]);

  // 添加用于接收用户输入信息的回调函数
  const handleUserInputChange = useCallback(
    (direction: string, requirements: string, transcript: string | null) => {
      setUserDirection(direction);
      setUserRequirements(requirements);

      // 保存成绩单解析结果
      if (transcript) {
        setTranscriptAnalysis(transcript);
        console.log(
          "[PAGE] 成绩单解析结果更新(从用户输入):",
          transcript.substring(0, 100) + "..."
        );
      }

      console.log(
        "[PAGE] 用户输入更新 - 方向:",
        direction,
        "要求:",
        requirements
      );
    },
    []
  );

  // 监听result变化，提取transcriptAnalysis
  useEffect(() => {
    if (result && "transcriptAnalysis" in result) {
      // 使用类型断言告诉TypeScript transcriptAnalysis确实存在
      const resultWithTranscript = result as DisplayResult & {
        transcriptAnalysis: string;
      };
      console.log(
        "[PAGE] 从result中检测到transcriptAnalysis，长度:",
        resultWithTranscript.transcriptAnalysis.length
      );
      setTranscriptAnalysis(resultWithTranscript.transcriptAnalysis);
    }
  }, [result]);

  // 添加用于接收辅助资料文件的回调函数
  const handleOtherFilesChange = useCallback((files: File[]) => {
    setOtherFiles(files);
    console.log("[PAGE] 辅助资料文件更新 - 文件数量:", files.length);
  }, []);

  // 处理点击CV助理按钮
  const handleCvClick = useCallback(() => {
    // 清除查询和结果
    setQuery("");
    setResult(null);

    // 清除PS助理相关状态
    setFinalDraft(null);
    setFinalDraftResult(null);
    setUserDirection("");
    setUserRequirements("");
    setTranscriptAnalysis(null);
    setOtherFiles([]);

    // 清除CV助理相关状态
    setFormattedResume(null);

    // 清除RL助理相关状态
    setFormattedLetter(null);

    setIsCVAssistant(true);
    setIsPSAssistant(false);
    setIsRLAssistant(false);
    setIsDraftAssistant(false);
    setIsSectionalAssistant(false);

    // 显示导航栏
    setShowStepNavigation(true);

    // 重置步骤到第一步
    handleStepChange(1);

    console.log("[PAGE] 切换到CV助理模式，已清理所有相关状态");
  }, [
    setQuery,
    setResult,
    setFinalDraft,
    setFinalDraftResult,
    setUserDirection,
    setUserRequirements,
    setTranscriptAnalysis,
    setOtherFiles,
    setFormattedResume,
    setFormattedLetter,
    setIsCVAssistant,
    setIsPSAssistant,
    setIsRLAssistant,
    setIsDraftAssistant,
    setIsSectionalAssistant,
    setShowStepNavigation,
    handleStepChange,
  ]);

  // 处理点击RL助理按钮
  const handleRlClick = useCallback(() => {
    // 清除查询和结果
    setQuery("");
    setResult(null);

    // 清除PS助理相关状态
    setFinalDraft(null);
    setFinalDraftResult(null);
    setUserDirection("");
    setUserRequirements("");
    setTranscriptAnalysis(null);
    setOtherFiles([]);

    // 清除CV助理相关状态
    setFormattedResume(null);

    // 清除RL助理相关状态
    setFormattedLetter(null); // 清除之前生成的推荐信

    setIsRLAssistant(true);
    setIsCVAssistant(false);
    setIsPSAssistant(false);
    setIsDraftAssistant(false);
    setIsSectionalAssistant(false);

    // 显示导航栏
    setShowStepNavigation(true);

    // 重置步骤到第一步
    handleStepChange(1);

    console.log("[PAGE] 切换到RL助理模式，已清理所有相关状态");
  }, [
    setQuery,
    setResult,
    setFinalDraft,
    setFinalDraftResult,
    setUserDirection,
    setUserRequirements,
    setTranscriptAnalysis,
    setOtherFiles,
    setFormattedResume,
    setFormattedLetter,
    setIsRLAssistant,
    setIsCVAssistant,
    setIsPSAssistant,
    setIsDraftAssistant,
    setIsSectionalAssistant,
    setShowStepNavigation,
    handleStepChange,
  ]);

  // 清除查询和结果
  const clearQuery = useCallback(() => {
    setQuery("");
    setResult(null);
    setFinalDraft(null);
    setFinalDraftResult(null);
    setUserDirection("");
    setUserRequirements("");
    setTranscriptAnalysis(null);
    setOtherFiles([]);
    setFormattedResume(null);
    setFormattedLetter(null);
    setRlWritingRequirements("");
    setSectionalStrategyResult(null);
    setIsSectionalStrategyGenerating(false);
  }, [
    setQuery,
    setResult,
    setFinalDraft,
    setFinalDraftResult,
    setUserDirection,
    setUserRequirements,
    setTranscriptAnalysis,
    setOtherFiles,
    setFormattedResume,
    setFormattedLetter,
    setRlWritingRequirements,
    setSectionalStrategyResult,
    setIsSectionalStrategyGenerating,
  ]);

  // 🆕 专门用于清空分稿助理所有内容的函数
  const clearSectionalAssistantAll = useCallback(() => {
    console.log("[PAGE] 🧹 开始清空分稿助理所有内容");
    
    // 清空第一步的结果
    setResult(null);
    console.log("[PAGE] ✅ 已清空第一步结果");
    
    // 清空第二步的改写策略结果
    setSectionalStrategyResult(null);
    setIsSectionalStrategyGenerating(false);
    console.log("[PAGE] ✅ 已清空第二步改写策略");
    
    // 清空第三步的最终文稿
    setSectionalFinalDraft(null);
    setIsSectionalFinalGenerating(false);
    console.log("[PAGE] ✅ 已清空第三步最终稿件");
    
    // 清空数据文件
    setSectionalOriginalFile(null);
    setSectionalStrategyContent("");
    console.log("[PAGE] ✅ 已清空数据文件");
    
    // 🆕 更新清空时间戳，触发子组件清空
    const newTimestamp = Date.now();
    setSectionalClearTimestamp(newTimestamp);
    console.log("[PAGE] 🚀 已更新清空时间戳:", newTimestamp);
    
    console.log("[PAGE] ✅ 分稿助理所有内容已清空完成");
  }, [
    setResult,
    setSectionalStrategyResult,
    setIsSectionalStrategyGenerating,
    setSectionalFinalDraft,
    setIsSectionalFinalGenerating,
    setSectionalOriginalFile,
    setSectionalStrategyContent,
  ]);

  return (
    <StreamingProvider>
      <div
        className={cn(
          "min-h-screen flex flex-col",
          shouldShowMultiStepFlow || isProfessorSearch || showStepNavigation
            ? "pb-16"
            : "pb-4"
        )}
      >
        <style jsx global>
          {scrollbarStyles}
        </style>

        {/* 添加Toaster组件以显示通知 */}
        <Toaster />


        {/* 导航栏 - 仅在第一步显示 - 已移除 */}

        {/* 内容区域 */}
        <div
          className={cn(
            "flex-1 px-4 pb-6 md:px-8 md:pb-6",
            shouldShowMultiStepFlow || isProfessorSearch || showStepNavigation
              ? "pb-12"
              : "pb-8",
            "transition-all duration-300 mx-auto max-w-7xl w-full"
          )}
        >
          {/* 恢复滑动动画，同时保持条件渲染 */}
          <div ref={containerRef} className="relative w-full overflow-hidden">
            <div
              className="flex items-start gap-16 transition-transform duration-500"
              style={{
                transform: `translateX(${
                  currentStep === 1
                    ? "0"
                    : currentStep === 2
                    ? "calc(-100% - 4rem)"
                    : "calc(-200% - 8rem)"
                })`,
              }}
            >
              {/* 第一步界面 - 始终渲染 */}
              <div ref={firstStepRef} className="min-w-full">
                <FirstStep
                  query={query}
                  setQuery={setQuery}
                  isLoading={firstStepLoading}
                  result={result}
                  setResult={setResult}
                  showExamples={showExamples}
                  setShowExamples={setShowExamples}
                  isInputExpanded={isInputExpanded}
                  setIsInputExpanded={setIsInputExpanded}
                  expandedSteps={expandedSteps}
                  setExpandedSteps={setExpandedSteps}
                  handleSubmit={
                    isPSAssistant ? handleAdvancedSubmit : handleSubmit
                  }
                  handleStepClick={handleStepClick}
                  handleExampleClick={handleExampleClick}
                  setDetectedAgentType={setDetectedAgentType}
                  onStepChange={handleStepChange}
                  isProfessorSearch={isProfessorSearch}
                  files={files}
                  setFiles={setFiles}
                  finalDraft={finalDraft}
                  isGeneratingFinalDraft={isGeneratingFinalDraft}
                  handleFinalDraftSubmit={handleFinalDraftSubmit}
                  setFinalDraft={setFinalDraft}
                  onButtonChange={handleButtonChange}
                  setIsPSAssistant={setIsPSAssistant}
                  setIsCVAssistant={setIsCVAssistant}
                  setIsRLAssistant={setIsRLAssistant}
                  setIsSectionalAssistant={setIsSectionalAssistant}
                  setShowStepNavigation={setShowStepNavigation}
                  onUserInputChange={handleUserInputChange}
                  onOtherFilesChange={handleOtherFilesChange}
                  handleStreamResponse={handleStreamResponse}
                  isPSAssistant={isPSAssistant}
                  isCVAssistant={isCVAssistant}
                  isRLAssistant={isRLAssistant}
                  onCvClick={handleCvClick}
                  onRlClick={handleRlClick}
                  setCurrentAssistantType={setCurrentAssistantType}
                  currentAssistantType={
                    isPSAssistant
                      ? "draft"
                      : isCVAssistant
                      ? "cv"
                      : isRLAssistant
                      ? "rl"
                      : isSectionalAssistant
                      ? "sectional"
                      : "custom"
                  }
                  onStrategyGenerate={setSectionalStrategyResult}
                  onStrategyGeneratingChange={setIsSectionalStrategyGenerating}
                  onDataSave={(originalFile, strategyContent) => {
                    setSectionalOriginalFile(originalFile);
                    setSectionalStrategyContent(strategyContent);
                  }}
                  onClearAll={clearSectionalAssistantAll}
                />
              </div>

              {/* 第二步界面 - 条件渲染内容 */}
              <div
                ref={secondStepRef}
                className="min-w-full h-auto overflow-hidden"
              >
                {(() => {
                  console.log("[PAGE] 🔍 第二步渲染状态检查:", {
                    shouldShowMultiStepFlow,
                    isProfessorSearch,
                    isPSAssistant,
                    isCVAssistant,
                    isRLAssistant,
                    isDraftAssistant,
                    isSectionalAssistant,
                    currentStep,
                    isGeneratingFinalDraft,
                    hasResult: !!result,
                    hasSubmittedDraft,
                    showStepNavigation,
                    timestamp: new Date().toISOString(),
                  });

                  console.log("[PAGE] 第二步渲染条件检查:", {
                    shouldShowMultiStepFlow,
                    isProfessorSearch,
                    isPSAssistant,
                    isCVAssistant,
                    isRLAssistant,
                    isDraftAssistant,
                    isSectionalAssistant,
                    detectedAgentType,
                    "AgentType.COURSE_INFO": AgentType.COURSE_INFO,
                    "AgentType.PROFESSOR_SEARCH": AgentType.PROFESSOR_SEARCH,
                  });

                  console.log("[PAGE] 🔍 详细条件分析:", {
                    shouldShowMultiStepFlow: shouldShowMultiStepFlow,
                    isProfessorSearch: isProfessorSearch,
                    isPSAssistant: isPSAssistant,
                    isCVAssistant: isCVAssistant,
                    isRLAssistant: isRLAssistant,
                    isDraftAssistant: isDraftAssistant,
                    isSectionalAssistant: isSectionalAssistant,
                    detectedAgentType: detectedAgentType,
                    "AgentType.COURSE_INFO": AgentType.COURSE_INFO,
                    "AgentType.PROFESSOR_SEARCH": AgentType.PROFESSOR_SEARCH,
                  });

                  if (shouldShowMultiStepFlow) {
                    console.log("[PAGE] ✅ 渲染 SecondStep - 多步骤流程");
                    return (
                      <SecondStep
                        secondStepInput={secondStepInput}
                        setSecondStepInput={(input) => {}}
                        secondStepLoading={secondStepLoading}
                        secondStepResult={secondStepResult}
                        thirdStepLoading={thirdStepLoading}
                        handleSecondStepSubmit={handleSecondStepSubmit}
                        handleFinalGeneration={handleFinalGeneration}
                        handleSecondStepInputChange={handleSecondStepInputChange}
                        onStepChange={handleStepChange}
                      />
                    );
                  } else if (isProfessorSearch) {
                    console.log("[PAGE] ✅ 渲染教授信息查询");
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 max-w-md">
                          <h2 className="text-2xl font-bold mb-4">
                            教授信息查询
                          </h2>
                          <p className="text-muted-foreground mb-6">
                            您可以查询更多关于教授的详细信息。
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              variant="outline"
                              onClick={() => handleStepChange(1)}
                            >
                              <ArrowLeft className="h-4 w-4 mr-2" />
                              返回查询结果
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (isPSAssistant) {
                    console.log(
                      "[PAGE] ✅ 渲染 PSReportAndDraftDisplay (PS助理)"
                    );
                    console.log("[PAGE] 🔍 PSReportAndDraftDisplay Props检查:", {
                      result: result,
                      hasResult: !!result,
                      resultContent: result?.content ? "有内容" : "无内容",
                      finalDraft: finalDraft,
                      hasFinalDraft: !!finalDraft,
                      userDirection: userDirection,
                      userRequirements: userRequirements,
                      onGenerateFinalDraft: !!handleFinalDraftSubmit,
                      isGeneratingFinalDraft: isGeneratingFinalDraft,
                    });
                    return (
                      <PSReportAndDraftDisplay
                        result={result}
                        finalDraft={finalDraft}
                        finalDraftResult={finalDraftResult}
                        onStepChange={handleStepChange}
                        onGenerateFinalDraft={
                          handleFinalDraftSubmit
                            ? () =>
                                handleFinalDraftSubmit(
                                  "生成个人陈述初稿",
                                  [], // 不再传递文件
                                  result?.content || "",
                                  userDirection,
                                  userRequirements,
                                  transcriptAnalysis
                                )
                            : undefined
                        }
                        isGeneratingFinalDraft={isGeneratingFinalDraft}
                        userDirection={userDirection}
                        userRequirements={userRequirements}
                        otherFiles={otherFiles}
                        transcriptAnalysis={transcriptAnalysis}
                        setShowStepNavigation={setShowStepNavigation}
                        setHasSubmittedDraft={setHasSubmittedDraft}
                      />
                    );
                  } else if (isCVAssistant) {
                    console.log("[PAGE] ✅ 渲染 CV助理");
                    return (
                      <>
                        {currentStep === 1 && (
                          <CVAssistantMain
                            onStepChange={handleStepChange}
                            setResult={setResult}
                          />
                        )}
                        {currentStep === 2 && (
                          <CVReportAndResumeDisplay
                            result={result}
                            onStepChange={handleStepChange}
                            formattedResume={formattedResume}
                            onFormattedResumeChange={setFormattedResume}
                            onGeneratingStateChange={setIsCVGenerating}
                          />
                        )}
                      </>
                    );
                  } else if (isRLAssistant) {
                    console.log("[PAGE] ✅ 渲染 RL助理");
                    return (
                      <>
                        {currentStep === 1 && (
                          <RLAssistantMain
                            onStepChange={handleStepChange}
                            setResult={setResult}
                            isRLGenerating={isRLGenerating}
                            onWritingRequirementsChange={setRlWritingRequirements}
                          />
                        )}
                        {currentStep === 2 && (
                          <RLGeneration
                            result={result}
                            onStepChange={handleStepChange}
                            formattedLetter={formattedLetter}
                            onFormattedLetterChange={setFormattedLetter}
                            onGeneratingStateChange={setIsRLGenerating}
                            writingRequirements={rlWritingRequirements}
                          />
                        )}
                      </>
                    );
                  } else if (isSectionalAssistant) {
                    console.log("[PAGE] ✅ 渲染 分稿助理");
                    
                    return (
                      <SectionalStrategyAndDraftDisplay
                        strategyResult={sectionalStrategyResult}
                        finalDraft={sectionalFinalDraft}
                        onStepChange={handleStepChange}
                        onFinalDraftChange={setSectionalFinalDraft}
                        onGeneratingStateChange={setIsSectionalFinalGenerating}
                        originalFile={sectionalOriginalFile}
                        strategyContent={sectionalStrategyContent}
                        onClearAll={clearSectionalAssistantAll}
                        clearTimestamp={sectionalClearTimestamp}
                      />
                    );
                  } else {
                    console.log(
                      "[PAGE] ❌ 进入默认分支 - 显示'此查询不需要后续步骤'"
                    );
                    console.log("[PAGE] ❌ 所有条件检查结果:", {
                      shouldShowMultiStepFlow: "false",
                      isProfessorSearch: "false",
                      isPSAssistant: "false",
                      isCVAssistant: "false",
                      isRLAssistant: "false",
                      这意味着: "所有助理状态都被重置了",
                    });
                    return (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 max-w-md">
                          <h2 className="text-2xl font-bold mb-4">
                            此查询不需要后续步骤
                          </h2>
                          <p className="text-muted-foreground mb-6">
                            当前查询类型不需要多步骤处理。请返回第一步查看结果。
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => handleStepChange(1)}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回第一步
                          </Button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* 第三步界面 - 条件渲染内容 */}
              <div ref={thirdStepRef} className="min-w-full">
                {shouldShowMultiStepFlow ? (
                  <ThirdStep
                    finalResult={finalResult}
                    onStepChange={handleStepChange}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8 max-w-md">
                      <h2 className="text-2xl font-bold mb-4">
                        此查询不需要后续步骤
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        当前查询类型不需要多步骤处理。请返回第一步查看结果。
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => handleStepChange(1)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        返回第一步
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 共享导航组件 */}
        <StepNavigation
          currentStep={currentStep}
          onStepChange={handleStepChange}
          shouldShowMultiStepFlow={shouldShowMultiStepFlow}
          hasSecondStepResult={!!secondStepResult}
          hasFinalResult={!!finalResult && finalResult.isComplete}
          isThirdStepLoading={thirdStepLoading}
          agentType={detectedAgentType}
          isProfessorSearch={isProfessorSearch}
          isPSAssistant={isPSAssistant}
          isCVAssistant={isCVAssistant}
          isRLAssistant={isRLAssistant}
          isDraftAssistant={isDraftAssistant}
          isSectionalAssistant={isSectionalAssistant}
          hasSubmittedDraft={hasSubmittedDraft}
        />

        {/* 全屏加载动画 - 在生成过程中显示 */}
        {/* PS助理第一步：生成素材整理报告 */}
        {firstStepLoading && isPSAssistant && (
          <FullScreenLoadingAnimation 
            text="正在分析个人陈述素材，请勿切换页面..." 
          />
        )}

        {/* PS助理第二步：生成个人陈述初稿（只在非第二步界面显示） */}
        {isGeneratingFinalDraft && isPSAssistant && currentStep !== 2 && (
          <FullScreenLoadingAnimation 
            text="正在生成个人陈述初稿，可通过底边栏切换到第二步查看进度..." 
          />
        )}

        {/* CV助理：生成简历时，只在非第二步界面显示全屏动画 */}
        {isCVGenerating && isCVAssistant && currentStep !== 2 && (
          <FullScreenLoadingAnimation 
            text="正在生成简历，可通过底边栏切换到第二步查看进度..." 
          />
        )}

        {/* RL助理：生成推荐信时，只在非第二步界面显示全屏动画 */}
        {isRLGenerating && isRLAssistant && currentStep !== 2 && (
          <FullScreenLoadingAnimation 
            text="正在生成推荐信，可通过底边栏切换到第二步查看进度..." 
          />
        )}

        {/* 分稿助理全屏加载动画 */}
        {isSectionalGenerating && isSectionalAssistant && (
          <FullScreenLoadingAnimation 
            text="正在生成分稿策略，请勿切换页面..." 
          />
        )}

        {/* 🆕 分稿助理改写策略生成全屏加载动画 */}
        {isSectionalStrategyGenerating && isSectionalAssistant && currentStep !== 2 && (
          <FullScreenLoadingAnimation 
            text="正在生成Essay改写策略，可通过底边栏切换到第二步查看进度..." 
          />
        )}

        {/* 🆕 分稿助理最终稿件生成全屏加载动画 */}
        {isSectionalFinalGenerating && isSectionalAssistant && currentStep !== 2 && (
          <FullScreenLoadingAnimation 
            text="正在生成最终Essay稿件，可通过底边栏切换到第二步查看进度..." 
          />
        )}
      </div>
    </StreamingProvider>
  );
}

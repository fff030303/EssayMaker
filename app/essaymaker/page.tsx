// 主页面组件，整合所有功能：

// - 使用useEssayMaker钩子管理状态和逻辑
// - 根据查询类型决定是否显示多步骤流程
// - 实现步骤之间的滑动切换效果
// - 条件渲染不同步骤的内容
// - 管理整个应用的状态和流程

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { scrollbarStyles } from "./utils/styles";
import { FirstStep } from "./components/FirstStep";
import { SecondStep } from "./components/SecondStep";
import { ThirdStep } from "./components/ThirdStep";
import { StepNavigation } from "./components/StepNavigation";
import { DraftGeneration } from "./components/DraftGeneration";
import { useEssayMaker } from "./hooks/useEssayMaker";
import { AgentType } from "./types";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ButtonType } from "./components/QuickActionButtons";
// 移除侧边栏导入
// import { useSidebar } from "@/components/ui/sidebar";

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
  
  // 添加控制步骤导航显示状态
  const [showStepNavigation, setShowStepNavigation] = useState<boolean>(false);
  
  // 添加finalDraftResult状态用于初稿生成
  const [finalDraftResult, setFinalDraftResult] = useState<any>(null);
  
  // 添加申请方向和要求状态，从FirstStep组件中获取
  const [userDirection, setUserDirection] = useState<string>("");
  const [userRequirements, setUserRequirements] = useState<string>("");
  
  // 添加成绩单解析结果状态
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<string | null>(null);
  
  // 添加otherFiles状态，用于存储辅助资料文件
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // 监控文件状态
  useEffect(() => {
    console.log("EssayMakerPage - files状态更新 - 文件数量:", files?.length || 0);
  }, [files]);

  // 添加清除步骤内容的函数
  const clearSteps = useCallback(() => {
    setResult(null);
    setDetectedAgentType(AgentType.UNKNOWN);
    
    // 如果需要切换回第一步，可以使用handleStepChange函数
    handleStepChange(1);
  }, [setResult, setDetectedAgentType, handleStepChange]);

  // 修改handleButtonChange函数
  const handleButtonChange = useCallback((type: ButtonType) => {
    clearSteps();
    
    // 当用户点击PS初稿助理按钮时，设置isPSAssistant为true
    if (type === "draft") {
      setIsPSAssistant(true);
      setShowStepNavigation(true);
    } else {
      setIsPSAssistant(false);
      setShowStepNavigation(false);
    }
  }, [clearSteps]);

  // 添加用于接收用户输入信息的回调函数
  const handleUserInputChange = useCallback((direction: string, requirements: string, transcript: string | null) => {
    setUserDirection(direction);
    setUserRequirements(requirements);
    
    // 保存成绩单解析结果
    if (transcript) {
      setTranscriptAnalysis(transcript);
      console.log("成绩单解析结果更新:", transcript.substring(0, 100) + "...");
    }
    
    console.log("用户输入更新 - 方向:", direction, "要求:", requirements);
  }, []);
  
  // 添加用于接收辅助资料文件的回调函数
  const handleOtherFilesChange = useCallback((files: File[]) => {
    setOtherFiles(files);
    console.log("辅助资料文件更新 - 文件数量:", files.length);
  }, []);

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col",
        (shouldShowMultiStepFlow || isProfessorSearch || showStepNavigation) ? "pb-16" : "pb-4"
      )}
    >
      <style jsx global>
        {scrollbarStyles}
      </style>
      
      {/* 添加Toaster组件以显示通知 */}
      <Toaster />
      
      {/* 导航栏 - 仅在第一步显示 */}
      {currentStep === 1 && (
        <div className="bg-background">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-bold flex items-center gap-2 mb-2">
              <div className="inline-block w-12 h-12 md:w-20 md:h-20 lg:w-40 lg:h-40 mr-2 flex items-center justify-center">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                >
                  <source src="/videos/Robot Assistant.mp4" type="video/mp4" />
                </video>
              </div>
              智能助理
            </h1>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <div
        className={cn(
          "flex-1 px-4 pt-2 pb-6 md:px-8 md:pt-3 md:pb-6",
          (shouldShowMultiStepFlow || isProfessorSearch || showStepNavigation) ? "pb-24" : "pb-8",
          "transition-all duration-300 mx-auto max-w-7xl w-full"
        )}
      >
        {/* 恢复滑动动画，同时保持条件渲染 */}
        <div ref={containerRef} className="relative w-full overflow-hidden">
          <div
            className="flex gap-16 transition-transform duration-500"
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
                handleSubmit={handleSubmit}
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
                setShowStepNavigation={setShowStepNavigation}
                onUserInputChange={handleUserInputChange}
                onOtherFilesChange={handleOtherFilesChange}
                handleStreamResponse={handleStreamResponse}
              />
            </div>

            {/* 第二步界面 - 条件渲染内容 */}
            <div ref={secondStepRef} className="min-w-full">
              {shouldShowMultiStepFlow ? (
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
              ) : isProfessorSearch ? (
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
              ) : isPSAssistant ? (
                <DraftGeneration
                  result={result}
                  finalDraft={finalDraft}
                  finalDraftResult={finalDraftResult}
                  onStepChange={handleStepChange}
                  onGenerateFinalDraft={handleFinalDraftSubmit ? 
                    () => handleFinalDraftSubmit(
                      "生成最终初稿", 
                      otherFiles || [],
                      result?.content || "", 
                      userDirection || "计算机科学", // 使用用户输入的方向，如果没有则使用默认值
                      userRequirements || "请撰写一篇有关申请人学术背景、专业能力和职业规划的个人陈述" // 使用用户输入的要求，如果没有则使用默认值
                    ) : undefined
                  }
                  isGeneratingFinalDraft={isGeneratingFinalDraft}
                  userDirection={userDirection}
                  userRequirements={userRequirements}
                  otherFiles={otherFiles}
                  transcriptAnalysis={transcriptAnalysis}
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
      {(shouldShowMultiStepFlow || isProfessorSearch || showStepNavigation) && (
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
        />
      )}
    </div>
  );
}

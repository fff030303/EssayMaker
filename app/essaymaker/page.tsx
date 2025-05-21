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
import { CVAssistant } from "./components/CVAssistant";
import { RLAssistant } from "./components/RLAssistant";
import { useEssayMaker } from "./hooks/useEssayMaker";
import { AgentType, DisplayResult } from "./types";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { ButtonType } from "./components/QuickActionButtons";
import { Card, CardHeader } from "@/components/ui/card";
import { DraftResultDisplay } from "./components/DraftResultDisplay";
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

  // 添加判断是否为CV助理
  const [isCVAssistant, setIsCVAssistant] = useState<boolean>(true);
  
  // 添加判断是否为RL助理
  const [isRLAssistant, setIsRLAssistant] = useState<boolean>(false);

  // 添加判断是否为分稿助理
  const [isDraftAssistant, setIsDraftAssistant] = useState<boolean>(false);

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

  // 监控文件状态
  useEffect(() => {
    console.log(
      "EssayMakerPage - files状态更新 - 文件数量:",
      files?.length || 0
    );
  }, [files]);

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
      clearSteps();

      // 当用户点击PS初稿助理按钮时，设置isPSAssistant为true
      if (type === "draft") {
        setIsPSAssistant(true);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        // 修改这里：PS初稿助理也需要立即显示步骤导航，不再等待用户提交文件
        setShowStepNavigation(true);
        // 同时设置hasSubmittedDraft为true，允许用户直接点击底边栏导航到第二步
        setHasSubmittedDraft(true);
      } else if (type === "cv") {
        setIsPSAssistant(false);
        setIsCVAssistant(true);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setShowStepNavigation(true);
        // CV助理模式下不需要提交文件就显示导航
        setHasSubmittedDraft(true);
      } else if (type === "rl") {
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsRLAssistant(true);
        setIsDraftAssistant(false);
        setShowStepNavigation(true);
        // RL助理模式下也默认显示导航
        setHasSubmittedDraft(true);
      } else if (type === "custom") {
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(true);
        setShowStepNavigation(true);
        setHasSubmittedDraft(true);
      } else {
        setIsPSAssistant(false);
        setIsCVAssistant(false);
        setIsRLAssistant(false);
        setIsDraftAssistant(false);
        setShowStepNavigation(false);
        // 其他模式不需要提交文件
        setHasSubmittedDraft(false);
      }
    },
    [clearSteps, setShowStepNavigation, setHasSubmittedDraft]
  );

  // 创建一个函数，用于PS初稿助理提交文件后显示导航栏
  const handleDraftFileSubmitted = useCallback(() => {
    if (isPSAssistant) {
      console.log("执行handleDraftFileSubmitted，处理文件提交后的切换步骤");
      // 由于已经默认设置了hasSubmittedDraft为true，这里不需要再设置
      // 但仍然需要确保它为true，以防万一
      setHasSubmittedDraft(true);
      console.log("确保已提交文件状态为true");

      // 自动切换到步骤2
      handleStepChange(2);
      console.log("已切换到步骤2");
    }
  }, [
    isPSAssistant,
    handleStepChange,
    setHasSubmittedDraft,
  ]);

  // 创建高级提交处理函数，在原本的onSubmitClick基础上添加导航栏显示逻辑
  const handleAdvancedSubmit = useCallback(() => {
    console.log("执行handleAdvancedSubmit，处理提交");
    handleSubmit();
    // 如果是PS初稿助理，提交后设置已提交状态并切换到步骤2
    if (isPSAssistant) {
      // 设置已提交文件状态为true (这是冗余的，因为已经默认为true，但为安全起见保留)
      setHasSubmittedDraft(true);
      console.log("确认已提交文件状态为true");

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
          "成绩单解析结果更新(从用户输入):",
          transcript.substring(0, 100) + "..."
        );
      }

      console.log("用户输入更新 - 方向:", direction, "要求:", requirements);
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
        "从result中检测到transcriptAnalysis，长度:",
        resultWithTranscript.transcriptAnalysis.length
      );
      setTranscriptAnalysis(resultWithTranscript.transcriptAnalysis);
    }
  }, [result]);

  // 添加用于接收辅助资料文件的回调函数
  const handleOtherFilesChange = useCallback((files: File[]) => {
    setOtherFiles(files);
    console.log("辅助资料文件更新 - 文件数量:", files.length);
  }, []);

  // 处理点击CV助理按钮
  const handleCvClick = useCallback(() => {
    // 清除查询和结果
    setQuery("");
    setResult(null);
    
    setIsCVAssistant(true);
    setIsPSAssistant(false);
    setIsRLAssistant(false);
    
    // 显示导航栏
    setShowStepNavigation(true);
    
    console.log("切换到CV助理模式");
  }, [setQuery, setResult, setIsCVAssistant, setIsPSAssistant, setIsRLAssistant, setShowStepNavigation]);
  
  // 处理点击RL助理按钮
  const handleRlClick = useCallback(() => {
    // 清除查询和结果
    setQuery("");
    setResult(null);
    
    setIsRLAssistant(true);
    setIsCVAssistant(false);
    setIsPSAssistant(false);
    
    // 显示导航栏
    setShowStepNavigation(true);
    
    console.log("切换到RL助理模式");
  }, [setQuery, setResult, setIsCVAssistant, setIsPSAssistant, setIsRLAssistant, setShowStepNavigation]);

  return (
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
                setShowStepNavigation={setShowStepNavigation}
                onUserInputChange={handleUserInputChange}
                onOtherFilesChange={handleOtherFilesChange}
                handleStreamResponse={handleStreamResponse}
                isPSAssistant={isPSAssistant}
                isCVAssistant={isCVAssistant}
                isRLAssistant={isRLAssistant}
                onCvClick={handleCvClick}
                onRlClick={handleRlClick}
                currentAssistantType={
                  isPSAssistant 
                    ? "draft" 
                    : isCVAssistant 
                      ? "cv" 
                      : isRLAssistant 
                        ? "rl" 
                        : "custom"
                }
              />
            </div>

            {/* 第二步界面 - 条件渲染内容 */}
            <div
              ref={secondStepRef}
              className="min-w-full h-auto overflow-hidden"
            >
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
                    <h2 className="text-2xl font-bold mb-4">教授信息查询</h2>
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
              ) : isCVAssistant ? (
                <div className="flex flex-col items-start justify-start w-full pt-4 md:pt-8">
                  {/* 使用DraftResultDisplay组件显示生成结果 */}
                  {result ? (
                    <div className="w-full max-w-[800px] mx-auto">
                      <DraftResultDisplay 
                        result={result} 
                        title="简历优化报告" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="text-center p-8 max-w-md">
                        <h2 className="text-2xl font-bold mb-4">
                          请先上传并提交简历
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          您需要在第一步中上传个人简历素材表并点击"提交简历"按钮，才能查看简历优化报告。
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleStepChange(1)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          返回上传页面
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isRLAssistant ? (
                <div className="flex flex-col items-start justify-start w-full pt-4 md:pt-8">
                  {/* 使用DraftResultDisplay组件显示推荐信生成结果 */}
                  {result ? (
                    <div className="w-full max-w-[800px] mx-auto">
                      <DraftResultDisplay 
                        result={result} 
                        title="推荐信生成结果" 
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <div className="text-center p-8 max-w-md">
                        <h2 className="text-2xl font-bold mb-4">
                          请先填写推荐信信息
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          您需要在第一步中上传简历并填写推荐人信息，才能生成推荐信。
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => handleStepChange(1)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          返回信息填写页面
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
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
        hasSubmittedDraft={hasSubmittedDraft}
      />
    </div>
  );
}

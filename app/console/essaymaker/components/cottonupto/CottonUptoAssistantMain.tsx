/**
 * CottonUptoAssistantMain 组件
 *
 * 功能：Cotton Upto 助手的主界面组件，协调内容生成的完整流程
 *
 * 核心特性：
 * 1. 流程管理：
 *    - 内容生成流程
 *    - 步骤状态跟踪和切换
 *    - 进度指示和导航
 *    - 流程完成度检测
 *
 * 2. 组件协调：
 *    - 文件上传组件集成
 *    - 结果展示组件集成
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
 * 6. 数据存储：
 *    - 分析结果记录
 *    - 生成结果记录
 *    - 完整流程结果记录
 *
 * 流程步骤：
 * 1. 内容输入：上传文件或输入内容
 * 2. 结果展示：显示生成的内容和分析
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef } from "react";
import { DisplayResult } from "../../types";
import { CottonUptoFileUploadForm } from "./CottonUptoFileUploadForm";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { StepResultSection } from "../StepResultSection";
import { parseStepContent } from "../../utils/helpers";
import { useCottonUptoLogger } from "./hooks/useCottonUptoLogger";

interface CottonUptoAssistantMainProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  result?: DisplayResult | null;
  isLoading?: boolean;
  // 新增：内容生成状态
  isContentGenerating?: boolean;
  // 新增：策略相关props
  onStrategyGenerate?: (result: DisplayResult) => void;
  onStrategyGeneratingChange?: (isGenerating: boolean) => void;
  // 新增：数据保存回调
  onDataSave?: (originalFile: File | null, contentData: string, originalDoc?: string) => void;
  // 新增：清空所有内容回调
  onClearAll?: () => void;
}

export function CottonUptoAssistantMain({
  onStepChange,
  setResult,
  result,
  isLoading,
  isContentGenerating = false,
  onStrategyGenerate,
  onStrategyGeneratingChange,
  onDataSave,
  onClearAll,
}: CottonUptoAssistantMainProps) {
  // 新增：数据存储Hook
  const {
    logAnalysisResult,
    logGenerationResult,
    logCompleteResult,
  } = useCottonUptoLogger();

  // 本地状态管理
  const [localResult, setLocalResult] = useState<DisplayResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);

  // 存储原始文件和分析结果数据
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  // 存储粘贴内容
  const [originalDoc, setOriginalDoc] = useState<string>("");

  // 存储个性化需求
  const [personalizationRequirements, setPersonalizationRequirements] =
    useState<string>("");

  // 创建滚动目标的引用
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // 使用传入的状态或本地状态
  const currentResult = result || localResult;

  // 处理结果更新
  const handleResultUpdate = (newResult: DisplayResult | null) => {
    if (setResult) {
      setResult(newResult);
    } else {
      setLocalResult(newResult);
    }

    // 当结果首次出现时触发滚动
    if (newResult && !currentResult) {
      console.log("检测到查询结果首次出现，触发滚动");
      setTimeout(() => {
        handleScrollToResult();
      }, 100);
    }
  };

  // 处理文件和分析结果数据传递
  const handleDataUpdate = (
    file: File | null,
    analysisData: string,
    personalizationRequirements?: string,
    originalDoc?: string
  ) => {
    console.log('[CottonUptoAssistantMain] handleDataUpdate 调用:', {
      hasFile: !!file,
      analysisDataLength: analysisData.length,
      hasPersonalizationRequirements: !!personalizationRequirements,
      hasOriginalDoc: !!originalDoc,
      originalDocLength: originalDoc?.length || 0
    });

    setOriginalFile(file);
    setAnalysisResult(analysisData);
    
    // 保存粘贴内容到状态
    if (originalDoc) {
      setOriginalDoc(originalDoc);
      console.log('[CottonUptoAssistantMain] 保存粘贴内容:', originalDoc.substring(0, 100) + '...');
    }

    // 保存个性化需求到状态
    if (personalizationRequirements) {
      setPersonalizationRequirements(personalizationRequirements);
    }

    // 保存数据到父组件
    if (onDataSave) {
      onDataSave(file, analysisData, originalDoc);
    }
  };

  // 直接滚动到目标区域
  const handleScrollToResult = () => {
    if (scrollTargetRef.current) {
      // 获取目标元素相对于页面顶部的位置
      const targetElement = scrollTargetRef.current;
      const targetPosition =
        targetElement.getBoundingClientRect().top + window.pageYOffset;

      // 向上偏移一些像素，确保目标区域完全可见
      const scrollPosition = Math.max(0, targetPosition - 100);

      // 执行页面滚动
      window.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });

      console.log("自动滚动到查询结果区域，目标位置:", scrollPosition);
    } else {
      console.log("滚动目标引用不存在");
    }
  };

  // 处理内容生成
  const handleContentGenerate = (contentResult: DisplayResult) => {
    console.log("[CottonUptoAssistantMain] 收到内容生成结果:", contentResult);
    if (onStrategyGenerate) {
      onStrategyGenerate(contentResult);
    }
  };

  // 处理显示完整内容
  const handleShowFullContent = () => {
    if (currentResult && currentResult._originalContent) {
      console.log("显示完整内容");
      const updatedResult = {
        ...currentResult,
        content: currentResult._originalContent,
        currentStep: currentResult.currentStep || "分析完成",
      };
      handleResultUpdate(updatedResult);
    }
  };

  // 步骤点击处理
  const handleStepClick = (step: string, stepId: string) => {
    console.log(`点击步骤: ${step} (${stepId})`);
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );
  };

  // 解析步骤内容
  const parsedSteps = currentResult
    ? parseStepContent(currentResult.content || "", currentResult.steps || [])
    : [];

  // 生成策略的函数
  const handleGenerateStrategy = () => {
    console.log("开始生成内容策略");
    // 这里可以调用相应的API来生成策略
    if (onStrategyGeneratingChange) {
      onStrategyGeneratingChange(true);
    }

    // 模拟生成过程
    setTimeout(() => {
      const mockResult: DisplayResult = {
        content: "这是生成的内容策略...",
        timestamp: new Date().toISOString(),
        steps: ["策略生成完成"],
        currentStep: "策略生成",
        isComplete: true,
      };
      handleContentGenerate(mockResult);
      if (onStrategyGeneratingChange) {
        onStrategyGeneratingChange(false);
      }
    }, 3000);
  };

  return (
    <div className="cotton-upto-assistant-main">
      {/* 全屏加载动画 */}
      {(isLoading || isContentGenerating) && (
        <FullScreenLoadingAnimation
          text={
            isContentGenerating
              ? "正在生成内容，请勿切换页面..."
              : "正在分析内容，请勿切换页面..."
          }
        />
      )}

      <div className="flex flex-col items-center justify-start w-full px-0">
        <div className="w-full max-w-[1800px] mx-auto">
          <div className="p-2">
            {/* 文件上传表单 */}
            <CottonUptoFileUploadForm
              onStepChange={onStepChange}
              setResult={handleResultUpdate}
              onDataUpdate={handleDataUpdate}
              onScrollToResult={handleScrollToResult}
              onClearAll={onClearAll}
            />

            {/* 结果展示区域 */}
            {currentResult && (
              <div ref={scrollTargetRef} className="mt-8">
                <StepResultSection
                  result={currentResult}
                  expandedSteps={expandedSteps}
                  setExpandedSteps={setExpandedSteps}
                  handleStepClick={handleStepClick}
                  handleShowFullContent={handleShowFullContent}
                  title="内容分析过程"
                  originalEssayFile={originalFile}
                  searchResult={analysisResult}
                  onGenerateStrategy={handleGenerateStrategy}
                  onStepChange={onStepChange}
                  personalizationRequirements={personalizationRequirements}
                  materialDoc={originalDoc}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
/**
 * SectionalAssistantMain 组件
 * 
 * 功能：分稿助理的主界面组件，协调分稿生成的完整流程
 * 
 * 核心特性：
 * 1. 流程管理：
 *    - 分稿生成流程
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
 * 流程步骤：
 * 1. 文件上传：上传初稿文件和支持文件
 * 2. 结果展示：显示分稿策略和建议
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef } from "react";
import { DisplayResult } from "../../types";
import { SectionalFileUploadForm } from "./SectionalFileUploadForm";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";
import { ResultSection } from "../ResultSection";
import { parseStepContent } from "../../utils/helpers";

interface SectionalAssistantMainProps {
  onStepChange?: (step: number) => void;
  setResult?: (result: DisplayResult | null) => void;
  result?: DisplayResult | null;
  isLoading?: boolean;
  // 新增：分稿生成状态
  isSectionalGenerating?: boolean;
  // 🆕 新增：改写策略相关props
  onStrategyGenerate?: (result: DisplayResult) => void;
  onStrategyGeneratingChange?: (isGenerating: boolean) => void;
  // 🆕 新增：数据保存回调
  onDataSave?: (originalFile: File | null, strategyContent: string) => void;
  // 🆕 新增：清空所有内容回调
  onClearAll?: () => void;
}

export function SectionalAssistantMain({
  onStepChange,
  setResult,
  result,
  isLoading,
  isSectionalGenerating = false,
  onStrategyGenerate,
  onStrategyGeneratingChange,
  onDataSave,
  onClearAll,
}: SectionalAssistantMainProps) {
  // 本地状态管理
  const [localResult, setLocalResult] = useState<DisplayResult | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  
  // 新增：存储原始文件和搜索结果数据，用于改写策略生成
  const [originalEssayFile, setOriginalEssayFile] = useState<File | null>(null);
  const [searchResult, setSearchResult] = useState<string>("");

  // 🆕 新增：创建滚动目标的引用
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
    
    // 🆕 新增：当结果首次出现时也触发滚动
    if (newResult && !currentResult) {
      console.log("检测到查询结果首次出现，触发滚动");
      setTimeout(() => {
        handleScrollToResult();
      }, 100);
    }
  };

  // 新增：处理文件和搜索结果数据传递
  const handleDataUpdate = (file: File | null, searchData: string) => {
    setOriginalEssayFile(file);
    setSearchResult(searchData);
    
    // 🆕 保存数据到父组件
    if (onDataSave) {
      onDataSave(file, searchData);
    }
  };

  // 🆕 简化：直接滚动到目标区域
  const handleScrollToResult = () => {
    if (scrollTargetRef.current) {
      // 获取目标元素相对于页面顶部的位置
      const targetElement = scrollTargetRef.current;
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
      
      // 向上偏移一些像素，确保目标区域完全可见
      const scrollPosition = Math.max(0, targetPosition - 100);
      
      // 执行页面滚动
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
      
      console.log("自动滚动到查询结果区域，目标位置:", scrollPosition);
    } else {
      console.log("滚动目标引用不存在");
    }
  };

  // 🆕 新增：处理改写策略生成
  const handleStrategyGenerate = (strategyResult: DisplayResult) => {
    console.log("收到改写策略结果:", strategyResult);
    
    // 通知父组件策略生成状态
    if (onStrategyGeneratingChange) {
      onStrategyGeneratingChange(!strategyResult.isComplete);
    }
    
    // 传递策略结果给父组件，但不再自动跳转（因为在点击按钮时已经跳转）
    if (onStrategyGenerate) {
      onStrategyGenerate(strategyResult);
    }
    
    // 如果生成完成，记录日志
    if (strategyResult.isComplete) {
      console.log("改写策略生成完成，内容长度:", strategyResult.content.length);
    }
  };

  // 处理步骤点击
  const handleStepClick = (step: string, stepId: string) => {
    // 切换展开/折叠状态
    setExpandedSteps((prev) =>
      prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
    );

    // 🆕 优先从步骤内容映射中获取具体内容
    let stepContent = "";
    
    // 使用类型断言来访问_stepContents属性
    const resultWithStepContents = currentResult as DisplayResult & { _stepContents?: Record<string, string> };
    
    if (resultWithStepContents?._stepContents && resultWithStepContents._stepContents[step]) {
      // 如果有保存的步骤内容，直接使用
      stepContent = resultWithStepContents._stepContents[step];
      console.log(`从步骤内容映射中获取内容: ${step}`, stepContent.substring(0, 100) + "...");
    } else {
      // 如果没有步骤内容映射，使用原有的解析逻辑
      console.log(`使用原有解析逻辑: ${step}`);
      
      // 解析步骤内容
      const stepData = parseStepContent(step);

      // 处理null/undefined的内容并确保有字符串类型
      const getFormattedContent = (): string => {
        // 分析查询类型，优先使用details（嵌入的内容）
        if (stepData.type === "analysis" && stepData.details) {
          return stepData.details;
        }
        // 生成内容类型，优先使用details
        else if (stepData.type === "generation") {
          // 检查内容是否重复（防止前后内容重复）
          const details = stepData.details || "";
          if (details.length > 0) {
            // 尝试查找重复部分
            const halfLength = Math.floor(details.length / 2);
            const firstHalf = details.substring(0, halfLength);
            const secondHalf = details.substring(halfLength);

            // 如果两半内容基本相同（超过80%相似），则只返回一半
            if (
              firstHalf.length > 100 &&
              secondHalf.includes(firstHalf.substring(0, firstHalf.length * 0.8))
            ) {
              return firstHalf;
            }
            return details;
          }
          return stepData.content || "";
        }
        // 搜索和网页内容类型，优先使用details
        else if (stepData.type === "search" || stepData.type === "web") {
          return stepData.details || stepData.content || "";
        }
        // 其他类型，带标题显示
        else if (stepData.content) {
          // 检查内容是否重复
          const content = stepData.content;
          if (content.length > 500) {
            // 尝试查找重复部分
            const halfLength = Math.floor(content.length / 2);
            const firstHalf = content.substring(0, halfLength);
            const secondHalf = content.substring(halfLength);

            // 如果两半内容基本相同，则只返回一半
            if (
              firstHalf.length > 100 &&
              secondHalf.includes(firstHalf.substring(0, firstHalf.length * 0.8))
            ) {
              return `## ${stepData.title}\n\n${firstHalf}`;
            }
          }
          return `## ${stepData.title}\n\n${content}`;
        }
        // 默认返回空字符串
        return "";
      };

      stepContent = getFormattedContent();
    }

    // 更新分稿助理的结果显示
    if (currentResult) {
      const updatedResult: DisplayResult = {
        ...currentResult,
        content: stepContent, // 使用步骤特定的内容
        // 添加一个标记，表示这是步骤点击显示的内容，而不是流式生成的内容
        _isStepContent: true,
      };
      handleResultUpdate(updatedResult);
    }
  };

  return (
    <>
      {/* 分稿助理全屏加载动画 - 在第一步界面显示 */}
      {isSectionalGenerating && (
        <FullScreenLoadingAnimation 
          text="正在生成分稿策略，请勿切换页面..." 
        />
      )}

      <div className="w-full space-y-6">
        {/* 文件上传表单 */}
        <SectionalFileUploadForm
          onStepChange={onStepChange}
          setResult={handleResultUpdate}
          onDataUpdate={handleDataUpdate}
          onScrollToResult={handleScrollToResult}
          onClearAll={onClearAll}
        />

        {/* 🆕 滚动目标区域 */}
        <div ref={scrollTargetRef} className="w-full">
          {/* 使用 ResultSection 组件展示分稿内容 */}
          {currentResult ? (
            <ResultSection
              result={currentResult}
              expandedSteps={expandedSteps}
              setExpandedSteps={setExpandedSteps}
              handleStepClick={handleStepClick}
              title="查询过程"
              originalEssayFile={originalEssayFile}
              searchResult={searchResult}
              onGenerateStrategy={handleStrategyGenerate}
              onStepChange={onStepChange}
            />
          ) : (
            /* 占位区域，确保滚动目标始终存在 */
            <div className="w-full h-20 flex items-center justify-center">
              <div className="text-gray-400 text-sm">查询结果将显示在此处</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 
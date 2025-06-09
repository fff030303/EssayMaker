/**
 * ResultSection 组件
 * 
 * 功能：结果展示区域的容器组件
 * 
 * 核心特性：
 * 1. 结果容器：
 *    - 统一的结果展示框架
 *    - 响应式布局容器
 *    - 内容区域管理
 *    - 滚动行为控制
 * 
 * 2. 布局管理：
 *    - 自适应高度调整
 *    - 内容溢出处理
 *    - 间距和边距控制
 *    - 视觉层次结构
 * 
 * 3. 状态展示：
 *    - 加载状态指示
 *    - 空状态处理
 *    - 错误状态显示
 *    - 成功状态反馈
 * 
 * 4. 交互支持：
 *    - 内容选择功能
 *    - 复制操作支持
 *    - 导出功能集成
 *    - 分享选项
 * 
 * 5. 性能优化：
 *    - 虚拟滚动支持
 *    - 懒加载内容
 *    - 内存管理
 *    - 渲染优化
 * 
 * 使用场景：
 * - 查询结果展示
 * - 生成内容显示
 * - 分析报告呈现
 * - 处理结果汇总
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DisplayResult } from "../types";
import { StepIndicator } from "./StepIndicator";
import { ResultDisplay } from "./ResultDisplay";

interface ResultSectionProps {
  result: DisplayResult | null;
  expandedSteps: string[];
  setExpandedSteps: React.Dispatch<React.SetStateAction<string[]>>;
  handleStepClick: (step: string, stepId: string) => void;
  title?: string; // 可选的自定义标题
  originalEssayFile?: File | null;
  searchResult?: string;
  onGenerateStrategy?: (strategyResult: DisplayResult) => void;
  onStepChange?: (step: number) => void;
  personalizationRequirements?: string; // 🆕 新增：个性化需求参数
}

export function ResultSection({
  result,
  expandedSteps,
  setExpandedSteps,
  handleStepClick,
  title = "查询过程", // 默认标题
  originalEssayFile,
  searchResult,
  onGenerateStrategy,
  onStepChange,
  personalizationRequirements,
}: ResultSectionProps) {
  // 创建结果区域的引用
  const resultRef = useRef<HTMLDivElement>(null);

  // 切换展开/折叠所有步骤
  const toggleAllSteps = (steps: string[]) => {
    setExpandedSteps((prev) => (prev.length === steps.length ? [] : steps));
  };

  if (!result) return null;

  return (
    <div
      ref={resultRef}
      className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 mb-0"
    >
      <div className="lg:col-span-4">
        <div className="h-full max-h-[calc(100vh-84px)] p-5 overflow-visible">
          <Card className="shadow-lg h-[calc(100%-3px)] flex flex-col">
            <CardHeader className="pb-2 pt-4 px-4 flex-shrink-0">
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4 overflow-y-auto flex-grow">
              <StepIndicator
                steps={result.steps}
                expandedSteps={expandedSteps}
                toggleStep={(stepId: string) => {
                  setExpandedSteps((prev) =>
                    prev.includes(stepId)
                      ? prev.filter((id) => id !== stepId)
                      : [...prev, stepId]
                  );
                }}
                toggleAllSteps={toggleAllSteps}
                isLoading={!result.isComplete}
                onStepClick={handleStepClick}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 分析结果显示区域 */}
      <div className="lg:col-span-8">
        <div className="h-full max-h-[calc(100vh-84px)] p-5 overflow-visible">
          <ResultDisplay 
            result={result} 
            originalEssayFile={originalEssayFile}
            searchResult={searchResult}
            onGenerateStrategy={onGenerateStrategy}
            onStepChange={onStepChange}
            personalizationRequirements={personalizationRequirements}
          />
        </div>
      </div>
    </div>
  );
}




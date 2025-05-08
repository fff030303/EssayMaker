// 结果区域组件，包含：

// - 左侧步骤指示器
// - 右侧结果展示
// - 管理步骤的展开/折叠状态
// - 处理步骤点击事件

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
}

export function ResultSection({
  result,
  expandedSteps,
  setExpandedSteps,
  handleStepClick,
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
              <CardTitle className="text-base font-medium">查询过程</CardTitle>
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
          <ResultDisplay result={result} />
        </div>
      </div>
    </div>
  );
}




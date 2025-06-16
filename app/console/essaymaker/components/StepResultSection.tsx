/**
 * StepResultSection 组件
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

import { useRef, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, List } from "lucide-react";
import { DisplayResult } from "../types";
import { StepIndicator } from "./StepIndicator";
import { StepResultDisplay } from "./StepResultDisplay";

interface StepResultSectionProps {
  result: DisplayResult | null;
  expandedSteps: string[];
  setExpandedSteps: React.Dispatch<React.SetStateAction<string[]>>;
  handleStepClick: (step: string, stepId: string) => void;
  handleShowFullContent?: () => void; // 新增：恢复完整内容的函数
  title?: string; // 可选的自定义标题
  originalEssayFile?: File | null;
  searchResult?: string;
  onGenerateStrategy?: (strategyResult: DisplayResult) => void;
  onStepChange?: (step: number) => void;
  personalizationRequirements?: string; // 🆕 新增：个性化需求参数
  materialDoc?: string; // 🆕 新增：粘贴的文档内容
}

export function StepResultSection({
  result,
  expandedSteps,
  setExpandedSteps,
  handleStepClick,
  handleShowFullContent,
  title = "查询过程", // 默认标题
  originalEssayFile,
  searchResult,
  onGenerateStrategy,
  onStepChange,
  personalizationRequirements,
  materialDoc, // 🆕 新增：粘贴的文档内容
}: StepResultSectionProps) {
  // 创建结果区域的引用
  const resultRef = useRef<HTMLDivElement>(null);

  // 🆕 新增：查询过程展开/收起状态
  const [isProcessExpanded, setIsProcessExpanded] = useState(true);

  // 🆕 新增：当查询完成时自动收起查询过程
  useEffect(() => {
    if (result?.isComplete) {
      setIsProcessExpanded(false);
    }
  }, [result?.isComplete]);

  // 切换展开/折叠所有步骤
  const toggleAllSteps = (steps: string[]) => {
    setExpandedSteps((prev) => (prev.length === steps.length ? [] : steps));
  };

  // 🆕 新增：切换查询过程展开/收起
  const toggleProcessExpanded = () => {
    setIsProcessExpanded(!isProcessExpanded);
  };

  if (!result) return null;

  return (
    <div ref={resultRef} className="w-full mt-4 mb-0">
      {/* 🆕 查询过程收起时的顶部控制条 */}
      {!isProcessExpanded && (
        <div className="w-full mb-4 px-5">
          <Card className="shadow-md border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90">
            <CardContent
              className="p-3 cursor-pointer hover:bg-stone-100/70 transition-colors"
              onClick={toggleProcessExpanded}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-stone-700" />
                  <span className="text-sm font-medium text-stone-700">
                    {title}
                  </span>
                  <span className="text-xs text-stone-600">
                    ({result.steps.length} 个步骤 •{" "}
                    {result.isComplete ? "已完成" : "进行中"})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-600">
                  <span>点击展开</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容区域 */}
      <div
        className={`w-full gap-6 ${
          isProcessExpanded ? "grid grid-cols-1 lg:grid-cols-12" : ""
        }`}
      >
        {/* 查询过程区域 - 展开时显示 */}
        {isProcessExpanded && (
          <div className="lg:col-span-4">
            <div className="h-full max-h-[calc(100vh-84px)] p-5 overflow-visible">
              <Card className="shadow-md h-[calc(100%-3px)] flex flex-col border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex-shrink-0 bg-gradient-to-r from-stone-200/60 to-zinc-200/50 border-b border-stone-300/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-stone-700">
                      {title}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleProcessExpanded}
                      className="text-xs hover:bg-stone-100/70 text-stone-600"
                    >
                      <ChevronUp className="h-4 w-4 mr-1" />
                      收起
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4 overflow-y-auto flex-grow bg-stone-50/50">
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
        )}

        {/* 分析结果显示区域 */}
        <div className={isProcessExpanded ? "lg:col-span-8" : "w-full"}>
          <div
            className={`p-5 ${
              isProcessExpanded
                ? "h-full max-h-[calc(100vh-84px)] overflow-visible"
                : "h-[calc(100vh-200px)] overflow-hidden"
            } rounded-lg`}
          >
            <StepResultDisplay
              result={result}
              originalEssayFile={originalEssayFile}
              searchResult={searchResult}
              onGenerateStrategy={onGenerateStrategy}
              onStepChange={onStepChange}
              personalizationRequirements={personalizationRequirements}
              onShowFullContent={handleShowFullContent}
              materialDoc={materialDoc} // 🆕 新增：传递粘贴的文档内容
            />
          </div>
        </div>
      </div>
    </div>
  );
}

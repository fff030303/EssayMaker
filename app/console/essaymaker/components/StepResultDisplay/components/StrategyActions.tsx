/**
 * 策略生成操作组件模块
 *
 * 功能：提供策略生成功能的用户交互界面
 *
 * 特性：
 * - 策略生成按钮
 * - 生成状态管理
 * - 提示词设置
 * - API调用处理
 */

"use client";

import { Button } from "@/components/ui/button";
import { Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DisplayResult } from "@/app/console/essaymaker/types";

interface StrategyActionsProps {
  displayData: DisplayResult | null;
  customPrompt?: string;
  isGenerating?: boolean;
  onGenerateStrategy?: () => void;
  onShowPromptSettings?: () => void;
}

export function StrategyActions({
  displayData,
  customPrompt,
  isGenerating = false,
  onGenerateStrategy,
  onShowPromptSettings,
}: StrategyActionsProps) {
  // 检查是否可以生成策略
  const canGenerateStrategy = displayData?.content && !isGenerating;

  const handleGenerateClick = () => {
    if (!canGenerateStrategy) {
      toast.error("当前内容无法生成策略");
      return;
    }

    onGenerateStrategy?.();
  };

  const handlePromptSettingsClick = () => {
    onShowPromptSettings?.();
  };

  if (!displayData) {
    return null;
  }

  return (
    <div className="flex gap-2 justify-end mt-4">
      {/* 提示词设置按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePromptSettingsClick}
        className="flex items-center gap-2"
        title="设置自定义提示词"
      >
        <Settings className="w-4 h-4" />
        {customPrompt ? "修改提示词" : "设置提示词"}
      </Button>

      {/* 策略生成按钮 */}
      <Button
        variant="default"
        size="sm"
        onClick={handleGenerateClick}
        disabled={!canGenerateStrategy}
        className="flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? "生成中..." : "生成策略"}
      </Button>
    </div>
  );
}

export default StrategyActions;

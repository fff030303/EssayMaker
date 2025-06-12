/**
 * 提示词设置组件模块
 *
 * 功能：提供自定义策略生成提示词的用户界面
 *
 * 特性：
 * - 角色提示词设置
 * - 任务提示词设置
 * - 输出格式提示词设置
 * - 重置功能
 * - 折叠展开
 */

"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";

interface PromptSettingsProps {
  customRole: string;
  customTask: string;
  customOutputFormat: string;
  isGenerating?: boolean;
  onRoleChange: (value: string) => void;
  onTaskChange: (value: string) => void;
  onOutputFormatChange: (value: string) => void;
  onReset: () => void;
}

export function PromptSettings({
  customRole,
  customTask,
  customOutputFormat,
  isGenerating = false,
  onRoleChange,
  onTaskChange,
  onOutputFormatChange,
  onReset,
}: PromptSettingsProps) {
  const handleReset = () => {
    onReset();
    toast.success("策略生成提示词已重置");
  };

  return (
    <Card className="mt-2 border bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90">
      <CardHeader className="pb-2 bg-gradient-to-r from-stone-200/60 to-zinc-200/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-stone-700">
            策略生成自定义提示词
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-6 hover:bg-stone-100/70"
            onClick={handleReset}
            disabled={isGenerating}
          >
            <RefreshCcw className="h-3 w-3 mr-1 text-stone-600" />
            重置
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <Label htmlFor="strategy-role" className="text-xs">
            策略生成角色提示词
          </Label>
          <Textarea
            id="strategy-role"
            value={customRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="mt-1 min-h-[50px] text-xs"
            placeholder="例如：你是一位专业的Essay改写策略专家，擅长分析学术写作需求..."
            disabled={isGenerating}
          />
        </div>

        <div>
          <Label htmlFor="strategy-task" className="text-xs">
            策略生成任务提示词
          </Label>
          <Textarea
            id="strategy-task"
            value={customTask}
            onChange={(e) => onTaskChange(e.target.value)}
            className="mt-1 min-h-[50px] text-xs"
            placeholder="例如：请根据搜索结果和原稿分析，制定详细的Essay改写策略..."
            disabled={isGenerating}
          />
        </div>

        <div>
          <Label htmlFor="strategy-format" className="text-xs">
            策略生成输出格式提示词
          </Label>
          <Textarea
            id="strategy-format"
            value={customOutputFormat}
            onChange={(e) => onOutputFormatChange(e.target.value)}
            className="mt-1 min-h-[50px] text-xs"
            placeholder="例如：请按照结构化格式输出改写策略，包含分析要点、改进建议等..."
            disabled={isGenerating}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default PromptSettings;

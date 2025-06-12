/**
 * RequirementsSection 组件 - 现代化设计
 *
 * 写作需求定制区域，采用可折叠的现代化设计风格
 *
 * 特性：
 * - 可折叠的输入区域
 * - 快捷标签选择
 * - 智能提示文案
 * - 字符计数显示
 *
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { REQUIREMENTS_TEMPLATES } from "../constants/templates";

interface RequirementsSectionProps {
  requirements: string;
  setRequirements: (value: string) => void;
  isLoading: boolean;
}

export function RequirementsSection({
  requirements,
  setRequirements,
  isLoading,
}: RequirementsSectionProps) {
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);

  // 处理需求模板标签点击
  const handleRequirementTagClick = (value: string) => {
    if (requirements.includes(value)) {
      // 如果已包含，则移除
      setRequirements(requirements.replace(value, "").trim());
    } else {
      // 如果未包含，则添加
      const newValue = requirements ? `${requirements} ${value}` : value;
      setRequirements(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <Collapsible
        open={isRequirementsOpen}
        onOpenChange={setIsRequirementsOpen}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 text-left">
              <Settings className="h-4 w-4 text-stone-600" />
              <div>
                <div className="text-sm font-medium text-stone-800">
                  写作需求定制
                </div>
                <div className="text-xs text-stone-600">
                  定制个人陈述的风格和重点
                </div>
              </div>
              <Badge
                variant="outline"
                className="ml-2 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
              >
                可选
              </Badge>
            </div>
            {isRequirementsOpen ? (
              <ChevronUp className="h-4 w-4 text-stone-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-600" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 pt-4">
          {/* 快捷标签 */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-stone-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              快速选择
            </div>
            <div className="flex flex-wrap gap-2">
              {REQUIREMENTS_TEMPLATES.map((template) => (
                <Badge
                  key={template.value}
                  variant={
                    requirements.includes(template.value)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer transition-colors text-xs ${
                    requirements.includes(template.value)
                      ? "bg-stone-700 text-white hover:bg-stone-800"
                      : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                  }`}
                  onClick={() => handleRequirementTagClick(template.value)}
                >
                  {template.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 文本输入区域 */}
          <div className="space-y-2">
            <Textarea
              placeholder="例如：请突出学术研究能力，重点展示科研经历和创新思维..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px] resize-none border-dashed border-stone-300 bg-white placeholder:text-stone-500 focus-visible:ring-stone-400 shadow-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>输入特殊要求或点击标签快速添加</span>
              <span>{requirements.length}/500</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 当有内容但折叠时显示摘要 */}
      {!isRequirementsOpen && requirements && (
        <div className="p-3 bg-stone-100/60 rounded-lg border-dashed border border-stone-300">
          <div className="text-xs text-stone-600 mb-1">已设置写作要求：</div>
          <div className="text-sm truncate text-stone-800">
            {requirements.length > 60
              ? `${requirements.substring(0, 60)}...`
              : requirements}
          </div>
        </div>
      )}
    </div>
  );
}

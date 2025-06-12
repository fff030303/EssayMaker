/**
 * PersonalizationSection 组件 - 现代化设计
 *
 * 个性化需求定制区域，采用简洁现代的设计风格
 *
 * 特性：
 * - 简洁的卡片式布局
 * - 可折叠的输入区域
 * - 快捷标签选择
 * - 智能提示文案
 *
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PERSONALIZATION_TEMPLATES } from "../constants/templates";

// 🔄 从constants/templates.ts获取个性化标签数据
const PERSONALIZATION_TAGS = PERSONALIZATION_TEMPLATES.map((template) => ({
  label: template.label,
  value: template.content,
}));

interface PersonalizationSectionProps {
  personalizationRequirements: string;
  setPersonalizationRequirements: (value: string) => void;
  isLoading: boolean;
}

export function PersonalizationSection({
  personalizationRequirements,
  setPersonalizationRequirements,
  isLoading,
}: PersonalizationSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagClick = (value: string) => {
    if (personalizationRequirements.includes(value)) {
      // 如果已包含，则移除
      setPersonalizationRequirements(
        personalizationRequirements.replace(value, "").trim()
      );
    } else {
      // 如果未包含，则添加
      const newValue = personalizationRequirements
        ? `${personalizationRequirements} ${value}`
        : value;
      setPersonalizationRequirements(newValue);
    }
  };

  return (
    <div className="space-y-4">
      {/* 标题区域 */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
                  个性化定制
                </div>
                <div className="text-xs text-stone-600">
                  可选 - 定制分析的风格和重点
                </div>
              </div>
              <Badge
                variant="outline"
                className="ml-2 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
              >
                可选
              </Badge>
            </div>
            {isOpen ? (
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
              {PERSONALIZATION_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={
                    personalizationRequirements.includes(tag.value)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer transition-colors text-xs ${
                    personalizationRequirements.includes(tag.value)
                      ? "bg-stone-700 text-white hover:bg-stone-800"
                      : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                  }`}
                  onClick={() => handleTagClick(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* 文本输入区域 */}
          <div className="space-y-2">
            <Textarea
              placeholder="例如：请用学术性的语言分析，重点关注教学方法的创新..."
              value={personalizationRequirements}
              onChange={(e) => setPersonalizationRequirements(e.target.value)}
              disabled={isLoading}
              className="min-h-[80px] resize-none border-dashed border-stone-300 bg-white placeholder:text-stone-500 focus-visible:ring-stone-400 shadow-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>输入特殊要求或点击标签快速添加</span>
              <span>{personalizationRequirements.length}/500</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 当有内容但折叠时显示摘要 */}
      {!isOpen && personalizationRequirements && (
        <div className="p-3 bg-stone-100/60 rounded-lg border-dashed border border-stone-300">
          <div className="text-xs text-stone-600 mb-1">已设置个性化要求：</div>
          <div className="text-sm truncate text-stone-800">
            {personalizationRequirements.length > 60
              ? `${personalizationRequirements.substring(0, 60)}...`
              : personalizationRequirements}
          </div>
        </div>
      )}
    </div>
  );
}

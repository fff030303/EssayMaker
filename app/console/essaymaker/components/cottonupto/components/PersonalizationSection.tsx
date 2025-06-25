/**
 * PersonalizationSection 组件
 *
 * 功能：Cotton Upto 助手的个性化需求定制组件
 *
 * 核心特性：
 * 1. 个性化定制：
 *    - 风格偏好设置
 *    - 特殊要求输入
 *    - 实时字符计数
 *
 * 2. 用户体验：
 *    - 清晰的标签和提示
 *    - 响应式布局
 *    - 可选填写
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";

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
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-stone-600" />
        <Label htmlFor="personalization" className="text-sm font-medium text-stone-700">
          个性化需求定制
          <span className="ml-1 text-xs text-gray-500 font-normal">（可选）</span>
        </Label>
      </div>
      
      <div className="space-y-2">
        <Textarea
          id="personalization"
          placeholder="请描述您的个性化需求，例如：语言风格、目标受众、特殊要求等..."
          value={personalizationRequirements}
          onChange={(e) => setPersonalizationRequirements(e.target.value)}
          disabled={isLoading}
          className="min-h-[100px] resize-y focus:ring-stone-500 focus:border-stone-500"
        />
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>添加个性化需求可以帮助生成更符合您期望的内容</span>
          <span>{personalizationRequirements.length} 字符</span>
        </div>
      </div>
    </div>
  );
} 
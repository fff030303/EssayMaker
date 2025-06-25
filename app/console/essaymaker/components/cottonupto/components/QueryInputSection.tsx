/**
 * QueryInputSection 组件
 *
 * 功能：Cotton Upto 助手的查询输入区域组件
 *
 * 核心特性：
 * 1. 查询输入：
 *    - 多行文本输入
 *    - 实时字符计数
 *    - 输入验证
 *
 * 2. 用户体验：
 *    - 清晰的标签和提示
 *    - 响应式布局
 *    - 禁用状态处理
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface QueryInputSectionProps {
  userInput: string;
  setUserInput: (value: string) => void;
  isLoading: boolean;
}

export function QueryInputSection({
  userInput,
  setUserInput,
  isLoading,
}: QueryInputSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-stone-600" />
        <Label htmlFor="user-input" className="text-sm font-medium text-stone-700">
          内容需求描述
        </Label>
      </div>
      
      <div className="space-y-2">
        <Textarea
          id="user-input"
          placeholder="请描述您的内容生成需求，例如：帮我写一篇关于环保的文章..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] resize-y focus:ring-stone-500 focus:border-stone-500"
        />
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>请详细描述您的需求，以便为您生成更准确的内容</span>
          <span>{userInput.length} 字符</span>
        </div>
      </div>
    </div>
  );
} 
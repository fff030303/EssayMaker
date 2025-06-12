/**
 * DirectionInputSection 组件 - 现代化设计
 *
 * 申请方向输入区域，采用简洁现代的设计风格
 *
 * 特性：
 * - 清晰的输入界面
 * - 快捷标签选择
 * - 实时输入反馈
 * - 必填字段标识
 *
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { DIRECTION_TEMPLATES } from "../constants/templates";

interface DirectionInputSectionProps {
  direction: string;
  setDirection: (value: string) => void;
  isLoading: boolean;
}

export function DirectionInputSection({
  direction,
  setDirection,
  isLoading,
}: DirectionInputSectionProps) {
  // 处理申请方向标签点击
  const handleDirectionTagClick = (value: string) => {
    setDirection(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-stone-700" />
          <h3 className="text-sm font-medium text-stone-800">申请方向</h3>
          <Badge
            variant="destructive"
            className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
          >
            必需
          </Badge>
        </div>

        <Input
          placeholder="请输入您的申请方向，例如：计算机科学硕士、数据科学硕士..."
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="min-h-[50px] text-base border border-stone-200 bg-white placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:border-stone-400 transition-colors shadow-sm"
          disabled={isLoading}
        />

        {direction.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">或者试试这些热门方向：</p>
            <div className="flex flex-wrap gap-2">
              {DIRECTION_TEMPLATES.map((template, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer bg-stone-200 hover:bg-stone-700 text-stone-700 hover:text-white transition-colors px-3 py-1.5 text-sm font-normal border-stone-300"
                  onClick={() => handleDirectionTagClick(template.value)}
                >
                  {template.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

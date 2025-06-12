/**
 * UserInputSection 组件 - 现代化设计
 *
 * 用户个人描述输入区域，采用简洁现代的设计风格
 *
 * 特性：
 * - 清晰的输入界面
 * - 个人信息描述
 * - 实时输入反馈
 * - 必填字段标识
 *
 * @version 2.0.0 - 现代化重设计
 */

"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

interface UserInputSectionProps {
  userInfo: string;
  setUserInfo: (value: string) => void;
  isLoading: boolean;
}

export function UserInputSection({
  userInfo,
  setUserInfo,
  isLoading,
}: UserInputSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-stone-700" />
        <h3 className="text-lg font-medium text-stone-800">个人描述</h3>
        <span className="text-sm text-stone-600">必需</span>
      </div>

      <Textarea
        placeholder="简要描述您的个人特点、兴趣爱好、特殊经历等"
        value={userInfo}
        onChange={(e) => setUserInfo(e.target.value)}
        className="min-h-[120px] bg-stone-100/50 border-stone-300 text-stone-800 placeholder:text-stone-500 focus:border-stone-500 focus:ring-stone-500/20"
        disabled={isLoading}
      />

      <div className="text-xs text-stone-600">
        提示：您可以描述您的学术背景、工作经历、兴趣爱好或其他相关信息，这将帮助AI更好地生成个性化的个人陈述。
      </div>
    </div>
  );
}

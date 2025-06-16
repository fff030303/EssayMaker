/**
 * 查询需求描述组件 - 现代化设计
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle } from "lucide-react";
import { QUERY_TEMPLATES } from "../constants/templates";

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
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-stone-700" />
          <h3 className="text-sm font-medium text-stone-800">
            你要撰写哪个项目的分稿？
          </h3>
          <Badge
            variant="destructive"
            className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
          >
            必需
          </Badge>
        </div>

        <Textarea
          placeholder="请输入学校及专业名称"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="min-h-[100px] resize-none border border-stone-200 bg-white text-base placeholder:text-stone-500 focus-visible:ring-1 focus-visible:ring-stone-400 focus-visible:border-stone-400 transition-colors shadow-sm"
          disabled={isLoading}
        />

        
      </div>
    </div>
  );
}

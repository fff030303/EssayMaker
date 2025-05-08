"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentResponse {
  filters: {
    country?: string;
    university?: string;
    majorCategory?: string;
    program?: string;
  };
  explanation: string;
}

export function InterviewAgentSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<AgentResponse | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setApiResponse(null);
    try {
      const response = await fetch("/api/interviews/agent-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error("搜索请求失败");
      }

      const result: AgentResponse = await response.json();
      setApiResponse(result);
    } catch (error) {
      console.error("Agent search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (!apiResponse) return;

    // 更新 URL 参数
    const params = new URLSearchParams();
    Object.entries(apiResponse.filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // 更新路由
    router.push(`${pathname}?${params.toString()}`);

    // 触发数据重新获取
    queryClient.invalidateQueries({ queryKey: ["interviews"] });

    // 关闭对话框
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setApiResponse(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 bg-blue-500 text-white hover:bg-blue-600 hover:text-white"
        >
          <Sparkles className="h-4 w-4" />
          智能查询
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-4 shadow-lg border-2 rounded-lg bg-slate-50 dark:bg-zinc-900"
        align="start"
        sideOffset={4}
      >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">请用自然语言描述您想查找的面经，例如：</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>我想找美国计算机专业的硕士面经</li>
              <li>查找哈佛大学的面试经验</li>
            </ul>
          </div>
          <Textarea
            placeholder="请输入您的查询..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="resize-none text-sm bg-white dark:bg-zinc-950"
          />
          {apiResponse && (
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                <div className="text-sm space-y-1.5 p-3 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-medium text-xs">查询解释：</div>
                  <div className="text-muted-foreground text-xs">
                    {apiResponse.explanation}
                  </div>
                </div>
                <div className="text-sm space-y-1.5 p-3 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-medium text-xs">筛选条件：</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(apiResponse.filters).map(
                      ([key, value]) =>
                        value && (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key}:
                            </span>
                            <span>{value}</span>
                          </div>
                        )
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <div className="flex justify-end items-center gap-2 pt-2">
            {apiResponse ? (
              <Button
                onClick={handleApplyFilters}
                size="sm"
                className="gap-1.5"
              >
                <Check className="h-3 w-3" />
                应用筛选
              </Button>
            ) : (
              <Button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                size="sm"
                className="gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isLoading ? "正在分析..." : "开始查询"}
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

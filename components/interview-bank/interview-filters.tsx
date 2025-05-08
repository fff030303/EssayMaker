"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useQueryClient } from "@tanstack/react-query";
import { InterviewAgentSearch } from "./interview-agent-search";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 添加FilterValues类型定义
interface FilterValues {
  country: string;
  university: string;
  majorCategory: string;
  program: string;
  targetDegree: string;
}

const degreeOptions = [
  { value: "UNDERGRADUATE", label: "本科" },
  { value: "MASTER", label: "硕士" },
  { value: "PHD", label: "博士" },
  { value: "OTHER", label: "其他" },
];

export default function InterviewFilters({
  searchParams,
  pathname,
}: {
  searchParams: URLSearchParams | null;
  pathname: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    country: searchParams?.get("country") || "",
    university: searchParams?.get("university") || "",
    majorCategory: searchParams?.get("majorCategory") || "",
    program: searchParams?.get("program") || "",
    targetDegree: searchParams?.get("targetDegree") || "",
  });

  useEffect(() => {
    setFilters({
      country: searchParams?.get("country") || "",
      university: searchParams?.get("university") || "",
      majorCategory: searchParams?.get("majorCategory") || "",
      program: searchParams?.get("program") || "",
      targetDegree: searchParams?.get("targetDegree") || "",
    });
  }, [searchParams]);

  // 检查是否有任何筛选条件
  const hasFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== "");
  }, [filters]);

  // 使用 useDebouncedCallback 来优化更新
  const debouncedUpdateUrl = useDebouncedCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value.toString());
        }
      });
      router.push(`${pathname}?${params.toString()}`);
      // 使查询无效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
    500 // 增加防抖时间到500ms
  );

  const handleChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedUpdateUrl(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      country: "",
      university: "",
      majorCategory: "",
      program: "",
      targetDegree: "",
    });
    // 修复 pathname 可能为 null 的问题
    router.push(pathname || "");
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium">筛选条件</h3>
          <InterviewAgentSearch />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            清空筛选
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Input
          placeholder="国家"
          value={filters.country}
          onChange={(e) => handleChange("country", e.target.value)}
          className={cn(
            "transition-all duration-200",
            filters.country && "bg-muted/50 hover:bg-muted focus:bg-background"
          )}
        />
        <Input
          placeholder="学校"
          value={filters.university}
          onChange={(e) => handleChange("university", e.target.value)}
          className={cn(
            "transition-all duration-200",
            filters.university &&
              "bg-muted/50 hover:bg-muted focus:bg-background"
          )}
        />
        <Input
          placeholder="专业类别"
          value={filters.majorCategory}
          onChange={(e) => handleChange("majorCategory", e.target.value)}
          className={cn(
            "transition-all duration-200",
            filters.majorCategory &&
              "bg-muted/50 hover:bg-muted focus:bg-background"
          )}
        />
        <Input
          placeholder="项目"
          value={filters.program}
          onChange={(e) => handleChange("program", e.target.value)}
          className={cn(
            "transition-all duration-200",
            filters.program && "bg-muted/50 hover:bg-muted focus:bg-background"
          )}
        />
        <Select
          value={filters.targetDegree}
          onValueChange={(value) => handleChange("targetDegree", value)}
        >
          <SelectTrigger
            className={cn(
              "transition-all duration-200",
              filters.targetDegree &&
                "bg-muted/50 hover:bg-muted focus:bg-background"
            )}
          >
            <SelectValue placeholder="学历项目" />
          </SelectTrigger>
          <SelectContent>
            {degreeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

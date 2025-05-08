"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/types/quiz";
import { Search, X, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface RandomQuestionFormProps {
  onSelect: (questions: Question[]) => void;
  excludeQuestionIds?: string[];
}

interface QuestionResponse {
  data: Array<{
    trainingTitle: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function RandomQuestionForm({
  onSelect,
  excludeQuestionIds = [],
}: RandomQuestionFormProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // 培训标题搜索和选择状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTrainings, setSelectedTrainings] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  // 题型数量状态
  const [counts, setCounts] = useState({
    single: 0,
    multiple: 0,
    boolean: 0,
    text: 0,
  });

  // 难度分布状态
  const [difficultyDistribution, setDifficultyDistribution] = useState({
    easy: 34,
    medium: 33,
    hard: 33,
  });

  // 可用题目统计
  const [stats, setStats] = useState({
    total: 0,
    byType: {
      single: 0,
      multiple: 0,
      boolean: 0,
      text: 0,
    },
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
  });

  // 添加允许使用可用题目的选项
  const [allowUseAvailable, setAllowUseAvailable] = useState(false);

  // 处理培训标题选择
  const handleTrainingSelect = (titles: string | string[]) => {
    if (Array.isArray(titles)) {
      // 处理多个标题
      const newTitles = [...new Set([...selectedTrainings, ...titles])];
      setSelectedTrainings(newTitles);
    } else {
      // 处理单个标题
      if (!selectedTrainings.includes(titles)) {
        setSelectedTrainings([...selectedTrainings, titles]);
      }
    }
  };

  // 处理移除培训标题
  const handleTrainingRemove = (title: string) => {
    setSelectedTrainings(selectedTrainings.filter((t) => t !== title));
  };

  // 修改难度分布变化的处理
  const handleDifficultyChange = (
    type: keyof typeof difficultyDistribution,
    value: number
  ) => {
    const newDistribution = { ...difficultyDistribution };
    newDistribution[type] = value;

    // 确保其他两个难度的总和为 100 - value
    const remainingTotal = 100 - value;
    const otherTypes = Object.keys(newDistribution).filter(
      (t) => t !== type
    ) as Array<keyof typeof difficultyDistribution>;

    // 保持其他两个难度的比例不变
    const currentOtherTotal = otherTypes.reduce(
      (sum, t) => sum + newDistribution[t],
      0
    );
    if (currentOtherTotal > 0) {
      otherTypes.forEach((t) => {
        newDistribution[t] = Math.round(
          (newDistribution[t] * remainingTotal) / currentOtherTotal
        );
      });
    } else {
      // 如果其他难度都为0，平均分配
      otherTypes.forEach((t) => {
        newDistribution[t] = Math.round(remainingTotal / otherTypes.length);
      });
    }

    // 处理舍入误差
    const total = Object.values(newDistribution).reduce((a, b) => a + b, 0);
    if (total !== 100) {
      const diff = 100 - total;
      newDistribution[otherTypes[0]] += diff;
    }

    setDifficultyDistribution(newDistribution);
  };

  // 验证题目数量是否足够
  const validateQuestionCounts = () => {
    const insufficientTypes = [];

    if (counts.single > stats.byType.single) {
      insufficientTypes.push(
        `单选题(需要${counts.single}题，可用${stats.byType.single}题)`
      );
    }

    if (counts.multiple > stats.byType.multiple) {
      insufficientTypes.push(
        `多选题(需要${counts.multiple}题，可用${stats.byType.multiple}题)`
      );
    }

    if (counts.boolean > stats.byType.boolean) {
      insufficientTypes.push(
        `判断题(需要${counts.boolean}题，可用${stats.byType.boolean}题)`
      );
    }

    if (counts.text > stats.byType.text) {
      insufficientTypes.push(
        `填空题(需要${counts.text}题，可用${stats.byType.text}题)`
      );
    }

    return insufficientTypes;
  };

  // 修改随机抽题的处理
  const handleRandomSelect = async () => {
    try {
      setError(null);

      // 验证题目数量是否足够
      const insufficientTypes = validateQuestionCounts();

      if (insufficientTypes.length > 0 && !allowUseAvailable) {
        setError(
          `题目数量不足：${insufficientTypes.join("、")}。请调整题目数量或启用"使用可用题目"选项。`
        );
        return;
      }

      const requestBody = {
        trainingTitles: selectedTrainings,
        counts,
        difficultyDistribution,
        excludeQuestionIds,
        allowUseAvailable, // 添加新参数
      };

      console.log("发送随机抽题请求:", requestBody);

      const response = await fetch("/api/questions/random", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("随机抽题响应:", result);

      if (!response.ok) {
        if (result.error === "可用题目数量不足") {
          setError(
            `题目数量不足：需要 ${result.required} 题，但只有 ${result.available} 题可用。请调整题目数量或启用"使用可用题目"选项。`
          );
        } else {
          setError(result.error || "随机抽题失败");
        }
        return;
      }

      // 如果题目数量不足但启用了使用可用题目选项，显示提示
      if (
        result.data.length < Object.values(counts).reduce((a, b) => a + b, 0)
      ) {
        toast({
          title: "提示",
          description: `已选择所有可用题目(${result.data.length}题)，少于请求的题目数量(${Object.values(counts).reduce((a, b) => a + b, 0)}题)`,
        });
      }

      onSelect(result.data);
    } catch (error) {
      console.error("随机抽题失败:", error);
      setError(error instanceof Error ? error.message : "随机抽题失败");
    }
  };

  // 加载题目统计信息
  useEffect(() => {
    async function loadStats() {
      if (selectedTrainings.length === 0) {
        setStats({
          total: 0,
          byType: { single: 0, multiple: 0, boolean: 0, text: 0 },
          byDifficulty: { easy: 0, medium: 0, hard: 0 },
        });
        return;
      }

      try {
        const response = await fetch("/api/questions/stats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trainingTitles: selectedTrainings,
            excludeQuestionIds,
          }),
        });

        if (!response.ok) {
          throw new Error("获取题目统计失败");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("获取题目统计失败:", error);
      }
    }

    loadStats();
  }, [selectedTrainings, excludeQuestionIds]);

  // 处理培训标题搜索
  useEffect(() => {
    async function searchTrainings() {
      if (!searchKeyword) {
        setSearchResults([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          trainingSearch: searchKeyword,
        });

        const response = await fetch(`/api/questions?${params}`);
        if (!response.ok) {
          throw new Error("搜索培训失败");
        }

        const result = (await response.json()) as QuestionResponse;
        console.log("API Response:", result);

        // 从返回的题目中提取不重复的培训标题
        const titles = [
          ...new Set(
            (result?.data || [])
              .map((q) => q.trainingTitle)
              .filter(
                (title): title is string =>
                  typeof title === "string" && title.length > 0
              )
          ),
        ];

        // 过滤掉已选择的培训标题
        const newTitles = titles.filter(
          (title) => !selectedTrainings.includes(title)
        );
        setSearchResults(newTitles);
      } catch (error) {
        console.error("搜索培训失败:", error);
        setSearchResults([]);
      }
    }

    const timer = setTimeout(searchTrainings, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, selectedTrainings]);

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (!searchKeyword || searchResults.length === 0) {
      return null;
    }

    // 过滤掉已选择的标题
    const availableTitles = searchResults.filter(
      (title) => !selectedTrainings.includes(title)
    );

    if (availableTitles.length === 0) {
      return (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
          <div className="p-4 text-sm text-muted-foreground text-center">
            没有更多可选的标题
          </div>
        </div>
      );
    }

    return (
      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
        <div className="p-2 space-y-1">
          {availableTitles.map((title) => (
            <div
              key={title}
              className="px-3 py-2 hover:bg-accent rounded-sm cursor-pointer flex items-center justify-between"
              onClick={() => handleTrainingSelect(title)}
            >
              <span>{title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTrainingSelect(title);
                }}
              >
                选择
              </Button>
            </div>
          ))}
          {availableTitles.length > 1 && (
            <div className="border-t mt-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleTrainingSelect(availableTitles)}
              >
                全部选择 ({availableTitles.length})
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 培训标题搜索和选择 */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label>搜索培训标题</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="输入培训标题搜索..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8"
              />
              {renderSearchResults()}
            </div>
          </div>
        </div>

        {selectedTrainings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTrainings.map((title) => (
              <Badge key={title} variant="secondary" className="gap-1">
                {title}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleTrainingRemove(title)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 题型数量设置 */}
      <div className="space-y-4">
        <Label>题型数量设置</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>单选题</Label>
            <Input
              type="number"
              min={0}
              value={counts.single}
              onChange={(e) =>
                setCounts({ ...counts, single: parseInt(e.target.value) || 0 })
              }
            />
            <div className="text-sm text-muted-foreground">
              可用：{stats.byType.single} 题
            </div>
          </div>
          <div className="space-y-2">
            <Label>多选题</Label>
            <Input
              type="number"
              min={0}
              value={counts.multiple}
              onChange={(e) =>
                setCounts({
                  ...counts,
                  multiple: parseInt(e.target.value) || 0,
                })
              }
            />
            <div className="text-sm text-muted-foreground">
              可用：{stats.byType.multiple} 题
            </div>
          </div>
          <div className="space-y-2">
            <Label>判断题</Label>
            <Input
              type="number"
              min={0}
              value={counts.boolean}
              onChange={(e) =>
                setCounts({ ...counts, boolean: parseInt(e.target.value) || 0 })
              }
            />
            <div className="text-sm text-muted-foreground">
              可用：{stats.byType.boolean} 题
            </div>
          </div>
          <div className="space-y-2">
            <Label>填空题</Label>
            <Input
              type="number"
              min={0}
              value={counts.text}
              onChange={(e) =>
                setCounts({ ...counts, text: parseInt(e.target.value) || 0 })
              }
            />
            <div className="text-sm text-muted-foreground">
              可用：{stats.byType.text} 题
            </div>
          </div>
        </div>
      </div>

      {/* 难度分布设置 */}
      <div className="space-y-4">
        <Label>难度分布设置</Label>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>简单题目</Label>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground">
                  {difficultyDistribution.easy}%
                </span>
                <span className="text-sm text-muted-foreground">
                  可用：{stats.byDifficulty.easy} 题
                </span>
              </div>
            </div>
            <Slider
              value={[difficultyDistribution.easy]}
              onValueChange={([value]: number[]) =>
                handleDifficultyChange("easy", value)
              }
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>中等题目</Label>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground">
                  {difficultyDistribution.medium}%
                </span>
                <span className="text-sm text-muted-foreground">
                  可用：{stats.byDifficulty.medium} 题
                </span>
              </div>
            </div>
            <Slider
              value={[difficultyDistribution.medium]}
              onValueChange={([value]: number[]) =>
                handleDifficultyChange("medium", value)
              }
              max={100}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>困难题目</Label>
              <div className="space-x-2">
                <span className="text-sm text-muted-foreground">
                  {difficultyDistribution.hard}%
                </span>
                <span className="text-sm text-muted-foreground">
                  可用：{stats.byDifficulty.hard} 题
                </span>
              </div>
            </div>
            <Slider
              value={[difficultyDistribution.hard]}
              onValueChange={([value]: number[]) =>
                handleDifficultyChange("hard", value)
              }
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* 添加使用可用题目选项 */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="allowUseAvailable"
          checked={allowUseAvailable}
          onChange={(e) => setAllowUseAvailable(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="allowUseAvailable" className="text-sm font-normal">
          题目数量不足时使用可用题目（可能导致题型分布与设置不符）
        </Label>
      </div>

      {/* 随机抽题按钮 */}
      <Button
        className="w-full"
        onClick={handleRandomSelect}
        disabled={
          selectedTrainings.length === 0 ||
          Object.values(counts).every((v) => v === 0) ||
          Object.values(difficultyDistribution).reduce((a, b) => a + b, 0) !==
            100
        }
      >
        随机抽题
      </Button>
    </div>
  );
}

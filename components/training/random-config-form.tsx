"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface RandomConfig {
  enabled: boolean;
  questionCount: number;
  typeDistribution: {
    single: number;
    multiple: number;
    boolean: number;
    text: number;
  };
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

interface RandomConfigFormProps {
  value: RandomConfig;
  onChange: (config: RandomConfig) => void;
  className?: string;
}

export function RandomConfigForm({
  value,
  onChange,
  className = "",
}: RandomConfigFormProps) {
  // 处理启用/禁用随机选题
  const handleEnableChange = (enabled: boolean) => {
    onChange({
      ...value,
      enabled,
    });
  };

  // 处理题目数量变化
  const handleQuestionCountChange = (count: string) => {
    onChange({
      ...value,
      questionCount: parseInt(count) || 0,
    });
  };

  // 处理题型分布变化
  const handleTypeDistributionChange = (
    type: keyof typeof value.typeDistribution,
    percent: string
  ) => {
    onChange({
      ...value,
      typeDistribution: {
        ...value.typeDistribution,
        [type]: parseInt(percent) || 0,
      },
    });
  };

  // 处理难度分布变化
  const handleDifficultyDistributionChange = (
    difficulty: keyof typeof value.difficultyDistribution,
    percent: string
  ) => {
    onChange({
      ...value,
      difficultyDistribution: {
        ...value.difficultyDistribution,
        [difficulty]: parseInt(percent) || 0,
      },
    });
  };

  // 计算总百分比
  const typeTotal = Object.values(value.typeDistribution).reduce(
    (a, b) => a + b,
    0
  );
  const difficultyTotal = Object.values(value.difficultyDistribution).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="random-enable">启用随机选题</Label>
          <Switch
            id="random-enable"
            checked={value.enabled}
            onCheckedChange={handleEnableChange}
          />
        </div>

        {value.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="question-count">随机选择题目数量</Label>
              <Input
                id="question-count"
                type="number"
                min="1"
                value={value.questionCount}
                onChange={(e) => handleQuestionCountChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>题型分布 (总和需为100%)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="type-single">单选题 (%)</Label>
                  <Input
                    id="type-single"
                    type="number"
                    min="0"
                    max="100"
                    value={value.typeDistribution.single}
                    onChange={(e) =>
                      handleTypeDistributionChange("single", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type-multiple">多选题 (%)</Label>
                  <Input
                    id="type-multiple"
                    type="number"
                    min="0"
                    max="100"
                    value={value.typeDistribution.multiple}
                    onChange={(e) =>
                      handleTypeDistributionChange("multiple", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type-boolean">判断题 (%)</Label>
                  <Input
                    id="type-boolean"
                    type="number"
                    min="0"
                    max="100"
                    value={value.typeDistribution.boolean}
                    onChange={(e) =>
                      handleTypeDistributionChange("boolean", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type-text">简答题 (%)</Label>
                  <Input
                    id="type-text"
                    type="number"
                    min="0"
                    max="100"
                    value={value.typeDistribution.text}
                    onChange={(e) =>
                      handleTypeDistributionChange("text", e.target.value)
                    }
                  />
                </div>
              </div>
              {typeTotal !== 100 && (
                <p className="text-sm text-red-500">
                  题型分布总和需为100%，当前为{typeTotal}%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>难度分布 (总和需为100%)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="difficulty-easy">简单 (%)</Label>
                  <Input
                    id="difficulty-easy"
                    type="number"
                    min="0"
                    max="100"
                    value={value.difficultyDistribution.easy}
                    onChange={(e) =>
                      handleDifficultyDistributionChange("easy", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty-medium">中等 (%)</Label>
                  <Input
                    id="difficulty-medium"
                    type="number"
                    min="0"
                    max="100"
                    value={value.difficultyDistribution.medium}
                    onChange={(e) =>
                      handleDifficultyDistributionChange(
                        "medium",
                        e.target.value
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty-hard">困难 (%)</Label>
                  <Input
                    id="difficulty-hard"
                    type="number"
                    min="0"
                    max="100"
                    value={value.difficultyDistribution.hard}
                    onChange={(e) =>
                      handleDifficultyDistributionChange("hard", e.target.value)
                    }
                  />
                </div>
              </div>
              {difficultyTotal !== 100 && (
                <p className="text-sm text-red-500">
                  难度分布总和需为100%，当前为{difficultyTotal}%
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

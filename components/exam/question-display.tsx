"use client";

import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExamQuestion } from "@/types/exam";
import { logger } from "@/lib/logger";
import { Check } from "lucide-react";

interface QuestionDisplayProps {
  question: ExamQuestion;
  answer: string;
  onAnswerChange: (answer: string) => void;
}

interface QuestionOption {
  value: string;
  label: string;
}

export function QuestionDisplay({
  question,
  answer,
  onAnswerChange,
}: QuestionDisplayProps) {
  const { type, content, options: rawOptions } = question.question;

  // 处理选项数据
  let options: QuestionOption[] = [];

  if (rawOptions) {
    try {
      // 如果是字符串，尝试解析 JSON
      if (typeof rawOptions === "string") {
        const parsed = JSON.parse(rawOptions);
        if (Array.isArray(parsed)) {
          options = parsed.map((opt: any) => {
            if (typeof opt === "object" && opt !== null) {
              return {
                value: String(opt.value || ""),
                label: String(opt.label || ""),
              };
            }
            return {
              value: String(opt),
              label: String(opt),
            };
          });
        }
      }
      // 如果是数组，直接处理
      else if (Array.isArray(rawOptions)) {
        options = rawOptions.map((opt: any) => {
          if (typeof opt === "object" && opt !== null) {
            return {
              value: String(opt.value || ""),
              label: String(opt.label || ""),
            };
          }
          return {
            value: String(opt),
            label: String(opt),
          };
        });
      }
      // 如果是对象，转换为数组
      else if (typeof rawOptions === "object" && rawOptions !== null) {
        options = Object.entries(rawOptions).map(([key, value]) => ({
          value: key,
          label: String(value),
        }));
      }
    } catch (error) {
      console.error("处理选项数据时出错:", error);
      options = [];
    }
  }

  logger.debug("题目信息", {
    module: "QUESTION",
    data: {
      type,
      options,
    },
  });

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* 题目分数和序号 */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>第 {question.order} 题</span>
        <span>{question.score} 分</span>
      </div>

      {/* 题目内容 */}
      <div className="space-y-4">
        <div className="text-lg font-medium">{content}</div>

        {/* 单选题 */}
        {type === "single" && options && options.length > 0 && (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-2">
              {options.map((option, index) => {
                const optionValue = String.fromCharCode(65 + index);
                const isSelected = answer === optionValue;
                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border border-primary shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => onAnswerChange(optionValue)}
                  >
                    <RadioGroupItem
                      value={optionValue}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {optionValue}. {option.label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        )}

        {/* 多选题 */}
        {type === "multiple" && options && options.length > 0 && (
          <div className="space-y-2">
            {options.map((option, index) => {
              const optionValue = String.fromCharCode(65 + index);
              const isSelected = answer.includes(optionValue);

              // 处理选择状态变化
              const toggleSelection = (
                e: React.MouseEvent | React.ChangeEvent | React.KeyboardEvent
              ) => {
                // 阻止默认行为和事件冒泡
                e.preventDefault();
                e.stopPropagation();

                // 更新答案
                const newAnswer = isSelected
                  ? answer.replace(optionValue, "")
                  : answer + optionValue;

                // 排序并提交
                onAnswerChange(newAnswer.split("").sort().join(""));
              };

              return (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border border-primary shadow-sm"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                  onClick={toggleSelection}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      toggleSelection(e);
                    }
                  }}
                >
                  <div
                    className="h-4 w-4 rounded border border-primary flex items-center justify-center bg-white shrink-0"
                    style={{ borderWidth: isSelected ? "2px" : "1px" }}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                    )}
                  </div>
                  <Label className="flex-1 cursor-pointer">
                    {optionValue}. {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
        )}

        {/* 判断题 */}
        {type === "boolean" && (
          <RadioGroup value={answer} onValueChange={onAnswerChange}>
            <div className="space-y-2">
              <div
                className={`flex items-center space-x-2 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                  answer === "true"
                    ? "bg-primary/10 border border-primary shadow-sm"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
                onClick={() => onAnswerChange("true")}
              >
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="flex-1 cursor-pointer">
                  正确
                </Label>
              </div>
              <div
                className={`flex items-center space-x-2 p-3 rounded-md transition-all duration-200 cursor-pointer ${
                  answer === "false"
                    ? "bg-primary/10 border border-primary shadow-sm"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
                onClick={() => onAnswerChange("false")}
              >
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="flex-1 cursor-pointer">
                  错误
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}

        {/* 简答题 */}
        {type === "text" && (
          <Textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="请输入你的答案..."
            className="min-h-[150px]"
          />
        )}
      </div>
    </Card>
  );
}

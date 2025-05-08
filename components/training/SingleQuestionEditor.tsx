"use client";

import { Question } from "@/types/quiz";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface SingleQuestionEditorProps {
  value: Omit<Question, "answer"> & { answer: string };
  onChange: (value: Question) => void;
  hideScore?: boolean;
}

interface Option {
  value: string;
  label: string;
}

export function SingleQuestionEditor({
  value,
  onChange,
  hideScore = false,
}: SingleQuestionEditorProps) {
  // 验证题目内容
  const hasError = !value.content || !value.answer;

  // 解析选项
  const parseOptions = (options: string[] | string | undefined): Option[] => {
    if (!options) return [];

    // 如果 options 是字符串，尝试解析 JSON
    if (typeof options === "string") {
      try {
        const parsedOptions = JSON.parse(options);
        if (Array.isArray(parsedOptions)) {
          // 如果数组元素是对象，说明是value/label格式
          if (typeof parsedOptions[0] === "object") {
            return parsedOptions.map(
              (opt: { value?: string; label?: string }) => ({
                value: String(opt.value || ""),
                label: String(opt.label || ""),
              })
            );
          }
          // 如果是简单数组，将数组元素作为label
          return parsedOptions.map((opt: string, index) => ({
            value: String.fromCharCode(65 + index),
            label: opt,
          }));
        }
      } catch {
        return [];
      }
    }

    // 如果是数组，直接处理
    if (Array.isArray(options)) {
      return options.map((opt, index) => {
        if (typeof opt === "object" && opt !== null) {
          const typedOpt = opt as { value?: string; label?: string };
          return {
            value: String(typedOpt.value || ""),
            label: String(typedOpt.label || ""),
          };
        }
        return {
          value: String.fromCharCode(65 + index),
          label: String(opt),
        };
      });
    }

    return [];
  };

  // 将选项转换为字符串数组
  const stringifyOptions = (options: Option[]): string[] => {
    return options.map((opt) => opt.label);
  };

  const options = parseOptions(value.options);

  // 添加选项
  const addOption = () => {
    const newOptions = [
      ...options,
      {
        value: String.fromCharCode(65 + options.length),
        label: "",
      },
    ];
    onChange({
      ...value,
      options: stringifyOptions(newOptions),
    });
  };

  // 删除选项
  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    // 如果删除的是当前选中的选项，清空答案
    if (options[index].value === value.answer) {
      onChange({
        ...value,
        options: stringifyOptions(newOptions),
        answer: "",
      });
    } else {
      onChange({
        ...value,
        options: stringifyOptions(newOptions),
      });
    }
  };

  // 更新选项
  const updateOption = (index: number, newLabel: string) => {
    const newOptions = [...options];
    newOptions[index] = {
      value: String.fromCharCode(65 + index),
      label: newLabel,
    };
    onChange({
      ...value,
      options: stringifyOptions(newOptions),
    });
  };

  // 选择正确答案
  const handleSelectAnswer = (optionValue: string) => {
    onChange({
      ...value,
      answer: optionValue,
    });
  };

  return (
    <>
      {/* 题目内容 */}
      <TableCell className="align-top py-2">
        <Textarea
          placeholder="请输入题目内容"
          value={value.content}
          onChange={(e) => onChange({ ...value, content: e.target.value })}
          className={cn(
            "resize-none min-h-[40px] overflow-hidden",
            !value.content && "border-red-500"
          )}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
      </TableCell>

      {/* 答案解析 */}
      <TableCell className="align-top py-2">
        <Textarea
          placeholder="请输入答案解析（可选）"
          value={value.explanation || ""}
          onChange={(e) => onChange({ ...value, explanation: e.target.value })}
          className="resize-none min-h-[40px] overflow-hidden"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${target.scrollHeight}px`;
          }}
        />
      </TableCell>

      {/* 选项和答案 */}
      <TableCell className="py-2">
        <div className="space-y-2">
          <RadioGroup
            value={value.answer}
            onValueChange={handleSelectAnswer}
            className="space-y-2"
          >
            {options.map((option, index) => (
              <div key={option.value} className="flex items-center gap-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 h-[32px]"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </RadioGroup>
          <Button
            variant="outline"
            size="sm"
            onClick={addOption}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加选项
          </Button>
        </div>
      </TableCell>

      {/* 分值 */}
      {!hideScore && (
        <TableCell className="py-2">
          <div className="w-full px-4">
            <Input
              type="number"
              min={1}
              max={100}
              value={value.score}
              onChange={(e) =>
                onChange({ ...value, score: parseInt(e.target.value) })
              }
              className={cn(
                "h-[40px] text-center text-lg font-medium",
                value.score < 1 && "border-red-500"
              )}
            />
          </div>
        </TableCell>
      )}
    </>
  );
}

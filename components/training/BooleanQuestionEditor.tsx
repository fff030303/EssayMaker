"use client";

import { Question } from "@/types/quiz";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";

interface BooleanQuestionEditorProps {
  value: Omit<Question, "answer"> & { answer: string };
  onChange: (value: Question) => void;
  hideScore?: boolean;
}

export function BooleanQuestionEditor({
  value,
  onChange,
  hideScore = false,
}: BooleanQuestionEditorProps) {
  // 验证题目内容
  const hasError = !value.content || !value.answer;

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

      {/* 正确答案 */}
      <TableCell className="text-center align-middle py-2">
        <RadioGroup
          value={value.answer}
          onValueChange={(v) => onChange({ ...value, answer: v })}
          className="flex justify-center gap-8"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="true" id={`true-${value.id}`} />
            <Label htmlFor={`true-${value.id}`}>对</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="false" id={`false-${value.id}`} />
            <Label htmlFor={`false-${value.id}`}>错</Label>
          </div>
        </RadioGroup>
      </TableCell>

      {/* 分数 */}
      {!hideScore && (
        <TableCell className="text-center align-middle py-2">
          <Input
            type="number"
            min={1}
            max={100}
            value={value.score || ""}
            onChange={(e) =>
              onChange({ ...value, score: parseInt(e.target.value) })
            }
            className="w-20 text-center"
          />
        </TableCell>
      )}
    </>
  );
}

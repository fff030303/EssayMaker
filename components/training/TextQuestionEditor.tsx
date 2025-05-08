"use client";

import { Question } from "@/types/quiz";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";

interface TextQuestionEditorProps {
  value: Question;
  onChange: (value: Question) => void;
  hideScore?: boolean;
}

export function TextQuestionEditor({
  value,
  onChange,
  hideScore = false,
}: TextQuestionEditorProps) {
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
      <TableCell className="py-2">
        <Input
          placeholder="请输入正确答案"
          value={value.answer}
          onChange={(e) => onChange({ ...value, answer: e.target.value })}
          className={cn("h-[40px]", !value.answer && "border-red-500")}
        />
      </TableCell>
    </>
  );
}

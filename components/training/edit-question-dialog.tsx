"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question, QuestionInput, QuestionDifficulty } from "@/types/quiz";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  question: Question | null;
  onSaved: () => void;
  mode?: "edit" | "create";
}

interface FormData extends Omit<QuestionInput, "options"> {
  options?: string;
  id: string;
}

const defaultFormData: FormData = {
  id: "",
  content: "",
  type: "text",
  answer: "",
  options: undefined,
  explanation: "",
  score: 1,
  difficulty: "easy",
};

export function EditQuestionDialog({
  open,
  onClose,
  question,
  onSaved,
  mode = "create",
}: EditQuestionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // 当题目数据变化时更新表单
  useEffect(() => {
    if (question && mode === "edit") {
      setFormData({
        id: question.id,
        content: question.content,
        type: question.type,
        answer: Array.isArray(question.answer)
          ? question.answer.join(",")
          : question.answer,
        options: Array.isArray(question.options)
          ? JSON.stringify(question.options)
          : question.options,
        explanation: question.explanation || "",
        score: question.score,
        difficulty: question.difficulty || "easy",
        trainingTitle: question.trainingTitle,
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [question, mode]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        mode === "edit" ? `/api/questions/${question?.id}` : "/api/questions",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      toast({
        title: "保存成功",
        description: mode === "edit" ? "题目已更新" : "题目已创建",
      });

      onSaved();
      onClose();
    } catch (error) {
      console.error("保存题目失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description:
          error instanceof Error ? error.message : "保存题目失败，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理选项变更
  const handleOptionsChange = (index: number, value: string) => {
    if (!formData.options) return;

    try {
      const options = JSON.parse(formData.options);
      options[index].label = value;
      setFormData({
        ...formData,
        options: JSON.stringify(options),
      });
    } catch (error) {
      console.error("解析选项失败:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{mode === "edit" ? "编辑题目" : "新建题目"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-6">
            {/* 题目类型和难度 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>题目类型</Label>
                {mode === "edit" ? (
                  <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted flex items-center text-muted-foreground">
                    {formData.type === "single" && "单选题"}
                    {formData.type === "multiple" && "多选题"}
                    {formData.type === "boolean" && "判断题"}
                    {formData.type === "text" && "填空题"}
                  </div>
                ) : (
                  <Select
                    value={formData.type}
                    onValueChange={(
                      value: "text" | "boolean" | "single" | "multiple"
                    ) => {
                      setFormData({
                        ...formData,
                        type: value,
                        answer: "",
                        options:
                          value === "single" || value === "multiple"
                            ? JSON.stringify([
                                { value: "A", label: "选项 A" },
                                { value: "B", label: "选项 B" },
                                { value: "C", label: "选项 C" },
                                { value: "D", label: "选项 D" },
                              ])
                            : undefined,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择题目类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">单选题</SelectItem>
                      <SelectItem value="multiple">多选题</SelectItem>
                      <SelectItem value="boolean">判断题</SelectItem>
                      <SelectItem value="text">填空题</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>难度</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      difficulty: value as QuestionDifficulty,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择难度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">简单</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="hard">困难</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 分值和培训标题 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分值</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.score}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      score: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>培训标题</Label>
                <Input
                  value={formData.trainingTitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, trainingTitle: e.target.value })
                  }
                  placeholder="请输入关联的培训标题（选填）"
                />
              </div>
            </div>

            {/* 题目内容 */}
            <div className="space-y-2">
              <Label>题目内容</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="请输入题目内容"
                className="min-h-[100px]"
              />
            </div>

            {/* 选项（仅单选和多选题显示） */}
            {(formData.type === "single" || formData.type === "multiple") &&
              formData.options && (
                <div className="space-y-2">
                  <Label>选项</Label>
                  <div className="space-y-2">
                    {JSON.parse(formData.options).map(
                      (
                        option: { value: string; label: string },
                        index: number
                      ) => (
                        <div
                          key={option.value}
                          className="flex gap-2 items-center"
                        >
                          <div className="w-8 text-center">{option.value}</div>
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              handleOptionsChange(index, e.target.value)
                            }
                            placeholder={`选项 ${option.value}`}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* 答案 */}
            <div className="space-y-2">
              <Label>答案</Label>
              {formData.type === "boolean" ? (
                <Select
                  value={formData.answer}
                  onValueChange={(value) =>
                    setFormData({ ...formData, answer: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择答案" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">正确</SelectItem>
                    <SelectItem value="false">错误</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.answer}
                  onChange={(e) =>
                    setFormData({ ...formData, answer: e.target.value })
                  }
                  placeholder={
                    formData.type === "multiple"
                      ? "多选题答案直接输入选项，如: ABC"
                      : "请输入答案"
                  }
                />
              )}
            </div>

            {/* 解释 */}
            <div className="space-y-2">
              <Label>解释</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="请输入答案解释（选填）"
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

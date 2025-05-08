"use client";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { QuestionForm } from "./question-form";
import { Quiz, QuestionInput, QuestionDifficulty } from "@/types/quiz";

interface QuizFormProps {
  open: boolean;
  quiz?: Quiz;
  onClose: () => void;
  trainingId?: string;
  onSaved?: () => void;
}

export function QuizForm({
  open,
  quiz,
  onClose,
  trainingId,
  onSaved,
}: QuizFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(30);
  const [passingScore, setPassingScore] = useState<number>(60);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      setTimeLimit(quiz.timeLimit);
      setPassingScore(quiz.passingScore);
      setQuestions(
        quiz.questions?.map((q) => ({
          id: crypto.randomUUID(),
          content: q.question?.content || "",
          type: q.question?.type || "single",
          answer: Array.isArray(q.question?.answer)
            ? q.question.answer.join(",")
            : q.question?.answer || "",
          explanation: q.question?.explanation || "",
          score: q.question?.score || 10,
          difficulty:
            q.question?.difficulty || ("medium" as QuestionDifficulty),
        })) || []
      );
    } else {
      setTitle("");
      setDescription("");
      setTimeLimit(30);
      setPassingScore(60);
      setQuestions([]);
    }
  }, [quiz, open]);

  const handleSubmit = async () => {
    if (!title) {
      alert("请输入考试标题");
      return;
    }

    if (questions.length === 0) {
      alert("请至少添加一个题目");
      return;
    }

    if (!quiz?.id && !trainingId) {
      alert("缺少培训ID");
      return;
    }

    try {
      setLoading(true);
      const url = quiz ? "/api/quiz" : "/api/quiz";
      const method = quiz ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: quiz?.id,
          title,
          description,
          timeLimit,
          passingScore,
          questions,
          trainingId: quiz?.id ? undefined : trainingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      onClose();
      onSaved?.();
    } catch (error) {
      console.error("保存考试失败:", error);
      alert(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{quiz ? "编辑考试" : "创建考试"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(90vh-8rem)]">
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-6">
              <div className="grid gap-2">
                <Label htmlFor="title">考试标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入考试标题"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">考试描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入考试描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timeLimit">时间限制（分钟）</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    min={1}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="passingScore">通过分数</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>题目列表</Label>
                <QuestionForm
                  questions={questions}
                  onChange={setQuestions}
                  quizTitle={title}
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t bg-background">
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

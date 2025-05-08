"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { Exam, ExamAnswerInput } from "@/types/exam";
import { Question } from "@/types/quiz";

interface ExamViewProps {
  examId: string;
  type: "writer" | "consultant";
}

export function ExamView({ examId, type }: ExamViewProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // 加载考试数据
  useEffect(() => {
    const loadExam = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}`);
        if (!response.ok) {
          throw new Error("加载考试数据失败");
        }
        const data = await response.json();
        setExam(data);

        // 新考试，设置考试时间
        setTimeRemaining(data.timeLimit * 60);
        setAnswers({}); // 清空答案

        setLoading(false);
      } catch (error) {
        console.error("加载考试数据失败:", error);
        toast({
          variant: "destructive",
          title: "加载失败",
          description: "获取考试数据失败，请刷新页面重试",
        });
      }
    };

    loadExam();
  }, [examId, toast]);

  // 倒计时
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // 自动保存答案
  const saveAnswers = useCallback(async () => {
    if (!exam) return;

    try {
      const response = await fetch(`/api/exams/${examId}/answers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("保存答案失败");
      }
    } catch (error) {
      console.error("保存答案失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "答案保存失败，请检查网络连接",
      });
    }
  }, [examId, answers, exam, toast]);

  // 定期自动保存
  useEffect(() => {
    const saveInterval = setInterval(saveAnswers, 30000); // 每30秒保存一次
    return () => clearInterval(saveInterval);
  }, [saveAnswers]);

  // 时间到自动提交
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  // 提交考试
  const handleSubmit = async () => {
    if (!exam || submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("提交考试失败");
      }

      // 跳转到结果页面
      router.push(
        `/training${type === "consultant" ? "-consultant" : ""}/exams/${examId}/result`
      );
    } catch (error) {
      console.error("提交考试失败:", error);
      toast({
        variant: "destructive",
        title: "提交失败",
        description: "提交考试失败，请重试",
      });
      setSubmitting(false);
    }
  };

  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;

  return (
    <div className="space-y-4 max-w-4xl mx-auto p-4">
      {/* 考试信息 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5" />
          <span className="font-medium">
            剩余时间：
            {timeRemaining !== null
              ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, "0")}`
              : "--:--"}
          </span>
        </div>
      </div>

      {/* 题目导航 */}
      <div className="flex gap-2 overflow-x-auto py-2">
        {exam.questions.map((q, index) => (
          <Button
            key={q.questionId}
            variant={
              index === currentQuestionIndex
                ? "default"
                : answers[q.questionId]
                  ? "secondary"
                  : "outline"
            }
            size="sm"
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      {/* 当前题目 */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              第 {currentQuestionIndex + 1} 题（{currentQuestion.score}分）
            </h3>
          </div>

          <div className="space-y-4">
            <p>{currentQuestion.question.content}</p>

            {/* 选项 */}
            {currentQuestion.question.type === "single" &&
              currentQuestion.question.options && (
                <div className="space-y-2">
                  {currentQuestion.question.options.map((option, index) => {
                    const key = String.fromCharCode(65 + index); // 将索引转换为 A, B, C...
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                          answers[currentQuestion.questionId] === key
                            ? "border-primary"
                            : ""
                        }`}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [currentQuestion.questionId]: key,
                          }))
                        }
                      >
                        {key}. {option}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() =>
            setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
          }
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          上一题
        </Button>

        {isLastQuestion ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>提交考试</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认提交考试？</AlertDialogTitle>
                <AlertDialogDescription>
                  提交后将无法修改答案。请确认所有题目都已完成。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
                  确认提交
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            onClick={() =>
              setCurrentQuestionIndex((prev) =>
                Math.min(exam.questions.length - 1, prev + 1)
              )
            }
          >
            下一题
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

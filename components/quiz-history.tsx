"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizHistoryProps {
  quizId?: string;
  onClose?: () => void;
}

interface QuizAttempt {
  id: string;
  startTime: string;
  endTime: string;
  totalScore: number;
  passed: boolean;
  quiz: {
    title: string;
    passingScore: number;
  };
  answers: Array<{
    id: string;
    answer: string;
    isCorrect: boolean;
    score: number;
    question: {
      content: string;
      answer: string;
      explanation?: string;
      score: number;
      options?: string;
    };
  }>;
}

export function QuizHistory({ quizId, onClose }: QuizHistoryProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 解析选项函数
  const parseOptions = (options: string | null | undefined): string[] => {
    if (!options) return [];

    try {
      // 判断是否已经是数组
      if (Array.isArray(options)) {
        return options;
      }

      const parsedOptions = JSON.parse(options);
      if (Array.isArray(parsedOptions)) {
        // 如果数组元素是对象，说明是value/label格式
        if (typeof parsedOptions[0] === "object") {
          return parsedOptions.map(
            (opt: { value?: string; label?: string }) => opt.label || ""
          );
        }
        // 如果是简单数组，直接返回数组元素
        return parsedOptions.map((opt: string) => opt);
      }
      return [];
    } catch (e) {
      console.error("解析选项失败:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        const url = `/api/quiz/attempt${quizId ? `?quizId=${quizId}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "获取考试记录失败");
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (!Array.isArray(data?.data)) {
          console.error("Invalid data format:", data);
          throw new Error("数据格式错误");
        }
        setAttempts(data.data);
      } catch (error) {
        console.error("获取考试记录失败:", error);
        setError(error instanceof Error ? error.message : "获取考试记录失败");
        setAttempts([]); // 确保在错误时 attempts 是空数组
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [quizId]);

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000); // 秒
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}分${seconds}秒`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="text-muted-foreground">暂无考试记录</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">考试历史记录</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            返回
          </Button>
        )}
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {attempt.quiz.title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDateTime(attempt.startTime)}
                    </div>
                  </div>
                  <Badge
                    variant={attempt.passed ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {attempt.passed ? "通过" : "未通过"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">用时:</span>
                      <span>
                        {calculateDuration(attempt.startTime, attempt.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">得分:</span>
                      <span
                        className={cn(
                          "font-medium",
                          attempt.passed ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {attempt.totalScore} / {attempt.quiz.passingScore}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">答题详情</div>
                    <div className="space-y-2">
                      {attempt.answers.map((answer, index) => (
                        <div
                          key={answer.id}
                          className={cn(
                            "p-3 rounded-lg text-sm",
                            answer.isCorrect ? "bg-green-50" : "bg-red-50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium mb-1">
                                <span className="inline-block mr-2 px-2 py-0.5 bg-zinc-200 text-zinc-800 rounded-md text-xs font-bold">
                                  题 {index + 1}
                                </span>
                                {answer.question.content}
                              </div>
                              <div className="space-y-2">
                                {/* 显示选项内容 */}
                                {answer.question.options && (
                                  <div className="mt-2 space-y-1.5 rounded-md bg-zinc-50 p-3">
                                    <div className="text-sm font-medium text-zinc-700">
                                      选项内容：
                                    </div>
                                    {parseOptions(answer.question.options).map(
                                      (option, index) => {
                                        const optionLetter =
                                          String.fromCharCode(65 + index); // A, B, C, D...
                                        // 检查用户答案是否包含当前选项字母
                                        const isUserAnswer = answer.answer
                                          ? answer.answer.indexOf(
                                              optionLetter
                                            ) >= 0
                                          : false;
                                        // 检查正确答案是否包含当前选项字母
                                        const isCorrectAnswer = answer.question
                                          .answer
                                          ? answer.question.answer.indexOf(
                                              optionLetter
                                            ) >= 0
                                          : false;

                                        return (
                                          <div
                                            key={index}
                                            className={cn(
                                              "flex gap-2 p-1.5 rounded",
                                              isUserAnswer &&
                                                isCorrectAnswer &&
                                                "bg-green-100",
                                              isUserAnswer &&
                                                !isCorrectAnswer &&
                                                "bg-red-100",
                                              !isUserAnswer &&
                                                isCorrectAnswer &&
                                                "bg-green-50"
                                            )}
                                          >
                                            <div
                                              className={cn(
                                                "flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium",
                                                isUserAnswer &&
                                                  isCorrectAnswer &&
                                                  "bg-green-500 text-white",
                                                isUserAnswer &&
                                                  !isCorrectAnswer &&
                                                  "bg-red-500 text-white",
                                                !isUserAnswer &&
                                                  isCorrectAnswer &&
                                                  "bg-green-500 text-white",
                                                !isUserAnswer &&
                                                  !isCorrectAnswer &&
                                                  "bg-zinc-200 text-zinc-700"
                                              )}
                                            >
                                              {optionLetter}
                                            </div>
                                            <div className="text-sm">
                                              {option}
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    你的答案:
                                  </span>
                                  <span
                                    className={cn(
                                      answer.isCorrect
                                        ? "text-green-600"
                                        : "text-red-600",
                                      "font-medium"
                                    )}
                                  >
                                    {answer.answer || "(未作答)"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    正确答案:
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    {answer.question.answer}
                                  </span>
                                </div>
                                {answer.question.explanation && (
                                  <div className="mt-2 text-muted-foreground">
                                    <span className="font-medium">解析: </span>
                                    {answer.question.explanation}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div
                              className={cn(
                                "font-medium",
                                answer.isCorrect
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {answer.score} / {answer.question.score}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

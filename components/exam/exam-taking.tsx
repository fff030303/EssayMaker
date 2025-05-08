"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExamTimer } from "./exam-timer";
import { QuestionDisplay } from "./question-display";
import { Exam, ExamQuestion } from "@/types/exam";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface ExamTakingProps {
  examId: string;
  type?: "writer" | "consultant";
}

export function ExamTaking({ examId, type = "writer" }: ExamTakingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [incompleteTips, setIncompleteTips] = useState<{
    show: boolean;
    message: string;
    incompleteQuestions: number[];
  }>({
    show: false,
    message: "",
    incompleteQuestions: [],
  });
  const { toast } = useToast();

  // 从 URL 获取 attemptId 并加载考试数据
  useEffect(() => {
    const loadExam = async () => {
      try {
        // 从 URL 获取 attemptId
        const params = new URLSearchParams(window.location.search);
        const id = params.get("attemptId");
        console.log("从 URL 获取 attemptId", {
          search: window.location.search,
          params: Object.fromEntries(params.entries()),
          attemptId: id,
        });

        if (!id) {
          console.log("未找到考试记录ID,无法加载题目");
          setError("考试记录不存在");
          setLoading(false);
          return;
        }

        // 设置 attemptId
        setAttemptId(id);

        console.log("开始加载考试数据", { examId, attemptId: id });

        // 从考试记录获取题目
        const response = await fetch(`/api/exam-attempts/${id}`);
        const data = await response.json();

        console.log("考试数据加载结果", {
          status: response.status,
          ok: response.ok,
          data,
        });

        if (!response.ok) {
          throw new Error(data.error || "加载考试失败");
        }

        // 记录题目顺序，便于调试
        if (data.questions && data.questions.length > 0) {
          console.log(
            "加载到的题目顺序:",
            data.questions.map((q: ExamQuestion, idx: number) => ({
              index: idx + 1,
              id: q.questionId,
              type: q.question.type,
            }))
          );
        }

        setExam(data);
        setCurrentQuestionIndex(0); // 确保从第一题开始
      } catch (error) {
        console.error("加载考试失败:", error);
        setError(error instanceof Error ? error.message : "加载考试失败");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]); // 只依赖 examId

  // 自动保存答案
  useEffect(() => {
    const saveAnswers = async () => {
      if (!attemptId || Object.keys(answers).length === 0) {
        console.log("跳过自动保存", {
          attemptId,
          answersCount: Object.keys(answers).length,
        });
        return;
      }

      try {
        console.log("开始自动保存答案", {
          attemptId,
          answersCount: Object.keys(answers).length,
          answers,
        });

        const response = await fetch(`/api/exam-attempts/${attemptId}/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers }),
        });

        const result = await response.json();
        console.log("自动保存结果", {
          status: response.status,
          ok: response.ok,
          result,
        });

        if (!response.ok) {
          throw new Error(result.error || "自动保存失败");
        }
      } catch (error) {
        console.error("自动保存失败:", error);
      }
    };

    const timer = setInterval(saveAnswers, 30000); // 每30秒自动保存一次
    return () => clearInterval(timer);
  }, [attemptId, answers]);

  // 处理答案变更
  const handleAnswerChange = (questionId: string, answer: string) => {
    // 保存答案到状态
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // 自动前进到下一题的功能已被移除
    // 现在用户需要手动点击"下一题"按钮来前进
  };

  // 提交考试
  const handleSubmit = async () => {
    if (!attemptId) {
      console.log("提交考试失败: attemptId 不存在", {
        examId,
        attemptId,
        answers,
      });
      setError("考试记录不存在");
      return;
    }

    // 检查是否有未完成的题目
    if (exam) {
      const incompleteQuestions: number[] = [];

      exam.questions.forEach((question, index) => {
        const questionId = question.questionId;
        const answer = answers[questionId];

        // 检查答案是否存在且非空
        if (!answer || answer.trim() === "") {
          incompleteQuestions.push(index + 1); // 题号从1开始
        }
      });

      // 如果有未完成题目，显示提示并阻止提交
      if (incompleteQuestions.length > 0) {
        const message = `您有 ${
          incompleteQuestions.length
        } 道题目未完成（题号：${incompleteQuestions.join(
          "、"
        )}）。请完成所有题目后再提交。`;
        setIncompleteTips({
          show: true,
          message,
          incompleteQuestions,
        });

        // 关闭提交确认对话框
        setShowSubmitDialog(false);

        // 显示提示
        toast({
          variant: "destructive",
          title: "无法提交",
          description: message,
        });

        return;
      }
    }

    try {
      setSubmitting(true);
      console.log("开始提交考试", {
        examId,
        attemptId,
        answersCount: Object.keys(answers).length,
        answers,
      });

      const response = await fetch(`/api/exam-attempts/${attemptId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const result = await response.json();

      console.log("提交考试响应", {
        status: response.status,
        ok: response.ok,
        result,
      });

      if (!response.ok) {
        throw new Error(result.error || "提交考试失败");
      }

      // 使用考试ID进行跳转
      router.push(
        `/console/exam${
          type === "consultant" ? "-consultant" : ""
        }/${examId}/result`
      );
    } catch (error) {
      console.error("提交失败:", error);
      setError(error instanceof Error ? error.message : "提交失败，请重试");
      setSubmitting(false);
    }
  };

  // 跳转到未完成题目
  const goToIncompleteQuestion = (questionNumber: number) => {
    // 题号从1开始，索引从0开始
    setCurrentQuestionIndex(questionNumber - 1);
    setIncompleteTips({ ...incompleteTips, show: false });
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return <div>考试不存在</div>;
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  // 检查当前题目是否存在
  if (!currentQuestion) {
    console.error("当前题目不存在", {
      currentIndex: currentQuestionIndex,
      totalQuestions: exam.questions.length,
      questions: exam.questions.map((q) => q.questionId),
    });
    return (
      <div className="p-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>题目加载失败</span>
          </div>
        </Card>
      </div>
    );
  }

  console.log(
    `显示题目: 第${currentQuestionIndex + 1}题，ID:${
      currentQuestion.questionId
    }`
  );

  return (
    <div className="p-6 pb-16">
      {/* 考试容器 - 添加最大宽度和居中布局 */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 考试标题和计时器 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <ExamTimer
            timeLimit={exam.timeLimit}
            onTimeUp={() => setShowSubmitDialog(true)}
          />
        </div>

        {/* 提示未完成题目 */}
        {incompleteTips.show && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div className="space-y-2">
                <p>{incompleteTips.message}</p>
                <div className="flex flex-wrap gap-2">
                  {incompleteTips.incompleteQuestions.map((num) => (
                    <Button
                      key={num}
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => goToIncompleteQuestion(num)}
                    >
                      前往第 {num} 题
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 题目显示 */}
        <div className="space-y-4">
          <QuestionDisplay
            question={currentQuestion}
            answer={answers[currentQuestion.questionId] || ""}
            onAnswerChange={(answer) =>
              handleAnswerChange(currentQuestion.questionId, answer)
            }
          />

          {/* 导航按钮 - 保留底部导航，便于操作 */}
          <div className="flex justify-between items-center mt-2 pt-2">
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

            <div className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} / {exam.questions.length}
            </div>

            {currentQuestionIndex === exam.questions.length - 1 ? (
              <Button onClick={() => setShowSubmitDialog(true)}>
                提交考试
              </Button>
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
      </div>

      {/* 提交确认对话框 */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>确认提交考试？</AlertDialogTitle>
            <AlertDialogDescription>
              提交后将无法修改答案。请确认所有题目都已完成。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续答题</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary"
            >
              {submitting ? "提交中..." : "确认提交"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

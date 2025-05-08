"use client";

import { TrainingNode } from "@/types/training";
import { Quiz, Question, QuizQuestion } from "@/types/quiz";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, GraduationCap, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { QuizHistory } from "@/components/quiz-history";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/lib/logger";

interface QuizDrawerProps {
  node: TrainingNode;
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
}

// 扩展 Question 类型以兼容现有代码
interface ExtendedQuestion extends Question {
  question?: Question;
  questionId?: string;
}

// 扩展 QuizQuestion 类型以兼容现有代码
interface ExtendedQuizQuestion extends QuizQuestion {
  type?: string;
}

export function QuizDrawer({
  node,
  open,
  onClose,
  embedded = false,
}: QuizDrawerProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, number>>({});

  // 加载考试记录
  useEffect(() => {
    const quizzes = node?.quizzes;
    if (!quizzes || quizzes.length === 0) return;

    const loadAttempts = async () => {
      try {
        const attempts: Record<string, number> = {};

        // 获取每个考试的记录
        for (const quiz of quizzes) {
          const response = await fetch(`/api/quiz/attempt?quizId=${quiz.id}`);
          if (response.ok) {
            const data = await response.json();
            attempts[quiz.id] = data.data.length;
          }
        }

        setQuizAttempts(attempts);
      } catch (error) {
        console.error("获取考试记录失败:", error);
      }
    };

    loadAttempts();
  }, [node?.quizzes]);

  // 处理答案变更
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      selectedQuiz &&
      typeof timeLeft === "number" &&
      timeLeft > 0 &&
      !isNaN(timeLeft)
    ) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1 || isNaN(prev)) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedQuiz, timeLeft]);

  if (!node) return null;

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      logger.debug("开始获取考试题目", {
        module: "QUIZ",
        data: { quizId: quiz.id },
      });

      // 获取题目（如果配置了随机抽题，会返回随机抽取的题目）
      const response = await fetch(`/api/quiz/${quiz.id}/questions`);
      if (!response.ok) {
        throw new Error("获取题目失败");
      }
      const data = await response.json();

      logger.debug("获取到考试题目", {
        module: "QUIZ",
        data: { status: data.code, message: data.msg },
      });

      if (!data.data || !Array.isArray(data.data)) {
        console.error("API返回的数据格式不正确:", data);
        throw new Error("API返回的数据格式不正确");
      }

      // 使用获取到的题目更新 quiz 对象
      const quizWithQuestions = {
        ...quiz,
        questions: data.data,
      };

      console.log(
        `获取到 ${data.data.length} 道题目，随机抽题配置:`,
        quiz.randomConfig
      );

      // 验证是否与随机配置一致
      if (
        quiz.randomConfig &&
        quiz.randomConfig.enabled &&
        quiz.randomConfig.questionCount
      ) {
        console.log(
          `期望题目数量: ${quiz.randomConfig.questionCount}, 实际题目数量: ${data.data.length}`
        );
        if (data.data.length !== quiz.randomConfig.questionCount) {
          console.warn(
            `随机抽题数量不匹配！期望 ${quiz.randomConfig.questionCount} 题，实际获取 ${data.data.length} 题`
          );
        }
      }

      setSelectedQuiz(quizWithQuestions);
      setQuizResult(null);
      setStartTime(new Date());
      // 设置考试时间(分钟转秒)，确保timeLimit始终是有效的数字
      const timeLimit =
        typeof quiz.timeLimit === "number" && !isNaN(quiz.timeLimit)
          ? quiz.timeLimit
          : 30; // 默认30分钟
      setTimeLeft(timeLimit * 60);
      // 初始化答案对象
      const initialAnswers: Record<string, string> = {};
      data.data.forEach((q: any) => {
        // 兼容两种数据结构：直接包含id的结构和嵌套question对象的结构
        const questionId =
          q.id || (q.question && q.question.id) || q.questionId;
        if (questionId) {
          initialAnswers[questionId] = "";
        } else {
          console.warn("无法确定题目ID:", q);
        }
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("开始考试失败:", error);
      // TODO: 显示错误提示
    }
  };

  const handleBack = () => {
    // 返回考试列表时重置所有状态
    setSelectedQuiz(null);
    setQuizResult(null);
    setShowHistory(false);
    setAnswers({});
    setStartTime(null);
    setTimeLeft(null);
  };

  // 处理历史记录返回
  const handleHistoryClose = () => {
    setShowHistory(false);
    // 如果不是从考试结果页面进入历史记录,则清除选中的考试
    if (!quizResult) {
      setSelectedQuiz(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuiz || !startTime) return;

    setLoading(true);

    try {
      // 计算得分
      let correctAnswers = 0;
      let totalScore = 0;
      const results: Record<
        string,
        {
          isCorrect: boolean;
          userAnswer: string;
          correctAnswer: string;
          explanation?: string;
          score: number;
        }
      > = {};

      const answerRecords: any[] = [];

      selectedQuiz.questions?.forEach((questionItem) => {
        // 兼容两种数据结构：直接是Question或包含question属性的QuizQuestion
        const question = questionItem.question || questionItem;
        const questionId = question.id || questionItem.questionId;

        if (!question || !question.content) {
          console.warn("题目数据不完整:", questionItem);
          return;
        }

        const userAnswer = answers[questionId]?.trim() || "";
        const correctAnswer = question.answer;

        // 根据题目类型判断答案是否正确
        let isCorrect = false;
        const questionType =
          question.type || (questionItem as ExtendedQuizQuestion).type;

        switch (questionType) {
          case "boolean":
            isCorrect = userAnswer === String(correctAnswer);
            break;
          case "single":
            isCorrect = userAnswer === String(correctAnswer);
            break;
          case "multiple":
            try {
              // 处理用户答案
              const userSelected = userAnswer
                ? userAnswer.split("").sort()
                : [];

              // 处理正确答案
              const correctValues =
                typeof correctAnswer === "string"
                  ? correctAnswer.split("").sort()
                  : Array.isArray(correctAnswer)
                  ? [...correctAnswer].sort()
                  : [];

              // 比较答案
              isCorrect =
                userSelected.length === correctValues.length &&
                userSelected.every((v, i) => v === correctValues[i]);
            } catch (error) {
              console.warn("多选题答案比较失败:", error);
              isCorrect = false;
            }
            break;
          case "text":
            const correctTextAnswer = Array.isArray(correctAnswer)
              ? correctAnswer[0] || ""
              : correctAnswer;
            isCorrect =
              userAnswer.trim().toLowerCase() ===
              String(correctTextAnswer).trim().toLowerCase();
            break;
          default:
            console.warn("未知题型:", questionType);
            isCorrect = false;
        }

        if (isCorrect) {
          correctAnswers++;
          totalScore += question.score;
        }

        results[questionId] = {
          isCorrect,
          userAnswer,
          correctAnswer: Array.isArray(correctAnswer)
            ? correctAnswer.join(", ")
            : String(correctAnswer),
          explanation: question.explanation,
          score: isCorrect ? question.score : 0,
        };

        answerRecords.push({
          questionId,
          answer: userAnswer,
          isCorrect,
          score: isCorrect ? question.score : 0,
        });
      });

      const totalQuestions = selectedQuiz.questions?.length || 0;
      const maxScore =
        selectedQuiz.questions?.reduce((sum, q) => {
          const question = q.question || q;
          return sum + (question.score || 0);
        }, 0) || 0;
      const score = Math.round((totalScore / maxScore) * 100);
      const passed = score >= (selectedQuiz.passingScore || 60);

      // 保存考试记录
      const endTime = new Date();
      const response = await fetch("/api/quiz/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: selectedQuiz.id,
          startTime,
          endTime,
          totalScore: score,
          passed,
          answers: answerRecords,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "保存考试记录失败");
      }

      setQuizResult({
        score,
        passed,
        correctAnswers,
        totalQuestions,
        results,
      });
    } catch (error) {
      console.error("提交答案失败:", error);
      // TODO: 显示错误提示
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined || isNaN(seconds))
      return "00:00";
    // 确保seconds是一个非负数值
    const validSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 渲染题目答案输入
  const renderAnswerInput = (question: ExtendedQuestion) => {
    // 确保question存在
    if (!question) {
      console.warn("无效的题目数据:", question);
      return <div className="text-red-500">无法加载题目</div>;
    }

    // 兼容两种数据结构：直接包含type的结构和嵌套question对象的结构
    const questionType =
      question.type || (question.question && question.question.type);
    if (!questionType) {
      console.warn("无法确定题目类型:", question);
      return <div className="text-red-500">无法确定题目类型</div>;
    }

    // 兼容两种数据结构：直接包含id的结构和嵌套question对象的结构
    const questionId =
      question.id ||
      (question.question && question.question.id) ||
      question.questionId;
    if (!questionId) {
      console.warn("无法确定题目ID:", question);
      return <div className="text-red-500">无法确定题目ID</div>;
    }

    switch (questionType) {
      case "boolean":
        return (
          <RadioGroup
            value={answers[questionId] || ""}
            onValueChange={(value) => handleAnswerChange(questionId, value)}
            className="flex items-center space-x-8"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`true-${questionId}`} />
              <Label htmlFor={`true-${questionId}`}>正确</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`false-${questionId}`} />
              <Label htmlFor={`false-${questionId}`}>错误</Label>
            </div>
          </RadioGroup>
        );
      case "single":
        const options =
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : Array.isArray(question.options)
            ? question.options
            : [];
        return (
          <RadioGroup
            value={answers[questionId] || ""}
            onValueChange={(value) => handleAnswerChange(questionId, value)}
            className="space-y-2"
          >
            {options.map((option: { value: string; label: string }) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${questionId}-${option.value}`}
                />
                <Label htmlFor={`${questionId}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "multiple":
        const multipleOptions =
          typeof question.options === "string"
            ? JSON.parse(question.options)
            : Array.isArray(question.options)
            ? question.options
            : [];
        const selectedValues = answers[questionId]
          ? answers[questionId].split("")
          : [];
        return (
          <div className="space-y-2">
            {multipleOptions.map((option: { value: string; label: string }) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${questionId}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(
                          (v: string) => v !== option.value
                        );
                    handleAnswerChange(questionId, newValues.sort().join(""));
                  }}
                />
                <Label htmlFor={`${questionId}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );
      case "text":
        const correctAnswer = Array.isArray(question.answer)
          ? question.answer[0] || ""
          : question.answer;
        return (
          <Textarea
            value={answers[questionId] || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="请输入答案"
          />
        );
      default:
        console.warn("Unknown question type:", question.type);
        return null;
    }
  };

  // 检查答案是否已填写
  const isAnswerFilled = (question: ExtendedQuestion): boolean => {
    // 确保question存在
    if (!question) return false;

    // 兼容两种数据结构：直接包含id的结构和嵌套question对象的结构
    const questionId =
      question.id ||
      (question.question && question.question.id) ||
      question.questionId;
    if (!questionId) return false;

    // 兼容两种数据结构：直接包含type的结构和嵌套question对象的结构
    const questionType =
      question.type || (question.question && question.question.type);
    if (!questionType) return false;

    const answer = answers[questionId];
    if (!answer) return false;

    switch (questionType) {
      case "boolean":
        return answer === "true" || answer === "false";
      case "single":
        return !!answer;
      case "multiple":
        try {
          const selectedValues = JSON.parse(answer);
          return Array.isArray(selectedValues) && selectedValues.length > 0;
        } catch {
          return false;
        }
      case "text":
        return answer.trim().length > 0;
      default:
        return false;
    }
  };

  // 检查答案是否正确
  const checkAnswer = (
    question: ExtendedQuestion,
    userAnswer: string
  ): boolean => {
    logger.debug("检查答案", {
      module: "QUIZ",
      data: {
        questionId: question.id,
        questionType: question.type,
        userAnswer,
      },
    });

    switch (question.type) {
      case "boolean":
        return userAnswer === question.answer;
      case "single":
        return userAnswer === question.answer;
      case "multiple":
        try {
          // 处理用户答案
          const userSelected = userAnswer ? userAnswer.split("").sort() : [];

          // 处理正确答案
          const correctValues =
            typeof question.answer === "string"
              ? question.answer.split("").sort()
              : Array.isArray(question.answer)
              ? [...question.answer].sort()
              : [];

          // 比较答案
          return (
            userSelected.length === correctValues.length &&
            userSelected.every((v, i) => v === correctValues[i])
          );
        } catch (error) {
          console.warn("多选题答案比较失败:", error);
          return false;
        }
      case "text":
        const correctAnswer = Array.isArray(question.answer)
          ? question.answer[0] || ""
          : question.answer;
        return (
          userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
        );
      default:
        console.warn("Unknown question type:", question.type);
        return false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="p-0">
        <SheetTitle className="sr-only">
          {selectedQuiz ? selectedQuiz.title : node.title}
        </SheetTitle>
        <div className="h-full flex flex-col">
          {!embedded && (
            <div className="sticky top-0 z-50 bg-background border-b">
              <div className="px-6 py-4">
                <div className="flex items-center gap-4">
                  {selectedQuiz ? (
                    <div className="flex items-center gap-4 w-full">
                      {!quizResult && !showHistory && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBack}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold truncate">
                          {selectedQuiz.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {showHistory ? (
                            "考试历史记录"
                          ) : (
                            <>
                              共 {selectedQuiz.questions?.length} 题
                              {!quizResult && typeof timeLeft === "number" && (
                                <span className="ml-2 text-orange-500 font-medium">
                                  剩余时间: {formatTime(timeLeft)}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button variant="ghost" size="icon" onClick={onClose}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold truncate">
                          {node.title}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          选择一个测验开始答题
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {selectedQuiz ? (
                showHistory ? (
                  <QuizHistory
                    quizId={selectedQuiz.id}
                    onClose={handleHistoryClose}
                  />
                ) : quizResult ? (
                  // 考试结果界面
                  <div className="space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle
                          className={
                            quizResult.passed
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {quizResult.passed
                            ? "恭喜通过考试!"
                            : "很遗憾,未通过考试"}
                        </CardTitle>
                        <CardDescription>
                          总分: {quizResult.score} 分 (通过分数:{" "}
                          {selectedQuiz.passingScore || 60} 分)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <Progress value={quizResult.score} className="h-2" />
                        <div className="grid gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              答对题目:
                            </span>
                            <span className="font-medium">
                              {quizResult.correctAnswers} /{" "}
                              {quizResult.totalQuestions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              正确率:
                            </span>
                            <span className="font-medium">
                              {Math.round(
                                (quizResult.correctAnswers /
                                  quizResult.totalQuestions) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 详细解析 */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">详细解析</h3>
                      {selectedQuiz.questions?.map((questionItem, index) => {
                        // 兼容两种数据结构：直接是Question或包含question属性的QuizQuestion
                        const question = questionItem.question || questionItem;
                        const questionId = question.id || questionItem.id;

                        if (!question || !question.content) {
                          console.warn("题目数据不完整:", questionItem);
                          return (
                            <div
                              key={`question-${index}`}
                              className="p-4 border rounded-md bg-red-50"
                            >
                              <div className="font-medium text-red-500">
                                题目数据不完整
                              </div>
                              <div className="text-sm text-red-400">
                                题号: {index + 1}
                              </div>
                            </div>
                          );
                        }

                        const result = quizResult.results?.[questionId];
                        if (!result) return null;

                        // 获取用户答案的显示文本
                        const getUserAnswerDisplay = () => {
                          switch (question.type) {
                            case "boolean":
                              return result.userAnswer === "true"
                                ? "正确"
                                : "错误";
                            case "single":
                              try {
                                const options =
                                  typeof question.options === "string"
                                    ? JSON.parse(question.options)
                                    : Array.isArray(question.options)
                                    ? question.options
                                    : [];
                                const option = options.find(
                                  (opt: { value: string }) =>
                                    opt.value === result.userAnswer
                                );
                                return option ? option.label : "(未作答)";
                              } catch {
                                return result.userAnswer || "(未作答)";
                              }
                            case "multiple":
                              try {
                                const options =
                                  typeof question.options === "string"
                                    ? JSON.parse(question.options)
                                    : Array.isArray(question.options)
                                    ? question.options
                                    : [];
                                const userSelected = result.userAnswer
                                  ? result.userAnswer.split("")
                                  : [];
                                return userSelected.length > 0
                                  ? userSelected
                                      .map((value: string) => {
                                        const option = options.find(
                                          (opt: { value: string }) =>
                                            opt.value === value
                                        );
                                        return option ? option.label : value;
                                      })
                                      .join("、")
                                  : "(未作答)";
                              } catch {
                                return result.userAnswer || "(未作答)";
                              }
                            case "text":
                            default:
                              return result.userAnswer || "(未作答)";
                          }
                        };

                        // 获取正确答案的显示文本
                        const getCorrectAnswerDisplay = () => {
                          switch (question.type) {
                            case "boolean":
                              return question.answer === "true"
                                ? "正确"
                                : "错误";
                            case "single":
                              try {
                                const options =
                                  typeof question.options === "string"
                                    ? JSON.parse(question.options)
                                    : Array.isArray(question.options)
                                    ? question.options
                                    : [];
                                const option = options.find(
                                  (opt: { value: string }) =>
                                    opt.value === question.answer
                                );
                                return option ? option.label : question.answer;
                              } catch {
                                return question.answer;
                              }
                            case "multiple":
                              try {
                                const options =
                                  typeof question.options === "string"
                                    ? JSON.parse(question.options)
                                    : Array.isArray(question.options)
                                    ? question.options
                                    : [];
                                const correctValues =
                                  typeof question.answer === "string"
                                    ? question.answer.split("")
                                    : Array.isArray(question.answer)
                                    ? question.answer
                                    : [];
                                return correctValues.length > 0
                                  ? correctValues
                                      .map((value: string) => {
                                        const option = options.find(
                                          (opt: { value: string }) =>
                                            opt.value === value
                                        );
                                        return option ? option.label : value;
                                      })
                                      .join("、")
                                  : "(未作答)";
                              } catch {
                                return question.answer || "(未作答)";
                              }
                            case "text":
                            default:
                              return question.answer;
                          }
                        };

                        return (
                          <Card
                            key={questionId}
                            className={cn(
                              "border-l-4",
                              result.isCorrect
                                ? "border-l-green-500"
                                : "border-l-red-500"
                            )}
                          >
                            <CardHeader>
                              <div className="flex items-start gap-3">
                                <div className="font-medium text-muted-foreground min-w-[32px]">
                                  {String(index + 1).padStart(2, "0")}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium mb-2">
                                    {question.content}
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        你的答案:
                                      </span>
                                      <span
                                        className={cn(
                                          "font-medium",
                                          result.isCorrect
                                            ? "text-green-500"
                                            : "text-red-500"
                                        )}
                                      >
                                        {getUserAnswerDisplay()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        正确答案:
                                      </span>
                                      <span className="font-medium">
                                        {getCorrectAnswerDisplay()}
                                      </span>
                                    </div>
                                    {result.explanation && (
                                      <div className="pt-2">
                                        <span className="text-muted-foreground">
                                          解析:
                                        </span>
                                        <p className="mt-1 text-muted-foreground">
                                          {result.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className={cn(
                                    "font-medium",
                                    result.isCorrect
                                      ? "text-green-500"
                                      : "text-red-500"
                                  )}
                                >
                                  {result.score} / {question.score} 分
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // 考试界面
                  <div className="space-y-8">
                    {selectedQuiz.questions?.map((questionItem, index) => {
                      // 兼容两种数据结构：直接是Question或包含question属性的QuizQuestion
                      const question = questionItem.question || questionItem;
                      const questionId = question.id || questionItem.id;

                      if (!question || !question.content) {
                        console.warn("题目数据不完整:", questionItem);
                        return (
                          <div
                            key={`question-${index}`}
                            className="p-4 border rounded-md bg-red-50"
                          >
                            <div className="font-medium text-red-500">
                              题目数据不完整
                            </div>
                            <div className="text-sm text-red-400">
                              题号: {index + 1}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={questionId || index} className="space-y-4">
                          <div className="flex gap-3">
                            <div className="font-medium text-muted-foreground min-w-[32px]">
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium mb-3">
                                {question.content}
                              </div>
                              {renderAnswerInput(question)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!quizResult && (
                      <div className="flex justify-end mt-8">
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            !selectedQuiz?.questions?.every((questionItem) => {
                              // 兼容两种数据结构：直接是Question或包含question属性的QuizQuestion
                              const question =
                                questionItem.question || questionItem;
                              const questionId =
                                question.id || questionItem.questionId;
                              return answers[questionId]?.trim() !== "";
                            })
                          }
                        >
                          提交答案
                        </Button>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // 考试列表
                node.quizzes
                  ?.filter((quiz) => quiz.status === "active")
                  .map((quiz) => (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription>{quiz.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{quiz.timeLimit} 分钟</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            <span>通过分数：{quiz.passingScore}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => handleStartQuiz(quiz)}
                          >
                            开始考试
                          </Button>
                          {quizAttempts[quiz.id] > 0 && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedQuiz(quiz);
                                setShowHistory(true);
                              }}
                            >
                              历史记录
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </ScrollArea>
          <div className="h-4" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

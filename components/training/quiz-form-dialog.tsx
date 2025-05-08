"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Quiz,
  QuizQuestion,
  QuestionInput,
  Question,
  QuestionDifficulty,
  RandomConfig,
} from "@/types/quiz";
import { Trash2, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionEditorFactory } from "./QuestionEditorFactory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";
import { QuestionBankDialog } from "./question-bank-dialog";

type QuestionType = "boolean" | "text" | "single" | "multiple";

interface QuizQuestionData {
  id: string;
  quizId: string;
  questionId: string;
  order: number;
  question: {
    id: string;
    content: string;
    type: QuestionType;
    answer: string | string[];
    options?: string;
    explanation?: string;
    score: number;
    difficulty: QuestionDifficulty;
  };
  createdAt: Date;
}

interface QuizFormDialogProps {
  open: boolean;
  quiz?: Quiz;
  trainingId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function QuizFormDialog({
  open,
  quiz,
  trainingId,
  onClose,
  onSaved,
}: QuizFormDialogProps) {
  // 基本信息状态
  const [title, setTitle] = useState(quiz?.title || "");
  const [description, setDescription] = useState(quiz?.description || "");
  const [timeLimit, setTimeLimit] = useState(quiz?.timeLimit || 0);
  const [passingScore, setPassingScore] = useState(quiz?.passingScore || 0);
  const [targetTotalScore, setTargetTotalScore] = useState(
    quiz?.totalScore || 100
  );
  const [questions, setQuestions] = useState<QuestionInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQuestionBankDialog, setShowQuestionBankDialog] = useState(false);
  const [randomConfig, setRandomConfig] = useState({
    enabled: false,
    questionCount: 0,
    typeDistribution: {
      single: 0,
      multiple: 0,
      boolean: 0,
      text: 0,
    },
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0,
    },
  });

  // 重置表单
  useEffect(() => {
    if (quiz) {
      logger.debug("收到测验数据", {
        module: "QUIZ_FORM",
        data: { quiz },
      });

      // 检查questions数组的结构
      if (quiz.questions && quiz.questions.length > 0) {
        logger.debug("第一个question结构", {
          module: "QUIZ_FORM",
          data: { quizQuestion: quiz.questions[0] },
        });
      }

      // 设置基本信息
      setTitle(quiz.title || "");
      setDescription(quiz.description || "");
      setTimeLimit(quiz.timeLimit || 0);
      setPassingScore(quiz.passingScore || 0);

      // 处理随机配置
      if (quiz.randomConfig) {
        const config = quiz.randomConfig as RandomConfig;
        setRandomConfig((prev) => ({
          ...prev,
          enabled: config.enabled || false,
          questionCount: config.questionCount || 0,
          typeDistribution: config.typeDistribution || {
            single: 0,
            multiple: 0,
            boolean: 0,
            text: 0,
          },
          difficultyDistribution: config.difficultyDistribution || {
            easy: 0,
            medium: 0,
            hard: 0,
          },
        }));
      } else {
        // 重置随机配置
        setRandomConfig({
          enabled: false,
          questionCount: 0,
          typeDistribution: {
            single: 0,
            multiple: 0,
            boolean: 0,
            text: 0,
          },
          difficultyDistribution: {
            easy: 0,
            medium: 0,
            hard: 0,
          },
        });
      }

      // 处理题目数据
      if (!quiz.questions || quiz.questions.length === 0) {
        logger.warn("Quiz 没有题目数据");
        toast({
          title: "警告",
          description: "没有找到题目数据",
          variant: "destructive",
        });
        setQuestions([]);
        return;
      }

      try {
        const validQuestions = quiz.questions
          .filter((quizQuestion) => quizQuestion && quizQuestion.question) // 确保每个QuizQuestion都有question子对象
          .map((quizQuestion) => {
            // 从QuizQuestion中获取question对象
            const questionData = quizQuestion.question;
            logger.debug("处理题目数据", {
              module: "QUIZ_FORM",
              data: { questionData },
            });

            if (!questionData) {
              logger.warn("无法提取题目数据:", {
                module: "QUIZ_FORM",
                data: { quizQuestion },
              });
              return null;
            }

            // 尝试解析选项
            let parsedOptions = questionData.options;
            try {
              if (typeof questionData.options === "string") {
                parsedOptions = JSON.parse(questionData.options as string);
              }
            } catch (e) {
              logger.warn("解析选项失败:", {
                module: "QUIZ_FORM",
                data: { error: e },
              });
            }

            // 尝试解析答案
            let parsedAnswer = questionData.answer;
            try {
              // 只有当答案看起来像JSON格式时才尝试解析
              if (
                typeof questionData.answer === "string" &&
                (questionData.answer.startsWith("[") ||
                  questionData.answer.startsWith("{"))
              ) {
                parsedAnswer = JSON.parse(questionData.answer as string);
              }
            } catch (e) {
              logger.warn("解析答案失败:", {
                module: "QUIZ_FORM",
                data: { error: e },
              });
            }

            // 格式化题目数据
            const formattedQuestion: QuestionInput = {
              id: questionData.id,
              content: questionData.content || "",
              type: questionData.type,
              answer: Array.isArray(parsedAnswer)
                ? parsedAnswer.join(",")
                : String(parsedAnswer || ""),
              options: Array.isArray(parsedOptions)
                ? JSON.stringify(parsedOptions)
                : typeof parsedOptions === "string"
                  ? (parsedOptions as string)
                  : "",
              explanation: questionData.explanation || "",
              score: questionData.score || 10,
              difficulty: questionData.difficulty || "medium",
            };

            logger.debug("格式化题目", {
              module: "QUIZ_FORM",
              data: { formattedQuestion },
            });
            return formattedQuestion;
          })
          .filter((q): q is QuestionInput => q !== null);

        if (validQuestions.length === 0) {
          logger.warn("未找到有效的题目数据");
          toast({
            title: "警告",
            description: "没有找到有效的题目数据",
            variant: "destructive",
          });
        } else {
          logger.debug("最终处理的题目数据", {
            module: "QUIZ_FORM",
            data: { validQuestions },
          });
        }

        setQuestions(validQuestions);
      } catch (error) {
        logger.error("处理题目数据时出错:", {
          module: "QUIZ_FORM",
          data: { error },
        });
        toast({
          title: "错误",
          description: "处理题目数据时出错",
          variant: "destructive",
        });
      }
    } else {
      // 如果是新建测验，重置所有状态
      logger.debug("创建新测验，重置所有状态");
      setTitle("");
      setDescription("");
      setTimeLimit(30);
      setPassingScore(60);
      setQuestions([]);
      setRandomConfig({
        enabled: false,
        questionCount: 0,
        typeDistribution: {
          single: 0,
          multiple: 0,
          boolean: 0,
          text: 0,
        },
        difficultyDistribution: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
      });
    }
  }, [quiz, toast]);

  // 处理题目变更
  const handleQuestionChange = (index: number, question: Question) => {
    console.log("处理题目变更:", {
      index,
      questionType: question.type,
      score: question.score,
      fullQuestion: question,
    });

    const newQuestions = [...questions];
    const formattedQuestion: QuestionInput = {
      id: question.id,
      content: question.content,
      type: question.type,
      answer: Array.isArray(question.answer)
        ? question.answer.join(",")
        : question.answer,
      explanation: question.explanation,
      score: question.score || 10, // 确保分数有默认值
      options: Array.isArray(question.options)
        ? JSON.stringify(question.options)
        : question.options,
      difficulty: question.difficulty || ("medium" as QuestionDifficulty),
    };

    console.log("格式化后的题目:", {
      formattedQuestion,
      score: formattedQuestion.score,
    });

    newQuestions[index] = formattedQuestion;
    setQuestions(newQuestions);
  };

  // 处理题目删除
  const handleQuestionDelete = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // 计算实际总分
  const currentTotalScore = Array.isArray(questions)
    ? questions.reduce((sum, q) => sum + q.score, 0)
    : 0;

  // 验证所有题目
  const hasInvalidQuestions =
    Array.isArray(questions) &&
    questions.some((q) => {
      // 添加更详细的验证逻辑
      if (!q.content || q.content.trim() === "") {
        logger.debug("题目验证", {
          module: "QUIZ_FORM",
          data: {
            invalidQuestion: q,
            reason: "题目内容为空",
          },
        });
        return true;
      }

      // 对于answer，允许空字符串作为有效值（某些题型可能允许）
      if (q.answer === undefined || q.answer === null) {
        logger.debug("题目验证", {
          module: "QUIZ_FORM",
          data: {
            invalidQuestion: q,
            reason: "题目答案无效",
          },
        });
        return true;
      }

      if (q.score < 1) {
        logger.debug("题目验证", {
          module: "QUIZ_FORM",
          data: {
            invalidQuestion: q,
            reason: "题目分数小于1",
          },
        });
        return true;
      }

      return false;
    });

  // 添加调试日志
  useEffect(() => {
    if (hasInvalidQuestions) {
      logger.debug("题目验证状态", {
        module: "QUIZ_FORM",
        data: {
          hasInvalidQuestions,
          questions,
        },
      });

      const invalidQuestions = questions.filter(
        (q) =>
          !q.content ||
          q.content.trim() === "" ||
          q.answer === undefined ||
          q.answer === null ||
          q.score < 1
      );

      logger.debug("无效题目详情", {
        module: "QUIZ_FORM",
        data: {
          invalidQuestions,
          details: invalidQuestions.map((q: QuestionInput, index: number) => ({
            index: index + 1,
            content: !q.content || q.content.trim() === "",
            answer: q.answer === undefined || q.answer === null,
            score: q.score < 1,
            data: q,
          })),
        },
      });
    }
  }, [hasInvalidQuestions, questions]);

  // 添加自动分值调整函数
  const adjustScoresForRandomQuestions = (
    questions: QuestionInput[],
    targetTotalScore: number,
    questionCount: number
  ): QuestionInput[] => {
    const baseScore = Math.floor(targetTotalScore / questionCount);
    const remainingScore = targetTotalScore % questionCount;

    // 按难度排序
    const sortedQuestions = [...questions].sort(
      (a, b) =>
        getDifficultyWeight(b.difficulty) - getDifficultyWeight(a.difficulty)
    );

    // 分配分值
    return sortedQuestions.map((q, index) => ({
      ...q,
      score: baseScore + (index < remainingScore ? 1 : 0),
    }));
  };

  // 添加难度权重函数
  const getDifficultyWeight = (difficulty: QuestionDifficulty): number => {
    const weights: Record<QuestionDifficulty, number> = {
      hard: 3,
      medium: 2,
      easy: 1,
    };
    return weights[difficulty] || 1;
  };

  // 监听randomConfig变化
  useEffect(() => {
    console.log("randomConfig 发生变化:", randomConfig);

    if (randomConfig.enabled && questions.length > 0) {
      // 启用随机抽题时,按抽题数量重新计算分值
      const adjustedQuestions = adjustScoresForRandomQuestions(
        questions,
        targetTotalScore,
        randomConfig.questionCount
      );
      setQuestions(adjustedQuestions);
    } else if (!randomConfig.enabled && questions.length > 0) {
      // 关闭随机抽题时,重置所有题目分值为平均分
      const baseScore = Math.floor(targetTotalScore / questions.length);
      const remainingScore = targetTotalScore % questions.length;

      const resetQuestions = questions.map((q, index) => ({
        ...q,
        score: baseScore + (index < remainingScore ? 1 : 0),
      }));
      setQuestions(resetQuestions);
    }
  }, [randomConfig.enabled, randomConfig.questionCount, targetTotalScore]);

  // 分析题目分布
  const analyzeQuestionDistribution = (questions: QuestionInput[]) => {
    const distribution = {
      total: questions.length,
      types: {
        single: 0,
        multiple: 0,
        boolean: 0,
        text: 0,
      },
      difficulties: {
        easy: 0,
        medium: 0,
        hard: 0,
      },
    };

    questions.forEach((q) => {
      // 统计题型
      distribution.types[q.type as keyof typeof distribution.types]++;
      // 统计难度
      distribution.difficulties[
        q.difficulty as keyof typeof distribution.difficulties
      ]++;
    });

    return distribution;
  };

  // 根据题目分布设置随机配置
  const updateRandomConfig = (
    distribution: ReturnType<typeof analyzeQuestionDistribution>
  ) => {
    // 计算难度分布百分比
    const totalQuestions = distribution.total;
    const easyPercent = Math.floor(
      (distribution.difficulties.easy / totalQuestions) * 100
    );
    const mediumPercent = Math.floor(
      (distribution.difficulties.medium / totalQuestions) * 100
    );
    const hardPercent = Math.floor(
      (distribution.difficulties.hard / totalQuestions) * 100
    );

    // 计算总百分比并调整，确保总和为100%
    let totalPercent = easyPercent + mediumPercent + hardPercent;
    let adjustedEasy = easyPercent;
    let adjustedMedium = mediumPercent;
    let adjustedHard = hardPercent;

    // 如果总和不等于100%，根据比例最大的难度类型进行调整
    if (totalPercent !== 100) {
      const diff = 100 - totalPercent;
      if (easyPercent >= mediumPercent && easyPercent >= hardPercent) {
        adjustedEasy += diff;
      } else if (mediumPercent >= easyPercent && mediumPercent >= hardPercent) {
        adjustedMedium += diff;
      } else {
        adjustedHard += diff;
      }
    }

    // 计算题型分布
    const typeDistribution = {
      single: distribution.types.single || 0,
      multiple: distribution.types.multiple || 0,
      boolean: distribution.types.boolean || 0,
      text: distribution.types.text || 0,
    };

    // 确保题型总数与questionCount一致
    const totalTypeCount = Object.values(typeDistribution).reduce(
      (a, b) => a + b,
      0
    );
    const questionCount = Math.min(totalTypeCount, 10); // 默认最多抽取10题，或题目总数

    setRandomConfig((prev) => ({
      ...prev,
      enabled: true,
      questionCount: questionCount,
      typeDistribution: typeDistribution,
      difficultyDistribution: {
        easy: adjustedEasy,
        medium: adjustedMedium,
        hard: adjustedHard,
      },
    }));
  };

  // 监听randomConfig.enabled变化
  useEffect(() => {
    if (randomConfig.enabled && questions.length > 0) {
      // 分析当前题目分布并更新配置
      const distribution = analyzeQuestionDistribution(questions);
      updateRandomConfig(distribution);
    }
  }, [randomConfig.enabled]);

  // 提交前验证
  const handleSave = async () => {
    try {
      setLoading(true);

      // 验证基本信息
      if (!title) {
        toast({
          title: "错误",
          description: "请输入测验标题",
          variant: "destructive",
        });
        return;
      }

      // 验证题目
      if (!Array.isArray(questions) || questions.length === 0) {
        toast({
          title: "错误",
          description: "请添加至少一道题目",
          variant: "destructive",
        });
        return;
      }

      // 验证及格分数
      if (passingScore <= 0 || passingScore > targetTotalScore) {
        toast({
          title: "错误",
          description: "及格分数必须大于0且不能超过总分",
          variant: "destructive",
        });
        return;
      }

      // 准备提交数据
      const quizData = {
        id: quiz?.id,
        title,
        description,
        timeLimit,
        passingScore,
        totalScore: targetTotalScore,
        status: quiz?.status || "inactive",
        trainingId: quiz?.trainingId || trainingId,
        randomConfig: randomConfig.enabled ? randomConfig : null,
        questions: questions.map((q, index) => ({
          ...q,
          order: index,
        })),
      };

      // 发送请求
      const response = await fetch("/api/quiz", {
        method: quiz ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      toast({
        title: "成功",
        description: "测验保存成功",
      });

      // 调用保存成功回调
      onSaved?.();

      // 关闭对话框
      onClose();
    } catch (error) {
      console.error("保存测验失败:", error);
      toast({
        title: "错误",
        description: "保存测验失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理从题库添加题目
  const handleAddQuestions = (selectedQuestions: Question[]) => {
    console.log("Selected questions before processing:", selectedQuestions);
    console.log(
      "Boolean questions count:",
      selectedQuestions.filter((q) => q.type === "boolean").length
    );

    // 计算基础分数
    const baseScore = Math.floor(100 / selectedQuestions.length);
    let remainingScore = 100 - baseScore * selectedQuestions.length;

    // 按难度分配权重
    const difficultyWeights: Record<QuestionDifficulty, number> = {
      hard: 3,
      medium: 2,
      easy: 1,
    };

    // 对题目按难度排序
    const sortedQuestions = [...selectedQuestions].sort(
      (a, b) =>
        difficultyWeights[b.difficulty] - difficultyWeights[a.difficulty]
    );

    console.log("Questions after sorting:", sortedQuestions);

    // 创建新题目数组，按难度优先分配额外分数
    const formattedQuestions: QuestionInput[] = sortedQuestions.map(
      (q, index) => {
        let score = baseScore;
        if (remainingScore > 0) {
          score += 1;
          remainingScore -= 1;
        }

        console.log("Processing question:", {
          type: q.type,
          score: score,
          question: q,
        });

        return {
          id: q.id,
          content: q.content,
          type: q.type,
          answer: Array.isArray(q.answer) ? q.answer.join(",") : q.answer,
          explanation: q.explanation,
          score: score,
          options: Array.isArray(q.options)
            ? JSON.stringify(q.options)
            : q.options,
          difficulty: q.difficulty || "medium",
        };
      }
    );

    console.log("Final questions to be added:", formattedQuestions);

    setQuestions((prev) => [...prev, ...formattedQuestions]);
    setShowQuestionBankDialog(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{quiz ? "编辑测验" : "新建测验"}</DialogTitle>
          <DialogDescription>
            {quiz ? "修改测验内容和题目" : "创建新的测验并添加题目"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-6">
            {/* 基本信息表单 */}
            <div className="space-y-4">
              <div className="flex gap-4">
                {/* 测验标题 */}
                <div className="flex-[2] space-y-2">
                  <Label>测验标题</Label>
                  <Input
                    placeholder="请输入测验标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                {/* 测验描述 */}
                <div className="flex-1 space-y-2">
                  <Label>
                    测验描述
                    <span className="text-sm text-muted-foreground ml-2">
                      (选填)
                    </span>
                  </Label>
                  <Input
                    placeholder="请输入测验描述"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {/* 时间限制 */}
                <div className="w-[200px] space-y-2">
                  <Label>时间限制 (分钟)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  />
                </div>
                {/* 及格分数 */}
                <div className="w-[200px] space-y-2">
                  <Label>及格分数</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* 随机抽题配置 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>启用随机抽题</Label>
                  <Switch
                    checked={randomConfig?.enabled || false}
                    onCheckedChange={(checked) =>
                      setRandomConfig((prev) => ({
                        ...prev,
                        enabled: checked,
                      }))
                    }
                  />
                </div>

                {randomConfig?.enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>每次抽取题目数量</Label>
                      <Input
                        type="number"
                        min={1}
                        value={randomConfig.questionCount || ""}
                        onChange={(e) =>
                          setRandomConfig((prev) => ({
                            ...prev,
                            questionCount:
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>题型分布</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>单选题数量</Label>
                          <Input
                            type="number"
                            min={0}
                            value={randomConfig.typeDistribution.single}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                typeDistribution: {
                                  ...prev.typeDistribution,
                                  single: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>多选题数量</Label>
                          <Input
                            type="number"
                            min={0}
                            value={randomConfig.typeDistribution.multiple}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                typeDistribution: {
                                  ...prev.typeDistribution,
                                  multiple: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>判断题数量</Label>
                          <Input
                            type="number"
                            min={0}
                            value={randomConfig.typeDistribution.boolean}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                typeDistribution: {
                                  ...prev.typeDistribution,
                                  boolean: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>填空题数量</Label>
                          <Input
                            type="number"
                            min={0}
                            value={randomConfig.typeDistribution.text}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                typeDistribution: {
                                  ...prev.typeDistribution,
                                  text: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>难度分布</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>简单题目比例 (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={randomConfig.difficultyDistribution.easy}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                difficultyDistribution: {
                                  ...prev.difficultyDistribution,
                                  easy: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>中等题目比例 (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={randomConfig.difficultyDistribution.medium}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                difficultyDistribution: {
                                  ...prev.difficultyDistribution,
                                  medium: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>困难题目比例 (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={randomConfig.difficultyDistribution.hard}
                            onChange={(e) =>
                              setRandomConfig((prev) => ({
                                ...prev,
                                difficultyDistribution: {
                                  ...prev.difficultyDistribution,
                                  hard: parseInt(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 题目列表 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowQuestionBankDialog(true)}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    题库导入
                  </Button>
                </div>
                <div>
                  共 {questions.length} 题
                  {randomConfig.enabled
                    ? ` / 随机抽取 ${randomConfig.questionCount} 题`
                    : ""}{" "}
                  / 当前总分 {currentTotalScore} 分
                  {currentTotalScore !== targetTotalScore
                    ? ` (目标: ${targetTotalScore} 分)`
                    : ""}
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <div className="text-muted-foreground mb-4">暂无题目</div>
                  {/* <Button
                    variant="outline"
                    onClick={() => setShowQuestionBankDialog(true)}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    从题库导入题目
                  </Button> */}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-background">
                        <TableCell className="w-[120px] text-center font-medium">
                          序号/类型
                        </TableCell>
                        <TableCell className="w-[25%] font-medium">
                          题目内容
                        </TableCell>
                        <TableCell className="w-[20%] font-medium">
                          答案解析
                        </TableCell>
                        <TableCell className="w-[25%] text-center font-medium">
                          答案
                        </TableCell>
                        <TableCell className="w-[150px] text-center font-medium">
                          分值
                        </TableCell>
                        <TableCell className="w-[60px]"></TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((question, index) => {
                        return (
                          <TableRow
                            key={index}
                            className="group hover:bg-muted/50"
                          >
                            <TableCell className="text-center align-middle py-2">
                              <div className="flex flex-col items-center gap-1">
                                <span>{index + 1}</span>
                                <Badge
                                  variant="outline"
                                  className="h-fit shrink-0"
                                >
                                  {question.type === "boolean" && "判断题"}
                                  {question.type === "text" && "填空题"}
                                  {question.type === "single" && "单选题"}
                                  {question.type === "multiple" && "多选题"}
                                </Badge>
                              </div>
                            </TableCell>
                            <QuestionEditorFactory
                              value={{
                                ...question,
                                id: `temp-${index}`,
                                difficulty: question.difficulty || "medium",
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                options: question.options
                                  ? JSON.parse(question.options)
                                  : undefined,
                              }}
                              onChange={(q) => {
                                console.log("Question being edited:", {
                                  questionType: q.type,
                                  score: q.score,
                                  fullQuestion: q,
                                });
                                handleQuestionChange(index, q);
                              }}
                              hideScore={false}
                            />
                            <TableCell className="text-center align-middle py-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuestionDelete(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || hasInvalidQuestions}
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <QuestionBankDialog
        open={showQuestionBankDialog}
        onClose={() => setShowQuestionBankDialog(false)}
        onSelect={handleAddQuestions}
        excludeQuestionIds={questions.map((q) => q.id)}
      />
    </Dialog>
  );
}

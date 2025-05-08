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
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Exam, ExamInput, ExamQuestion } from "@/types/exam";
import { Question, QuestionInput, QuestionDifficulty } from "@/types/quiz";
import { QuestionBankDialog } from "@/components/training/question-bank-dialog";
import {
  RandomConfigForm,
  RandomConfig,
} from "@/components/training/random-config-form";
import { Database, Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuestionEditorFactory } from "@/components/training/QuestionEditorFactory";
import { Switch } from "@/components/ui/switch";

interface ExamFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (data: ExamInput) => Promise<void>;
  exam?: Exam;
  defaultRole: string;
}

export function ExamFormDialog({
  open,
  onClose,
  onSaved,
  exam,
  defaultRole,
}: ExamFormDialogProps) {
  console.log("ExamFormDialog render - open状态:", open);

  const { toast } = useToast();
  const [title, setTitle] = useState(exam?.title || "");
  const [description, setDescription] = useState(exam?.description || "");
  const [timeLimit, setTimeLimit] = useState(exam?.timeLimit || 60);
  const [passingScore, setPassingScore] = useState(exam?.passingScore || 60);
  const [totalScore, setTotalScore] = useState(exam?.totalScore || 100);
  const [questions, setQuestions] = useState<ExamQuestion[]>(
    exam?.questions || []
  );
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(exam?.role || defaultRole);

  // 当exam改变时，更新所有表单字段
  useEffect(() => {
    console.log("Exam changed:", exam);
    if (exam) {
      setTitle(exam.title || "");
      setDescription(exam.description || "");
      setTimeLimit(exam.timeLimit || 60);
      setPassingScore(exam.passingScore || 60);
      setTotalScore(exam.totalScore || 100);
      setQuestions(exam.questions || []);
      setSelectedRole(exam.role || defaultRole);

      // 更新随机配置
      if (exam.randomConfig) {
        setRandomConfig(exam.randomConfig);
      } else {
        setRandomConfig({
          enabled: false,
          questionCount: 10,
          typeDistribution: {
            single: 40,
            multiple: 30,
            boolean: 20,
            text: 10,
          },
          difficultyDistribution: {
            easy: 20,
            medium: 60,
            hard: 20,
          },
        });
      }
    }
  }, [exam, defaultRole]);

  // 监控questions变化
  useEffect(() => {
    if (questions.length > 0) {
      console.log("Questions changed:", JSON.stringify(questions, null, 2));
      const booleanQuestions = questions.filter(
        (q) => q.question.type === "boolean"
      );
      if (booleanQuestions.length > 0) {
        console.log("Found boolean questions:", booleanQuestions);
      }
    }
  }, [questions]);

  console.log("ExamFormDialog 初始化");

  const [randomConfig, setRandomConfig] = useState<RandomConfig>(() => {
    const initialConfig = exam?.randomConfig || {
      enabled: false,
      questionCount: 10,
      typeDistribution: {
        single: 40,
        multiple: 30,
        boolean: 20,
        text: 10,
      },
      difficultyDistribution: {
        easy: 20,
        medium: 60,
        hard: 20,
      },
    };
    console.log("randomConfig 初始状态:", initialConfig);
    return initialConfig;
  });

  // 监听randomConfig变化
  useEffect(() => {
    console.log("randomConfig 发生变化:", randomConfig);

    if (questions.length === 0) return;

    if (randomConfig.enabled) {
      // 启用随机抽题时,按抽题数量重新计算分值
      const adjustedQuestions = adjustScoresForRandomQuestions(
        questions,
        totalScore,
        randomConfig.questionCount
      );
      setQuestions(adjustedQuestions);
    } else {
      // 关闭随机抽题时,重置所有题目分值为平均分
      const baseScore = Math.floor(totalScore / questions.length);
      const remainingScore = totalScore - baseScore * questions.length;

      // 按难度排序后重新分配分值
      const sortedQuestions = [...questions].sort(
        (a, b) =>
          getDifficultyWeight(b.question.difficulty) -
          getDifficultyWeight(a.question.difficulty)
      );

      const resetQuestions = sortedQuestions.map((q, index) => ({
        ...q,
        score: baseScore + (index < remainingScore ? 1 : 0),
      }));

      setQuestions(resetQuestions);
    }
  }, [randomConfig.enabled, randomConfig.questionCount, totalScore]);

  // 分析题目分布
  const analyzeQuestionDistribution = (
    questions: (Question | ExamQuestion)[]
  ) => {
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
      const question = "question" in q ? q.question : q;
      // 统计题型
      distribution.types[question.type as keyof typeof distribution.types]++;
      // 统计难度
      distribution.difficulties[
        question.difficulty as keyof typeof distribution.difficulties
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

  // 添加自动分值调整函数
  const adjustScoresForRandomQuestions = (
    questions: ExamQuestion[],
    totalScore: number,
    questionCount: number
  ): ExamQuestion[] => {
    const baseScore = Math.floor(totalScore / questionCount);
    const remainingScore = totalScore % questionCount;

    // 按难度排序
    const sortedQuestions = [...questions].sort(
      (a, b) =>
        getDifficultyWeight(b.question.difficulty) -
        getDifficultyWeight(a.question.difficulty)
    );

    // 分配分值
    return sortedQuestions.map((q, index) => ({
      ...q,
      score: baseScore + (index < remainingScore ? 1 : 0),
    }));
  };

  // 难度权重函数
  const getDifficultyWeight = (difficulty: QuestionDifficulty): number => {
    const weights: Record<QuestionDifficulty, number> = {
      hard: 3,
      medium: 2,
      easy: 1,
    };
    return weights[difficulty] || 1;
  };

  // 处理保存
  const handleSave = async () => {
    try {
      console.log("保存时的randomConfig:", randomConfig);
      // 验证必填字段
      if (!title) {
        toast({
          title: "错误",
          description: "请输入考试标题",
          variant: "destructive",
        });
        return;
      }

      if (questions.length === 0 && !randomConfig.enabled) {
        toast({
          title: "错误",
          description: "请添加考试题目或启用随机选题",
          variant: "destructive",
        });
        return;
      }

      // 根据是否启用随机抽题决定分值处理方式
      let finalQuestions = [...questions];
      if (randomConfig.enabled) {
        // 使用随机抽题时,按抽题数量重新计算分值
        finalQuestions = adjustScoresForRandomQuestions(
          questions,
          totalScore,
          randomConfig.questionCount
        );
      } else {
        // 不使用随机抽题时,检查总分
        const currentTotalScore = questions.reduce(
          (sum, q) => sum + q.score,
          0
        );

        if (currentTotalScore !== totalScore) {
          // 自动调整分数
          const baseScore = Math.floor(totalScore / questions.length);
          let remainingScore = totalScore - baseScore * questions.length;

          finalQuestions = questions.map((q, index) => ({
            ...q,
            score: baseScore + (index < remainingScore ? 1 : 0),
          }));

          toast({
            title: "提示",
            description: "已自动调整题目分数以确保总分为" + totalScore,
          });
        }
      }

      // 更新questions状态
      setQuestions(finalQuestions);

      // 验证随机配置
      if (randomConfig.enabled) {
        const totalTypeCount = Object.values(
          randomConfig.typeDistribution
        ).reduce((a, b) => a + b, 0);
        if (totalTypeCount !== randomConfig.questionCount) {
          toast({
            title: "错误",
            description: "题型分布的总数必须等于抽取题目数量",
            variant: "destructive",
          });
          return;
        }

        const totalDifficultyPercentage = Object.values(
          randomConfig.difficultyDistribution
        ).reduce((a, b) => a + b, 0);
        if (totalDifficultyPercentage !== 100) {
          // 自动调整难度百分比
          const newRandomConfig = { ...randomConfig };
          const diffValues = Object.entries(
            randomConfig.difficultyDistribution
          );

          // 查找最大的难度值
          let maxDiffIndex = 0;
          let maxValue = diffValues[0][1];

          for (let i = 1; i < diffValues.length; i++) {
            if (diffValues[i][1] > maxValue) {
              maxValue = diffValues[i][1];
              maxDiffIndex = i;
            }
          }

          // 调整最大难度值
          const diff = 100 - totalDifficultyPercentage;
          const maxDiffKey = diffValues[
            maxDiffIndex
          ][0] as keyof typeof randomConfig.difficultyDistribution;
          newRandomConfig.difficultyDistribution[maxDiffKey] += diff;

          setRandomConfig(newRandomConfig);

          toast({
            title: "提示",
            description: "已自动调整难度分布确保总和为100%",
          });
        }
      }

      const examData: ExamInput = {
        title,
        description,
        role: selectedRole,
        timeLimit,
        passingScore,
        totalScore,
        status: "inactive",
        questions: questions.map((q) => ({
          questionId: q.questionId,
          order: q.order,
          score: q.score,
        })),
        randomConfig: randomConfig.enabled ? randomConfig : null,
      };

      await onSaved(examData);
      onClose();
    } catch (error) {
      console.error("保存考试失败:", error);
      toast({
        title: "错误",
        description: "保存考试失败",
        variant: "destructive",
      });
    }
  };

  // 处理从题库添加题目
  const handleAddQuestions = (selectedQuestions: Question[]) => {
    alert(
      `Adding ${selectedQuestions.length} questions. Boolean questions: ${
        selectedQuestions.filter((q) => q.type === "boolean").length
      }`
    );

    console.log("Selected questions before processing:", selectedQuestions);

    // 计算题目的基础分和剩余分数
    const totalQuestions = selectedQuestions.length;
    const baseScore = Math.floor(totalScore / totalQuestions);
    let remainingScore = totalScore - baseScore * totalQuestions;

    // 按难度分配权重，优先给难题分配更高分数
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
    const newQuestions = sortedQuestions.map((q, index) => {
      let score = baseScore;
      if (remainingScore > 0) {
        score += 1;
        remainingScore -= 1;
      }

      const questionData = {
        questionId: q.id,
        order: questions.length + index,
        score: score,
        question: q,
      };

      console.log("Processing question:", {
        type: q.type,
        score: score,
        questionData,
      });

      return questionData;
    });

    console.log("Final questions to be added:", newQuestions);

    setQuestions([...questions, ...newQuestions]);

    // 分析题目分布并更新随机配置
    const distribution = analyzeQuestionDistribution([
      ...questions,
      ...newQuestions,
    ]);
    updateRandomConfig(distribution);

    setQuestionBankOpen(false);
  };

  // 处理删除题目
  const handleDeleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  // 处理题目分数变化
  const handleScoreChange = (index: number, score: number) => {
    const newQuestions = [...questions];
    newQuestions[index].score = score;
    setQuestions(newQuestions);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        console.log("Dialog onOpenChange - isOpen:", isOpen);
        onClose();
      }}
    >
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>{exam ? "编辑考试" : "新建考试"}</DialogTitle>
          <DialogDescription>
            请填写考试信息，添加考试题目或配置随机选题
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">考试标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入考试标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">考试说明</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入考试说明"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">适用角色</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="选择适用角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="writer">文案顾问</SelectItem>
                  <SelectItem value="consultant">留学顾问</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">考试时长(分钟)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="1"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 60)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingScore">及格分数</Label>
                <Input
                  id="passingScore"
                  type="number"
                  min="0"
                  max={totalScore}
                  value={passingScore}
                  onChange={(e) =>
                    setPassingScore(parseInt(e.target.value) || 60)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalScore">总分</Label>
                <Input
                  id="totalScore"
                  type="number"
                  min="1"
                  value={totalScore}
                  onChange={(e) =>
                    setTotalScore(parseInt(e.target.value) || 100)
                  }
                />
              </div>
            </div>

            {/* 随机抽题配置 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>启用随机抽题</Label>
                  <Switch
                    checked={randomConfig.enabled}
                    onCheckedChange={(checked) => {
                      console.log("Switch状态变化:", checked);
                      setRandomConfig((prev) => {
                        const newConfig = {
                          ...prev,
                          enabled: checked,
                        };
                        console.log("更新后的randomConfig:", newConfig);
                        return newConfig;
                      });
                    }}
                  />
                </div>
              </div>

              {randomConfig.enabled && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                  <div className="space-y-2">
                    <Label>每次抽取题目数量</Label>
                    <Input
                      type="number"
                      min={1}
                      value={randomConfig.questionCount}
                      onChange={(e) =>
                        setRandomConfig((prev) => ({
                          ...prev,
                          questionCount: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>题型分布 (总数需等于抽取题目数量)</Label>
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
                                single: parseInt(e.target.value) || 0,
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
                                multiple: parseInt(e.target.value) || 0,
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
                                boolean: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>简答题数量</Label>
                        <Input
                          type="number"
                          min={0}
                          value={randomConfig.typeDistribution.text}
                          onChange={(e) =>
                            setRandomConfig((prev) => ({
                              ...prev,
                              typeDistribution: {
                                ...prev.typeDistribution,
                                text: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>难度分布 (总和需为100%)</Label>
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
                                easy: parseInt(e.target.value) || 0,
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
                                medium: parseInt(e.target.value) || 0,
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
                                hard: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 考试题目列表 */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label>考试题目</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestionBankOpen(true)}
                >
                  <Database className="w-4 h-4 mr-2" />
                  题库选题
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>序号</TableCell>
                    <TableCell>题目内容</TableCell>
                    <TableCell>题型</TableCell>
                    <TableCell>难度</TableCell>
                    <TableCell>分值</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-24 text-center text-muted-foreground"
                      >
                        暂无题目
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((q, index) => (
                      <TableRow key={q.questionId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="max-w-md">
                          {q.question.content}
                        </TableCell>
                        <TableCell>
                          <Badge>
                            {
                              {
                                single: "单选题",
                                multiple: "多选题",
                                boolean: "判断题",
                                text: "简答题",
                              }[q.question.type]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {q.question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[100px]">
                          <Input
                            type="number"
                            min="1"
                            max={totalScore}
                            value={q.score}
                            onChange={(e) =>
                              handleScoreChange(
                                index,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20 border-2"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuestion(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 p-6 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>

        <QuestionBankDialog
          open={questionBankOpen}
          onClose={() => setQuestionBankOpen(false)}
          onSelect={handleAddQuestions}
          excludeQuestionIds={questions.map((q) => q.questionId)}
        />
      </DialogContent>
    </Dialog>
  );
}

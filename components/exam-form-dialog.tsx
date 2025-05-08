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
import { Exam, ExamInput } from "@/types/exam";
import { Question, QuestionInput, QuestionDifficulty } from "@/types/quiz";
import { QuestionBankDialog } from "@/components/training/question-bank-dialog";
import { ImportQuestionsDialog } from "@/components/training/import-questions-dialog";
import { Database, Trash2, Plus, FileUp } from "lucide-react";
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

interface ExamFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (data: ExamInput) => Promise<void>;
  exam?: Exam;
  role: string;
}

interface FormData {
  title: string;
  description: string;
  role: string;
  timeLimit: number;
  passingScore: number;
  totalScore: number;
  status: string;
  questions: Array<Question & { score: number }>;
}

const defaultFormData: FormData = {
  title: "",
  description: "",
  role: "",
  timeLimit: 60,
  passingScore: 60,
  totalScore: 100,
  status: "inactive",
  questions: [],
};

export function ExamFormDialog({
  open,
  onClose,
  onSaved,
  exam,
  role,
}: ExamFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (exam) {
      // 计算每道题的分数
      const questions = exam.questions || [];
      const questionCount = questions.length;
      const baseScore =
        questionCount > 0 ? Math.floor(exam.totalScore / questionCount) : 0;
      const remainingScore =
        questionCount > 0 ? exam.totalScore % questionCount : 0;

      setFormData({
        title: exam.title,
        description: exam.description || "",
        role: exam.role,
        timeLimit: exam.timeLimit,
        passingScore: exam.passingScore,
        totalScore: exam.totalScore,
        status: exam.status || "inactive",
        questions: questions.map((q, index) => ({
          ...q.question,
          score: baseScore + (index < remainingScore ? 1 : 0),
        })),
      });
    } else {
      setFormData({
        ...defaultFormData,
        role,
      });
    }
  }, [exam, role]);

  // 处理表单提交
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "验证失败",
        description: "请输入考试标题",
        variant: "destructive",
      });
      return;
    }

    if (formData.timeLimit < 1) {
      toast({
        title: "验证失败",
        description: "考试时长必须大于0分钟",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.passingScore < 0 ||
      formData.passingScore > formData.totalScore
    ) {
      toast({
        title: "验证失败",
        description: "及格分数必须在0和总分之间",
        variant: "destructive",
      });
      return;
    }

    if (formData.questions.length === 0) {
      toast({
        title: "验证失败",
        description: "请至少添加一道题目",
        variant: "destructive",
      });
      return;
    }

    // 验证总分
    const totalQuestionScore = formData.questions.reduce(
      (sum, q) => sum + q.score,
      0
    );
    if (totalQuestionScore !== formData.totalScore) {
      toast({
        title: "验证失败",
        description: "题目总分与考试总分不匹配",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const examInput: ExamInput = {
        title: formData.title,
        description: formData.description,
        role: formData.role,
        timeLimit: formData.timeLimit,
        passingScore: formData.passingScore,
        totalScore: formData.totalScore,
        status: formData.status,
        questions: formData.questions.map((q, index) => ({
          questionId: q.id,
          order: index + 1,
          score: q.score,
        })),
      };

      await onSaved(examInput);
      onClose();
    } catch (error) {
      console.error("提交考试表单失败:", error);
      toast({
        title: "保存失败",
        description:
          error instanceof Error ? error.message : "保存考试失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 重新分配分数
  const redistributeScores = (
    questions: Array<Question & { score: number }>,
    excludeIndex?: number
  ) => {
    const totalScore = formData.totalScore;
    const questionCount = questions.length;

    // 如果有排除的题目，需要先减去它的分数
    const remainingTotal =
      excludeIndex !== undefined
        ? totalScore - questions[excludeIndex].score
        : totalScore;
    const remainingCount =
      excludeIndex !== undefined ? questionCount - 1 : questionCount;

    if (remainingCount === 0) return questions;

    const baseScore = Math.floor(remainingTotal / remainingCount);
    const remainingScore = remainingTotal % remainingCount;

    return questions.map((q, index) => {
      if (index === excludeIndex) return q;
      const adjustedIndex =
        excludeIndex !== undefined && index > excludeIndex ? index - 1 : index;
      return {
        ...q,
        score: adjustedIndex < remainingScore ? baseScore + 1 : baseScore,
      };
    });
  };

  // 处理题目分数修改
  const handleScoreChange = (index: number, score: number) => {
    setFormData((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], score };

      // 重新分配其他题目的分数
      return {
        ...prev,
        questions: redistributeScores(newQuestions, index),
      };
    });
  };

  // 处理删除题目
  const handleDeleteQuestion = (index: number) => {
    setFormData((prev) => {
      const newQuestions = prev.questions.filter((_, i) => i !== index);
      // 重新分配分数
      return {
        ...prev,
        questions: redistributeScores(newQuestions),
      };
    });
  };

  // 处理选择题目
  const handleSelectQuestions = (selectedQuestions: Question[]) => {
    const newQuestions = selectedQuestions.map((q) => ({
      ...q,
      score: 0, // 临时分数，会在重新分配时更新
    }));

    setFormData((prev) => {
      const allQuestions = [...prev.questions, ...newQuestions];
      // 重新分配分数
      return {
        ...prev,
        questions: redistributeScores(allQuestions),
      };
    });
    setQuestionBankOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>{exam ? "编辑考试" : "新建考试"}</DialogTitle>
            <DialogDescription>
              {exam ? "修改考试内容和题目" : "创建新的考试并添加题目"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="space-y-6 p-6">
              {(exam?._count?.attempts ?? 0) > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">
                    已有考生参加此考试，无法修改考试内容。如需修改，请创建新的考试。
                  </p>
                </div>
              )}

              {/* 基本信息表单 */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  {/* 考试标题 */}
                  <div className="flex-[2] space-y-1.5">
                    <Label>考试标题</Label>
                    <Input
                      placeholder="请输入考试标题"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  {/* 考试描述 */}
                  <div className="flex-1 space-y-1.5">
                    <Label>
                      考试描述
                      <span className="text-sm text-muted-foreground ml-2">
                        (选填)
                      </span>
                    </Label>
                    <Input
                      placeholder="请输入考试描述"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* 考试角色 */}
                  <div className="w-[160px] space-y-1.5">
                    <Label>考试角色</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          role: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择角色" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="writer">文案顾问</SelectItem>
                        <SelectItem value="consultant">留学顾问</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* 时间限制 */}
                  <div className="w-[160px] space-y-1.5">
                    <Label>时间限制 (分钟)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={180}
                      value={formData.timeLimit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          timeLimit: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  {/* 及格分数 */}
                  <div className="w-[160px] space-y-1.5">
                    <Label>及格分数</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.passingScore}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          passingScore: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  {/* 总分 */}
                  <div className="w-[160px] space-y-1.5">
                    <Label>总分</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.totalScore}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          totalScore: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 题目列表 */}
              <div className="space-y-4">
                <div className="flex justify-end items-center mb-4">
                  <div>
                    共 {formData.questions.length} 题 / 总分{" "}
                    {formData.totalScore} 分
                  </div>
                </div>

                {formData.questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <div className="text-muted-foreground mb-4">暂无题目</div>
                    <Button
                      variant="default"
                      onClick={() => setQuestionBankOpen(true)}
                    >
                      <Database className="w-4 h-4 mr-2" />
                      从题库添加题目
                    </Button>
                  </div>
                ) : (
                  <>
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
                          {formData.questions.map((question, index) => (
                            <TableRow
                              key={question.id}
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
                                    {question.type === "single" && "单选题"}
                                    {question.type === "multiple" && "多选题"}
                                    {question.type === "text" && "问答题"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <QuestionEditorFactory
                                value={question}
                                onChange={(q) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    questions: prev.questions.map((oldQ, i) =>
                                      i === index
                                        ? {
                                            ...oldQ,
                                            content: q.content,
                                            answer: q.answer,
                                            explanation: q.explanation,
                                            options: q.options,
                                          }
                                        : oldQ
                                    ),
                                  }));
                                }}
                                hideScore={true}
                              />
                              <TableCell className="text-center align-middle py-2">
                                <Input
                                  type="number"
                                  value={question.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      index,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="w-20 h-7 mx-auto"
                                  min={0}
                                />
                              </TableCell>
                              <TableCell className="text-center align-middle py-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteQuestion(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-center mt-4">
                      {(exam?._count?.attempts ?? 0) === 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setQuestionBankOpen(true)}
                        >
                          <Database className="w-4 h-4 mr-2" />
                          继续添加题目
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background shrink-0">
            {(exam?._count?.attempts ?? 0) === 0 && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QuestionBankDialog
        open={questionBankOpen}
        onClose={() => setQuestionBankOpen(false)}
        onSelect={handleSelectQuestions}
        excludeQuestionIds={formData.questions.map((q) => q.id)}
      />
    </>
  );
}

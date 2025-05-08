"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { QuestionInput, QuestionDifficulty } from "@/types/quiz";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface QuestionFormProps {
  questions: QuestionInput[];
  onChange: (questions: QuestionInput[]) => void;
  quizTitle?: string;
}

export function QuestionForm({
  questions,
  onChange,
  quizTitle,
}: QuestionFormProps) {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const addQuestion = () => {
    const newIndex = questions.length + 1;
    onChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        content: `${quizTitle ? `【${quizTitle}】` : ""}第${newIndex}题：`,
        type: "text",
        answer: "",
        explanation: "",
        score: 10,
        difficulty: "medium" as QuestionDifficulty,
      },
    ]);
    setExpandedRows((prev) => ({
      ...prev,
      [questions.length]: true,
    }));
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionInput,
    value: string | number
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    onChange(newQuestions);
  };

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>题目内容</TableHead>
            <TableHead className="w-[100px]">分值</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question, index) => (
            <React.Fragment key={index}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRow(index)}
                  >
                    {expandedRows[index] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>{question.content}</TableCell>
                <TableCell>{question.score}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              {expandedRows[index] && (
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="p-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>题目类型</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) =>
                            updateQuestion(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择题目类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">填空题</SelectItem>
                            <SelectItem value="boolean">判断题</SelectItem>
                            <SelectItem value="single">单选题</SelectItem>
                            <SelectItem value="multiple">多选题</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>题目内容</Label>
                        <Textarea
                          value={question.content}
                          onChange={(e) =>
                            updateQuestion(index, "content", e.target.value)
                          }
                          placeholder="请输入题目内容"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>标准答案</Label>
                        {question.type === "boolean" ? (
                          <RadioGroup
                            value={question.answer}
                            onValueChange={(value) =>
                              updateQuestion(index, "answer", value)
                            }
                            className="flex items-center space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="true"
                                id={`true-${index}`}
                              />
                              <Label htmlFor={`true-${index}`}>正确</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="false"
                                id={`false-${index}`}
                              />
                              <Label htmlFor={`false-${index}`}>错误</Label>
                            </div>
                          </RadioGroup>
                        ) : (
                          <Textarea
                            value={question.answer}
                            onChange={(e) =>
                              updateQuestion(index, "answer", e.target.value)
                            }
                            placeholder="请输入标准答案"
                          />
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label>答案解析</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) =>
                            updateQuestion(index, "explanation", e.target.value)
                          }
                          placeholder="请输入答案解析（可选）"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>分值</Label>
                        <Input
                          type="number"
                          value={question.score}
                          onChange={(e) =>
                            updateQuestion(
                              index,
                              "score",
                              Number(e.target.value)
                            )
                          }
                          min={1}
                          max={100}
                          className="max-w-[200px]"
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <Button variant="outline" className="w-full" onClick={addQuestion}>
        <Plus className="mr-2 h-4 w-4" />
        添加题目
      </Button>
    </div>
  );
}

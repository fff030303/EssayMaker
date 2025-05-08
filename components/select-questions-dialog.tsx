"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question } from "@/types/quiz";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface SelectQuestionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (questions: Question[]) => void;
  excludeIds?: string[];
}

export function SelectQuestionsDialog({
  open,
  onClose,
  onSelect,
  excludeIds = [],
}: SelectQuestionsDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  // 加载题目列表
  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/questions");
      if (!response.ok) {
        throw new Error("加载题目列表失败");
      }
      const result = await response.json();
      setQuestions(result.data || []);
    } catch (error) {
      console.error("加载题目列表失败:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "获取题目列表失败，请重试",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadQuestions();
    }
  }, [open]);

  // 筛选题目
  const filteredQuestions = questions.filter((question) => {
    // 排除已选题目
    if (excludeIds.includes(question.id)) {
      return false;
    }

    // 类型筛选
    if (selectedType !== "all" && question.type !== selectedType) {
      return false;
    }

    // 难度筛选
    if (
      selectedDifficulty !== "all" &&
      question.difficulty !== selectedDifficulty
    ) {
      return false;
    }

    // 关键词搜索
    if (searchKeyword) {
      return (
        question.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        question.trainingTitle
          ?.toLowerCase()
          .includes(searchKeyword.toLowerCase())
      );
    }

    return true;
  });

  // 处理选择题目
  const handleSelect = () => {
    const selected = questions.filter((q) => selectedQuestions.has(q.id));
    onSelect(selected);
  };

  // 获取题目类型文本
  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case "single":
        return "单选题";
      case "multiple":
        return "多选题";
      case "boolean":
        return "判断题";
      case "text":
        return "填空题";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>选择题目</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 筛选器 */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索题目..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="题目类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="single">单选题</SelectItem>
                <SelectItem value="multiple">多选题</SelectItem>
                <SelectItem value="boolean">判断题</SelectItem>
                <SelectItem value="text">填空题</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedDifficulty}
              onValueChange={setSelectedDifficulty}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部难度</SelectItem>
                <SelectItem value="easy">简单</SelectItem>
                <SelectItem value="medium">中等</SelectItem>
                <SelectItem value="hard">困难</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 题目列表 */}
          <ScrollArea className="h-[calc(100vh-20rem)]">
            {isLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无符合条件的题目
              </div>
            ) : (
              <div className="space-y-2">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5"
                  >
                    <Checkbox
                      checked={selectedQuestions.has(question.id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedQuestions);
                        if (checked) {
                          newSelected.add(question.id);
                        } else {
                          newSelected.delete(question.id);
                        }
                        setSelectedQuestions(newSelected);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{question.content}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {getQuestionTypeText(question.type)}
                        </Badge>
                        <Badge variant="outline">{question.difficulty}</Badge>
                        {question.trainingTitle && (
                          <Badge
                            variant="outline"
                            className="max-w-[200px] truncate"
                          >
                            {question.trainingTitle}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              已选择 {selectedQuestions.size} 题
            </div>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSelect}
              disabled={selectedQuestions.size === 0}
            >
              确定
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Question } from "@/types/quiz";
import { Search, Edit, Trash } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface QuestionListProps {
  quizId?: string;
  mode?: "default" | "select";
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onSelectionChange?: (questions: Question[]) => void;
  excludeQuestionIds?: string[];
  refreshTrigger?: number;
  open?: boolean;
}

// 添加防抖hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function QuestionList({
  quizId,
  mode = "default",
  onEdit,
  onDelete,
  onSelectionChange,
  excludeQuestionIds = [],
  refreshTrigger = 0,
  open = false,
}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Record<number, Question[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedQuestionsCache, setSelectedQuestionsCache] = useState<
    Record<string, Question>
  >({});
  const { toast } = useToast();

  // 使用防抖的搜索值
  const debouncedSearch = useDebounce(search, 300);
  const debouncedTrainingSearch = useDebounce(trainingSearch, 300);

  // 加载题目数据
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(type !== "all" ? { type } : {}),
        ...(difficulty !== "all" ? { difficulty } : {}),
        ...(debouncedTrainingSearch
          ? { trainingSearch: debouncedTrainingSearch }
          : {}),
      });

      const response = await fetch(`/api/questions?${params}`);
      if (!response.ok) {
        throw new Error("获取题目列表失败");
      }

      const data = await response.json();

      // 过滤掉需要排除的题目
      const filteredQuestions = data.data.filter(
        (q: Question) => !excludeQuestionIds.includes(q.id)
      );

      // 保存当前页的题目到 allQuestions，并保持选中状态
      setAllQuestions((prev) => {
        const newAllQuestions = {
          ...prev,
          [page]: filteredQuestions,
        };
        return newAllQuestions;
      });

      setQuestions(filteredQuestions);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("加载题目失败:", error);
      toast({
        variant: "destructive",
        title: "获取题目列表失败",
        description: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  // 监听筛选条件变化
  useEffect(() => {
    // 只在筛选条件改变时重置状态，而不是在翻页时
    if (
      debouncedSearch !== "" ||
      type !== "all" ||
      difficulty !== "all" ||
      debouncedTrainingSearch !== ""
    ) {
      setAllQuestions({});
      setSelectedIds(new Set());
      setSelectedQuestionsCache({});
      // 重置页码
      setPage(1);
    }
    // 添加这行，确保条件变化时也加载数据
    loadQuestions();
  }, [debouncedSearch, type, difficulty, debouncedTrainingSearch]);

  // 监听页码变化和刷新触发器
  useEffect(() => {
    loadQuestions();
  }, [page, refreshTrigger]);

  // 添加初始化加载
  useEffect(() => {
    if (open) {
      loadQuestions();
    }
  }, [open]);

  // 监听选择变化
  useEffect(() => {
    if (mode === "select" && onSelectionChange) {
      const selectedQuestions = Array.from(selectedIds)
        .map((id) => selectedQuestionsCache[id])
        .filter(Boolean);
      onSelectionChange(selectedQuestions);
    }
  }, [selectedIds, selectedQuestionsCache, mode, onSelectionChange]);

  // 获取题目类型显示文本
  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      single: "单选题",
      multiple: "多选题",
      boolean: "判断题",
      text: "填空题",
    };
    return types[type] || type;
  };

  // 处理选择题目
  const handleSelect = (questionId: string) => {
    const newSelectedIds = new Set(selectedIds);
    const question = questions.find((q) => q.id === questionId);

    if (newSelectedIds.has(questionId)) {
      newSelectedIds.delete(questionId);
      const newCache = { ...selectedQuestionsCache };
      delete newCache[questionId];
      setSelectedQuestionsCache(newCache);
    } else if (question) {
      newSelectedIds.add(questionId);
      setSelectedQuestionsCache((prev) => ({
        ...prev,
        [questionId]: question,
      }));
    }
    setSelectedIds(newSelectedIds);
  };

  // 处理当前页全选
  const handleSelectCurrentPage = (checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    const newCache = { ...selectedQuestionsCache };

    questions.forEach((q) => {
      if (checked) {
        newSelectedIds.add(q.id);
        newCache[q.id] = q;
      } else {
        newSelectedIds.delete(q.id);
        delete newCache[q.id];
      }
    });

    setSelectedIds(newSelectedIds);
    setSelectedQuestionsCache(newCache);
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        variant: "destructive",
        title: "请选择要删除的题目",
      });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 道题目吗？`)) return;

    try {
      const response = await fetch("/api/questions/batch", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIds: Array.from(selectedIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "删除题目失败");
      }

      toast({
        title: "删除成功",
        description: `成功删除 ${data.count} 道题目`,
      });

      // 清空选中状态
      setSelectedIds(new Set());
      // 清空已加载的题目
      setAllQuestions({});
      // 刷新列表
      loadQuestions();
    } catch (error) {
      console.error("删除题目失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description:
          error instanceof Error ? error.message : "删除题目失败，请重试",
      });
    }
  };

  // 计算已加载题目的总数
  const loadedQuestionsCount = Object.values(allQuestions).flat().length;

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="搜索题目内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="搜索培训标题..."
            value={trainingSearch}
            onChange={(e) => setTrainingSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[120px]">
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
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[120px]">
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

      {/* 批量操作 */}
      {mode === "default" && selectedIds.size > 0 && (
        <div className="flex justify-between items-center">
          <div>
            已选择 {selectedIds.size} 题 / 已加载 {loadedQuestionsCount} 题
          </div>
          <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
            <Trash className="w-4 h-4 mr-2" />
            批量删除
          </Button>
        </div>
      )}

      {/* 题目列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {(mode === "default" || mode === "select") && (
                <TableHead className="w-[40px]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={
                              questions.length > 0 &&
                              questions.every((q) => selectedIds.has(q.id))
                            }
                            onCheckedChange={handleSelectCurrentPage}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>选择当前页题目</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              <TableHead className="w-[120px] text-center">类型</TableHead>
              <TableHead>题目内容</TableHead>
              <TableHead className="w-[100px] text-center">难度</TableHead>
              <TableHead className="w-[80px] text-center">分值</TableHead>
              <TableHead className="w-[200px]">培训标题</TableHead>
              {mode === "default" && (
                <TableHead className="w-[100px] text-right">操作</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow
                key={question.id}
                onClick={() => mode === "select" && handleSelect(question.id)}
                className={cn(
                  "group hover:bg-muted/50 cursor-pointer",
                  mode === "select" &&
                    selectedIds.has(question.id) &&
                    "bg-muted"
                )}
              >
                {(mode === "default" || mode === "select") && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedIds.has(question.id)}
                        onCheckedChange={() => handleSelect(question.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-center">
                  <Badge variant="outline">{getTypeText(question.type)}</Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <span className="line-clamp-2">{question.content}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-md whitespace-normal">
                          {question.content}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      question.difficulty === "easy" && "bg-green-50",
                      question.difficulty === "medium" && "bg-yellow-50",
                      question.difficulty === "hard" && "bg-red-50"
                    )}
                  >
                    {question.difficulty === "easy" && "简单"}
                    {question.difficulty === "medium" && "中等"}
                    {question.difficulty === "hard" && "困难"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{question.score}</TableCell>
                <TableCell>{question.trainingTitle}</TableCell>
                {mode === "default" && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(question);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(question);
                          }}
                          className="hover:bg-red-100"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      <div className="flex justify-between items-center">
        <div>
          {mode === "select" ? (
            <>
              已选择 {selectedIds.size} 题 / 已加载 {loadedQuestionsCount} 题 /
            </>
          ) : null}
          共 {total} 题
        </div>
        <DataTablePagination
          totalItems={total}
          pageSize={pageSize}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

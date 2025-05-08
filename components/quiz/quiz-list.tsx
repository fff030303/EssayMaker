"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Quiz } from "@/types/quiz";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

interface QuizListProps {
  onEdit: (quiz: Quiz) => void;
  trainingId?: string;
}

export function QuizList({ onEdit, trainingId }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  // 检查用户是否有编辑权限
  const canEdit = session?.user?.role && session.user.role !== 'user';

  useEffect(() => {
    fetchQuizzes();
  }, [trainingId]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = trainingId ? `/api/quiz?trainingId=${trainingId}` : '/api/quiz';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("获取考试列表失败");
      }
      const data = await response.json();
      setQuizzes(data);
    } catch (error) {
      console.error("获取考试列表失败:", error);
      setError("获取考试列表失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有删除考试的权限",
      });
      return;
    }

    if (!confirm("确定要删除这个考试吗？")) {
      return;
    }

    try {
      console.log("开始删除考试:", id);
      const response = await fetch(`/api/quiz?id=${id}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      console.log("删除响应:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "删除考试失败");
      }

      toast({
        title: "删除成功",
        description: "考试已被删除",
      });
      
      console.log("开始重新加载列表");
      await fetchQuizzes(); // 重新加载列表
    } catch (error) {
      console.error("删除考试失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除考试时出现错误，请重试",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (quizzes.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">暂无考试数据</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>时间限制</TableHead>
          <TableHead>通过分数</TableHead>
          <TableHead>题目数量</TableHead>
          <TableHead>答题次数</TableHead>
          <TableHead>最近答题</TableHead>
          {canEdit && <TableHead>操作</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {quizzes.map((quiz) => (
          <TableRow key={quiz.id}>
            <TableCell>{quiz.title}</TableCell>
            <TableCell>{quiz.description}</TableCell>
            <TableCell>{quiz.timeLimit} 分钟</TableCell>
            <TableCell>{quiz.passingScore} 分</TableCell>
            <TableCell>{quiz.questions?.length || 0}</TableCell>
            <TableCell>{quiz.attempts?.length || 0}</TableCell>
            <TableCell>
              {quiz.attempts?.[0]?.endTime ? (
                <div className="text-sm">
                  <div>{new Date(quiz.attempts[0].endTime).toLocaleDateString()}</div>
                  <div className="text-muted-foreground">
                    {quiz.attempts[0].passed ? '通过' : '未通过'}
                    {quiz.attempts[0].totalScore !== null && ` (${quiz.attempts[0].totalScore}分)`}
                  </div>
                </div>
              ) : '暂无答题'}
            </TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(quiz)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => quiz.id && handleDelete(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 
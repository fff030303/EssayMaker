"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Settings,
  Clock,
  Award,
  AlertCircle,
  History,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Exam } from "@/types/exam";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/lib/logger";

interface ExamPageProps {
  title: string;
  description?: string;
  className?: string;
  role: string;
}

interface AttemptSummary {
  id: string;
  status: "not_started" | "ongoing" | "submitted";
  score?: number;
  passed?: boolean;
  examId: string;
  createdAt: string;
}

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

export function ExamPage({
  title,
  description,
  className = "",
  role,
}: ExamPageProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptSummary>>({});
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // 检查用户是否有管理权限
  const canManage =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  // 加载考试列表和考试记录
  const loadExams = async () => {
    try {
      setLoading(true);

      const [examsResponse, attemptsResponse] = await Promise.all([
        fetch(`/api/exams?role=${role}`),
        fetch(`/api/exam-attempts`),
      ]);

      if (!examsResponse.ok || !attemptsResponse.ok) {
        const examsText = await examsResponse.text();
        const attemptsText = await attemptsResponse.text();
        logger.clientError(
          "加载考试数据失败",
          `考试列表: ${examsText}, 考试记录: ${attemptsText}`,
          {
            method: "GET",
            examsStatus: examsResponse.status,
            attemptsStatus: attemptsResponse.status,
            examsText,
            attemptsText,
          }
        );
        throw new Error(
          `加载数据失败: 考试列表(${examsResponse.status}), 考试记录(${attemptsResponse.status})`
        );
      }

      const examsData = await examsResponse.json();
      const attemptsData = await attemptsResponse.json();

      // 将考试记录转换为以examId为key的对象
      const attemptsMap = attemptsData.data.reduce(
        (acc: Record<string, AttemptSummary>, attempt: any) => {
          // 只保存最新的考试记录
          if (
            !acc[attempt.examId] ||
            new Date(attempt.createdAt) >
              new Date(acc[attempt.examId].createdAt)
          ) {
            acc[attempt.examId] = {
              id: attempt.id,
              status: attempt.status,
              score: attempt.totalScore,
              passed: attempt.passed,
              examId: attempt.examId,
              createdAt: attempt.createdAt,
            };
          }
          return acc;
        },
        {}
      );

      setExams(examsData.data || []);
      setAttempts(attemptsMap);
    } catch (error) {
      logger.clientError(
        "加载考试数据失败",
        error instanceof Error ? error.message : String(error),
        {
          method: "GET",
          error: error instanceof Error ? error.message : String(error),
        }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [role]);

  // 开始考试
  const handleStartExam = async (examId: string) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const response = await fetch("/api/exam-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.clientError("开始考试失败", result.error || "未知错误", {
          method: "POST",
          examId,
          status: response.status,
          error: result.error,
        });
        toast({
          variant: "destructive",
          title: "开始考试失败",
          description: result.error || "请稍后重试",
        });
        return;
      }

      if (result.message) {
        toast({
          title: "提示",
          description: result.message,
        });
      }

      // 将考试记录ID存储在URL中
      router.push(
        `/console/exam${
          role === "consultant" ? "-consultant" : ""
        }/${examId}?attemptId=${result.id}`
      );
    } catch (error) {
      logger.clientError(
        "开始考试失败",
        error instanceof Error ? error.message : String(error),
        {
          method: "POST",
          examId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      toast({
        variant: "destructive",
        title: "开始考试失败",
        description: "网络错误，请稍后重试",
      });
      setSubmitting(false);
    }
  };

  // 获取考试状态标签
  const getStatusBadge = (exam: Exam, attempt?: AttemptSummary) => {
    // 如果考试未激活,直接返回未激活状态
    if (exam.status !== "active") {
      return <Badge variant="secondary">未激活</Badge>;
    }

    let status = "未开始";
    let variant: BadgeVariant = "warning";

    if (!attempt) {
      return <Badge variant="warning">未开始</Badge>;
    }

    switch (attempt.status) {
      case "submitted":
        status = attempt.passed ? "已通过" : "未通过";
        variant = attempt.passed ? "default" : "destructive";
        break;
      case "ongoing":
        status = "进行中";
        variant = "outline";
        break;
      default:
        break;
    }

    return <Badge variant={variant}>{status}</Badge>;
  };

  // 筛选考试
  const filteredExams = exams.filter((exam) => {
    if (selectedStatus !== "all") {
      const attempt = attempts[exam.id];
      if (
        selectedStatus === "completed" &&
        (!attempt || attempt.status !== "submitted")
      ) {
        return false;
      }
      if (
        selectedStatus === "in_progress" &&
        (!attempt || attempt.status !== "ongoing")
      ) {
        return false;
      }
      if (selectedStatus === "not_started" && attempt) {
        return false;
      }
    }
    if (searchKeyword) {
      return (
        exam.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-lg text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {canManage && (
          <Link
            href={`/console/${
              role === "consultant" ? "training-consultant" : "training"
            }/exam-manage`}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              管理考试
            </Button>
          </Link>
        )}
      </div>

      {/* 筛选器 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索考试..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="考试状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有状态</SelectItem>
            <SelectItem value="not_started">未开始</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 考试列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.map((exam) => {
          const attempt = attempts[exam.id];
          return (
            <Card key={exam.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 h-[70px]">
                <h3 className="text-lg font-semibold line-clamp-3 flex-1">
                  {exam.title}
                </h3>
                <div className="flex-shrink-0 mt-1">
                  {getStatusBadge(exam, attempt)}
                </div>
              </div>
              {exam.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {exam.description}
                </p>
              )}
              <div className="mt-6 space-y-2 flex-1">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">时长：</span>
                  {exam.timeLimit}分钟
                </div>
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">总分：</span>
                  {exam.totalScore}分
                </div>
                <div className="flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">及格分：</span>
                  {exam.passingScore}分
                </div>
                <div className="flex items-center text-sm font-medium">
                  <span className="mr-2">得分：</span>
                  {attempt?.status === "submitted" ? (
                    <span
                      className={
                        attempt.passed ? "text-green-600" : "text-red-600"
                      }
                    >
                      {attempt.score}分
                    </span>
                  ) : (
                    <span className="text-muted-foreground">未考试</span>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="flex-1"
                        disabled={
                          (attempt?.status === "submitted" && attempt.passed) ||
                          submitting
                        }
                        onClick={() => handleStartExam(exam.id)}
                      >
                        {submitting
                          ? "处理中..."
                          : attempt?.status === "submitted"
                          ? attempt.passed
                            ? "已通过"
                            : "重新考试"
                          : attempt?.status === "ongoing"
                          ? "继续考试"
                          : "开始考试"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {attempt?.status === "submitted"
                        ? attempt.passed
                          ? "您已通过此考试，无需重复参加"
                          : "您未通过考试，点击重新参加"
                        : attempt?.status === "ongoing"
                        ? "您有未完成的考试，点击继续"
                        : `点击开始${exam.timeLimit}分钟的考试`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/console/exam${
                          role === "consultant" ? "-consultant" : ""
                        }/${exam.id}/history`}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className={
                            attempt?.status === "submitted" ? "" : "hidden"
                          }
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>查看历史记录</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          没有找到符合条件的考试
        </div>
      )}
    </div>
  );
}

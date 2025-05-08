"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { ExamResultClient } from "@/app/console/exam/[id]/result/client";

interface ExamAttempt {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  totalScore: number;
  passed: boolean;
}

interface ExamHistoryClientProps {
  examId: string;
  role?: "writer" | "consultant";
}

export function ExamHistoryClient({
  examId,
  role = "writer",
}: ExamHistoryClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(
    null
  );

  // 从路径中确定当前的角色
  const currentRole = pathname?.includes("exam-consultant")
    ? "consultant"
    : "student";

  useEffect(() => {
    // 检查用户是否已登录
    if (status === "unauthenticated") {
      router.push("/workspace-entry");
      return;
    }

    // 检查用户是否有权限查看结果
    if (!session?.user) {
      router.push("/console");
      return;
    }

    // 加载考试记录
    const loadAttempts = async () => {
      try {
        const response = await fetch(`/api/exam-attempts?examId=${examId}`);
        if (!response.ok) {
          throw new Error("获取考试记录失败");
        }
        const data = await response.json();
        // 只显示已提交的考试记录
        setAttempts(
          data.data.filter(
            (attempt: ExamAttempt) => attempt.status === "submitted"
          )
        );
      } catch (error) {
        setError("加载历史记录失败，请重试");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadAttempts();
    }
  }, [status, session, router, examId]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
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

  // 根据当前路径决定返回路径
  const getReturnPath = () => {
    return currentRole === "consultant"
      ? "/console/exam-consultant"
      : "/console/exam";
  };

  if (selectedAttemptId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedAttemptId(null)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            返回历史记录
          </Button>
        </div>
        <ExamResultClient
          examId={examId}
          attemptId={selectedAttemptId}
          role={role}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">考试历史记录</h2>
        <Button variant="outline" onClick={() => router.push(getReturnPath())}>
          返回考试列表
        </Button>
      </div>

      {attempts.length === 0 ? (
        <Card className="p-4">
          <div className="text-center text-muted-foreground">暂无考试记录</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card
              key={attempt.id}
              className="p-4 hover:bg-muted/50 cursor-pointer"
              onClick={() => setSelectedAttemptId(attempt.id)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    考试时间：
                    {new Date(attempt.startTime).toLocaleString()}
                  </div>
                  <div className="font-medium">
                    得分：{attempt.totalScore}
                    <span
                      className={
                        attempt.passed ? "text-success" : "text-destructive"
                      }
                    >
                      （{attempt.passed ? "通过" : "未通过"}）
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  查看详情
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

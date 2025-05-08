"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, History } from "lucide-react";
import { Exam } from "@/types/exam";
import Link from "next/link";

interface ExamCardProps {
  exam: Exam;
  type: "writer" | "consultant";
  userStatus?: "not_started" | "in_progress" | "completed";
  score?: number;
  passed?: boolean;
}

const statusMap = {
  not_started: { label: "未开始", color: "secondary" },
  in_progress: { label: "进行中", color: "outline" },
  completed: { label: "已完成", color: "default" },
} as const;

export function ExamCard({
  exam,
  type,
  userStatus = "not_started",
  score,
  passed,
}: ExamCardProps) {
  const status = statusMap[userStatus];
  const examPath = `/training${type === "consultant" ? "-consultant" : ""}/exams/${exam.id}`;
  const historyPath = `/console/exam${type === "consultant" ? "-consultant" : ""}/${exam.id}/history`;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{exam.title}</CardTitle>
          <div className="flex items-center gap-2">
            {exam.randomConfig?.enabled && (
              <Badge variant="outline" className="bg-muted">
                随机抽题
              </Badge>
            )}
            <Badge
              variant={status.color as "default" | "secondary" | "outline"}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        {exam.description && (
          <p className="text-sm text-muted-foreground">{exam.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{exam.timeLimit}分钟</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>及格分数：{exam.passingScore}分</span>
          </div>
        </div>
        {exam.randomConfig?.enabled && (
          <div className="mt-2 text-sm text-muted-foreground">
            每次抽取{exam.randomConfig.questionCount}道题目
          </div>
        )}
        <div className="mt-2 pt-2 border-t">
          <p className="text-sm">
            得分：
            {userStatus === "completed" ? (
              <span className={passed ? "text-green-600" : "text-red-600"}>
                {score}分
                <span className="text-muted-foreground">
                  （{passed ? "已通过" : "未通过"}）
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">未考试</span>
            )}
          </p>
        </div>
      </CardContent>
      <CardFooter className="mt-auto space-x-2">
        {userStatus === "not_started" && (
          <>
            <Link href={examPath} className="flex-1">
              <Button className="w-full">开始考试</Button>
            </Link>
            <Link href={historyPath} className="flex-shrink-0">
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
        {userStatus === "in_progress" && (
          <Link href={examPath} className="w-full">
            <Button className="w-full">继续考试</Button>
          </Link>
        )}
        {userStatus === "completed" && (
          <Link href={`${examPath}/result`} className="w-full">
            <Button variant="secondary" className="w-full">
              查看结果
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Check, X, Wand2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { Interview } from "@/types/interview";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InterviewRewritingDialog } from "@/components/interview/interview-rewriting-dialog";
import { useState } from "react";

interface InterviewCardProps {
  interview: Interview;
}

// 审核面经
async function updateInterviewStatus(
  id: string,
  status: "approved" | "rejected"
) {
  const response = await fetch(`/api/interviews/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "审核失败");
  }

  return response.json();
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();
  const [showRewritingDialog, setShowRewritingDialog] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewrittenInterview, setRewrittenInterview] = useState<{
    standardized: Interview;
    confidence: number;
  } | null>(null);

  // 等待 session 加载完成
  const isLoading = sessionStatus === "loading";

  // 检查用户权限
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  // 记录用户角色,用于调试
  console.log("Current user role:", session?.user?.role);

  const { mutate: approveInterview, isPending: isApproving } = useMutation({
    mutationFn: () => updateInterviewStatus(interview.id, "approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("已通过审核");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "审核失败，请重试";
      console.error("Approve error:", error);
      toast.error(message);
    },
  });

  const { mutate: rejectInterview, isPending: isRejecting } = useMutation({
    mutationFn: () => updateInterviewStatus(interview.id, "rejected"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("已拒绝");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "操作失败，请重试";
      console.error("Reject error:", error);
      toast.error(message);
    },
  });

  // 更新面经内容
  const handleUpdateInterview = async (standardizedInterview: Interview) => {
    try {
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(standardizedInterview),
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      await queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("面经已更新");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败，请重试");
      throw error;
    }
  };

  const handleRewrite = async () => {
    setIsRewriting(true);
    try {
      const response = await fetch("/api/interviews/rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: interview.country,
          university: interview.university,
          program: interview.program,
          majorCategory: interview.majorCategory,
          targetDegree: interview.targetDegree,
        }),
      });

      if (!response.ok) {
        throw new Error("重写请求失败");
      }

      const result = await response.json();
      setRewrittenInterview({
        standardized: {
          ...result.standardized,
          interviewContent: interview.interviewContent,
        },
        confidence: result.confidence,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "重写面经时出错");
    } finally {
      setIsRewriting(false);
    }
  };

  // 获取状态徽章的变体和文本
  const getBadgeInfo = (status: string) => {
    switch (status) {
      case "approved":
        return null;
      case "rejected":
        return { variant: "destructive" as const, text: "已拒绝" };
      default:
        return { variant: "secondary" as const, text: "待审核" };
    }
  };

  const badgeInfo = getBadgeInfo(interview.status);

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {interview.university}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {interview.program}
              </p>
            </div>
            {isAdmin && badgeInfo && (
              <Badge variant={badgeInfo.variant} className="shrink-0">
                {badgeInfo.text}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="secondary" className="truncate max-w-[120px]">
                {interview.country}
              </Badge>
              <Badge variant="secondary" className="truncate max-w-[120px]">
                {interview.majorCategory}
              </Badge>
              <Badge variant="secondary" className="truncate max-w-[120px]">
                {interview.targetDegree === "UNDERGRADUATE"
                  ? "本科"
                  : interview.targetDegree === "MASTER"
                    ? "硕士"
                    : interview.targetDegree === "PHD"
                      ? "博士"
                      : "其他"}
              </Badge>
              <Badge variant="secondary" className="truncate max-w-[120px]">
                {format(new Date(interview.interviewDate), "yyyy年", {
                  locale: zhCN,
                })}
              </Badge>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer group">
                  <div className="relative">
                    <p className="line-clamp-4 text-sm text-muted-foreground mb-2">
                      {interview.interviewContent}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
                  </div>
                  <div className="flex items-center justify-center mt-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    <span>See More</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>面试详情</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full space-y-4">
                  {/* 基本信息区域：根据状态决定是否分栏 */}
                  <div
                    className={`grid ${interview.status === "pending" ? "grid-cols-2" : "grid-cols-1"} gap-4`}
                  >
                    {/* 左侧：原始信息 */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">基本信息</h4>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {interview.university}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {interview.program}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge
                          variant="secondary"
                          className="truncate max-w-[120px]"
                        >
                          {interview.country}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="truncate max-w-[120px]"
                        >
                          {interview.majorCategory}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="truncate max-w-[120px]"
                        >
                          {interview.targetDegree === "UNDERGRADUATE"
                            ? "本科"
                            : interview.targetDegree === "MASTER"
                              ? "硕士"
                              : interview.targetDegree === "PHD"
                                ? "博士"
                                : "其他"}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="truncate max-w-[120px]"
                        >
                          {format(new Date(interview.interviewDate), "yyyy年", {
                            locale: zhCN,
                          })}
                        </Badge>
                      </div>
                    </div>

                    {/* 右侧：只在待审核状态显示标准化信息 */}
                    {interview.status === "pending" && (
                      <div className="space-y-4 border-l pl-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium">标准化信息</h4>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleRewrite}
                              disabled={isRewriting}
                            >
                              {isRewriting ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  重写中...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-4 w-4 mr-1" />
                                  重写
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {rewrittenInterview ? (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {rewrittenInterview.standardized.university}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {rewrittenInterview.standardized.program}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <Badge
                                variant="secondary"
                                className="truncate max-w-[120px]"
                              >
                                {rewrittenInterview.standardized.country}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="truncate max-w-[120px]"
                              >
                                {rewrittenInterview.standardized.majorCategory}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="truncate max-w-[120px]"
                              >
                                {rewrittenInterview.standardized
                                  .targetDegree === "UNDERGRADUATE"
                                  ? "本科"
                                  : rewrittenInterview.standardized
                                        .targetDegree === "MASTER"
                                    ? "硕士"
                                    : rewrittenInterview.standardized
                                          .targetDegree === "PHD"
                                      ? "博士"
                                      : "其他"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              置信度：
                              {(rewrittenInterview.confidence * 100).toFixed(1)}
                              %
                            </div>
                            {isAdmin && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateInterview(
                                    rewrittenInterview.standardized
                                  )
                                }
                              >
                                应用更改
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            点击"重写"按钮生成标准化内容
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 面试内容：全宽显示 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">面试内容</h4>
                    <div className="whitespace-pre-wrap">
                      {interview.interviewContent}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    提供者：{interview.provider}
                  </div>
                </div>

                {isAdmin && (
                  <DialogFooter className="flex gap-2 mt-4 border-t pt-4">
                    {interview.status === "pending" ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => rejectInterview()}
                          disabled={isRejecting || isApproving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                        <Button
                          onClick={() => approveInterview()}
                          disabled={isRejecting || isApproving}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                      </>
                    ) : null}
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {interview.provider}
            </span>
            <Button variant="ghost" size="sm" className="gap-1 shrink-0">
              <ThumbsUp className="h-4 w-4" />
              <span>{interview._count.likes}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <InterviewRewritingDialog
        interview={interview}
        open={showRewritingDialog}
        onOpenChange={setShowRewritingDialog}
        onConfirm={handleUpdateInterview}
      />
    </>
  );
}

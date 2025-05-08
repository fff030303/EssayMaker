import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Interview } from "@/types/interview";
import { toast } from "sonner";

interface InterviewRewritingDialogProps {
  interview: Interview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (standardizedInterview: Interview) => Promise<void>;
}

export function InterviewRewritingDialog({
  interview,
  open,
  onOpenChange,
  onConfirm,
}: InterviewRewritingDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenInterview, setRewrittenInterview] = useState<{
    standardized: Interview;
    confidence: number;
  } | null>(null);

  const handleRewrite = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!rewrittenInterview) return;

    try {
      await onConfirm(rewrittenInterview.standardized);
      toast.success("面经已更新");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新面经时出错");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>面经标准化</DialogTitle>
          <DialogDescription>查看并确认标准化后的面经内容</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-medium">原始内容</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">国家/地区：</span>
                {interview.country}
              </p>
              <p>
                <span className="font-medium">学校：</span>
                {interview.university}
              </p>
              <p>
                <span className="font-medium">申请项目：</span>
                {interview.program}
              </p>
              <p>
                <span className="font-medium">专业类别：</span>
                {interview.majorCategory}
              </p>
              <p>
                <span className="font-medium">学历项目：</span>
                {interview.targetDegree}
              </p>
              <div>
                <p className="font-medium">面试内容：</p>
                <p className="whitespace-pre-wrap">
                  {interview.interviewContent}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">标准化内容</h3>
            {rewrittenInterview ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">国家/地区：</span>
                  {rewrittenInterview.standardized.country}
                </p>
                <p>
                  <span className="font-medium">学校：</span>
                  {rewrittenInterview.standardized.university}
                </p>
                <p>
                  <span className="font-medium">申请项目：</span>
                  {rewrittenInterview.standardized.program}
                </p>
                <p>
                  <span className="font-medium">专业类别：</span>
                  {rewrittenInterview.standardized.majorCategory}
                </p>
                <p>
                  <span className="font-medium">学历项目：</span>
                  {rewrittenInterview.standardized.targetDegree}
                </p>
                <div>
                  <p className="font-medium">面试内容：</p>
                  <p className="whitespace-pre-wrap">
                    {rewrittenInterview.standardized.interviewContent}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    置信度：{(rewrittenInterview.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                点击"重写"按钮生成标准化内容
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          {!rewrittenInterview ? (
            <Button onClick={handleRewrite} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              重写
            </Button>
          ) : (
            <Button onClick={handleConfirm}>确认更新</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

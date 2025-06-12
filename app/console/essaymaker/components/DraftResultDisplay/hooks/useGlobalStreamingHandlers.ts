/**
 * 全局流式生成控制 Hook
 * 管理暂停、恢复、停止等操作
 */

"use client";

import { useToast } from "@/hooks/use-toast";
import { useGlobalStreamResponse } from "../../../hooks/useGlobalStreamResponse";

interface UseGlobalStreamingHandlersProps {
  taskId?: string;
}

export function useGlobalStreamingHandlers({
  taskId,
}: UseGlobalStreamingHandlersProps) {
  const { toast } = useToast();
  const { pauseGlobalStream, resumeGlobalStream, stopGlobalStream } =
    useGlobalStreamResponse();

  // 暂停全局流式生成
  const handlePauseGlobalStream = () => {
    if (taskId) {
      pauseGlobalStream(taskId);
      toast({
        title: "已暂停",
        description: "生成已暂停，您可以在其他页面恢复",
      });
    }
  };

  // 恢复全局流式生成
  const handleResumeGlobalStream = () => {
    if (taskId) {
      resumeGlobalStream(taskId);
      toast({
        title: "正在恢复",
        description: "正在恢复生成，请稍候",
      });
    }
  };

  // 停止全局流式生成
  const handleStopGlobalStream = () => {
    if (taskId) {
      stopGlobalStream(taskId);
      toast({
        title: "已停止",
        description: "生成已停止并清理",
      });
    }
  };

  return {
    handlePauseGlobalStream,
    handleResumeGlobalStream,
    handleStopGlobalStream,
  };
}

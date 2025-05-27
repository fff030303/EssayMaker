import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { DisplayResult } from "../../../types";
import { useStreamResponse } from "../../../hooks/useStreamResponse";

export function useCVDraft() {
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();

  const generateDraft = async (
    reportResult: DisplayResult,
    onFormattedResumeChange: (result: DisplayResult) => void,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) => {
    console.log("开始生成简历...");
    console.log("当前结果:", reportResult);

    if (!reportResult || !reportResult.content) {
      console.log("没有结果或内容，显示错误提示");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取简历分析报告",
      });
      return;
    }

    setIsGeneratingDraft(true);

    // 显示处理中提示
    toast({
      title: "正在生成",
      description: "简历初稿正在生成中...",
    });

    try {
      console.log("调用格式化简历API...");
      // 调用格式化简历API
      const response = await apiService.formatResume(
        reportResult.content,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );

      console.log("API响应:", response);

      // 检查响应类型
      if (response instanceof ReadableStream) {
        console.log("开始处理流式响应...");

        await processStream(response, {
          onUpdate: (result) => {
            onFormattedResumeChange({
              ...result,
              currentStep: result.currentStep || "简历生成中",
            });
          },
          onComplete: (result) => {
            setIsGeneratingDraft(false);
            onFormattedResumeChange({
              ...result,
              currentStep: "简历生成完成",
            });
            toast({
              title: "生成成功",
              description: "简历已生成完成",
            });
          },
          onError: (error) => {
            console.error("生成简历时出错:", error);
            toast({
              variant: "destructive",
              title: "生成失败",
              description: "生成简历时发生错误，请重试",
            });
            onFormattedResumeChange({
              content: `生成简历初稿时出错: ${error}`,
              steps: [],
              timestamp: new Date().toISOString(),
              isComplete: true,
              currentStep: "出错",
            });
          },
          realtimeTypewriter: true, // 启用实时接收+逐字显示模式
          charDelay: 1, // 字符显示间隔1毫秒
        });
      } else {
        // 处理非流式响应
        console.log("接收到非流式响应");

        let content = "";
        if (typeof response === "string") {
          content = response;
        } else if (response && typeof response === "object") {
          // 使用类型断言和可选链访问content属性
          const responseObj = response as any;
          content = responseObj?.content || JSON.stringify(response);
        }

        setIsGeneratingDraft(false);

        onFormattedResumeChange({
          content,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "简历生成完成",
        });

        toast({
          title: "生成成功",
          description: "简历已生成完成",
        });
      }
    } catch (error) {
      console.error("生成简历初稿时出错:", error);
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "生成简历初稿时发生错误，请重试",
      });

      onFormattedResumeChange({
        content: `生成简历初稿时出错: ${error}`,
        steps: [],
        timestamp: new Date().toISOString(),
        isComplete: true,
        currentStep: "出错",
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  return {
    generateDraft,
    isGeneratingDraft,
  };
}

"use client";

import { Dispatch, SetStateAction } from "react";
import { DisplayResult } from "../../types";
import { apiService } from "@/app/console/essaymaker/api";

interface UseThirdStepProps {
  result: DisplayResult | null;
  secondStepInput: string;
  secondStepResult: DisplayResult | null;
  setThirdStepLoading: Dispatch<SetStateAction<boolean>>;
  setFinalResult: Dispatch<SetStateAction<DisplayResult | null>>;
  handleStepChange: (step: number) => void;
  toast: any; // 使用any临时替代
}

export function useThirdStep({
  result,
  secondStepInput,
  secondStepResult,
  setThirdStepLoading,
  setFinalResult,
  handleStepChange,
  toast,
}: UseThirdStepProps) {
  const handleFinalGeneration = async () => {
    if (!result?.content || !secondStepInput || !secondStepResult?.content) {
      toast({
        title: "错误",
        description: "请确保完成前两步操作",
        variant: "destructive",
      });
      return;
    }

    try {
      setThirdStepLoading(true);
      setFinalResult({
        content: "",
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep: "正在生成最终文章...",
        isComplete: false,
      });

      // 切换到第三步
      handleStepChange(3);

      console.log("第三步API请求参数:", {
        program_info: result.content,
        original_ps: secondStepInput,
        rewrite_strategy: secondStepResult.content,
      });

      const stream = await apiService.streamFinalPS({
        program_info: result.content,
        original_ps: secondStepInput,
        rewrite_strategy: secondStepResult.content,
      });

      console.log("第三步API响应流:", stream);

      if (!stream) {
        throw new Error("无法获取响应流");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = ""; // 存储累积的内容

      // 合并步骤的简化逻辑
      let mergedSteps: string[] = [];
      let lastContentStepIndex = -1;
      let currentStep = "正在生成最终文章...";

      while (true) {
        const { done, value } = await reader.read();
        console.log("第三步数据读取:", {
          done,
          value: value ? "有数据" : "无数据",
        });
        if (done) break;

        const chunk = decoder.decode(value);
        console.log(
          "第三步解码数据片段:",
          chunk.substring(0, 100) + (chunk.length > 100 ? "..." : "")
        );
        buffer += chunk;
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("第三步解析的JSON数据:", data);

              switch (data.type) {
                case "step":
                  // 更新当前步骤
                  currentStep = data.content;

                  // 检查是否为"开始分析查询"步骤，如果是则清空累积内容
                  if (data.content.includes("开始分析查询")) {
                    accumulatedContent = ""; // 清空累积内容
                  }

                  // 检查是否为生成内容步骤
                  if (data.content && data.content.includes("生成内容")) {
                    // 更新现有的生成内容步骤
                    if (lastContentStepIndex >= 0) {
                      mergedSteps[lastContentStepIndex] = data.content;
                    } else {
                      // 添加新的生成内容步骤
                      lastContentStepIndex = mergedSteps.length;
                      mergedSteps.push(data.content);
                    }
                  } else {
                    // 添加其他类型的步骤
                    mergedSteps.push(data.content);
                  }

                  // 更新结果
                  setFinalResult((prev) => ({
                    ...prev!,
                    currentStep,
                    steps: [...mergedSteps],
                    // 如果是"开始分析查询"步骤，则清空内容字段
                    ...(data.content.includes("开始分析查询")
                      ? { content: "" }
                      : {}),
                  }));
                  break;

                case "content":
                  // 累积内容而不是每次都创建新对象
                  accumulatedContent += data.content;
                  setFinalResult((prev) => ({
                    ...prev!,
                    content: accumulatedContent,
                  }));
                  break;

                case "complete":
                  setFinalResult((prev) => ({
                    ...prev!,
                    isComplete: true,
                    currentStep: undefined,
                  }));
                  toast({
                    title: "成功",
                    description: "最终文章生成完成",
                  });
                  break;

                case "error":
                  toast({
                    title: "错误",
                    description: data.content,
                    variant: "destructive",
                  });
                  setFinalResult((prev) => ({
                    ...prev!,
                    isComplete: true,
                    currentStep: `错误: ${data.content}`,
                  }));
                  break;
              }
            } catch (e) {
              console.error("解析事件数据失败:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("流式处理失败:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "处理失败",
        variant: "destructive",
      });
    } finally {
      setThirdStepLoading(false);
    }
  };

  return {
    handleFinalGeneration,
  };
}

"use client";

import { Dispatch, SetStateAction, ChangeEvent } from "react";
import { DisplayResult } from "../../types";
import { apiService } from "@/lib/api";

interface UseSecondStepProps {
  result: DisplayResult | null;
  secondStepInput: string;
  setSecondStepInput: Dispatch<SetStateAction<string>>;
  setSecondStepLoading: Dispatch<SetStateAction<boolean>>;
  setSecondStepResult: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any; // 使用any临时替代
}

export function useSecondStep({
  result,
  secondStepInput,
  setSecondStepInput,
  setSecondStepLoading,
  setSecondStepResult,
  toast,
}: UseSecondStepProps) {
  // 处理第二步提交
  const handleSecondStepSubmit = async () => {
    if (!result?.content || !secondStepInput.trim()) {
      toast({
        title: "错误",
        description: "请确保有第一步的结果并输入新的内容",
        variant: "destructive",
      });
      return;
    }

    try {
      setSecondStepLoading(true);
      setSecondStepResult({
        content: "",
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep: "正在开始修改...",
        isComplete: false,
      });

      console.log("第二步API请求参数:", {
        original_ps: secondStepInput,
        program_info: result.content,
      });

      const stream = await apiService.streamPSRevision({
        original_ps: secondStepInput,
        program_info: result.content,
      });

      console.log("第二步API响应流:", stream);

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
      let currentStep = "正在开始修改...";

      while (true) {
        const { done, value } = await reader.read();
        console.log("第二步数据读取:", {
          done,
          value: value ? "有数据" : "无数据",
        });
        if (done) break;

        const chunk = decoder.decode(value);
        console.log(
          "第二步解码数据片段:",
          chunk.substring(0, 100) + (chunk.length > 100 ? "..." : "")
        );
        buffer += chunk;
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log("第二步解析的JSON数据:", data);

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
                  setSecondStepResult((prev) => ({
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
                  setSecondStepResult((prev) => ({
                    ...prev!,
                    content: accumulatedContent,
                  }));
                  break;

                case "done":
                  setSecondStepResult((prev) => ({
                    ...prev!,
                    isComplete: true,
                    currentStep: undefined,
                  }));
                  toast({
                    title: "成功",
                    description: "修改建议生成完成",
                  });
                  break;

                case "error":
                  toast({
                    title: "错误",
                    description: data.content,
                    variant: "destructive",
                  });
                  setSecondStepResult((prev) => ({
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
      setSecondStepLoading(false);
    }
  };

  // 处理第二步输入框的onChange处理
  const handleSecondStepInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setSecondStepInput(e.target.value);
    // 自动调整高度
    e.target.style.height = "inherit";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return {
    handleSecondStepSubmit,
    handleSecondStepInputChange,
  };
}

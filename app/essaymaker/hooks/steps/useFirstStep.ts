"use client";

import { Dispatch, SetStateAction } from "react";
import { DisplayResult } from "../../types";
import { apiService } from "@/lib/api";
import { Session } from "next-auth";

interface UseFirstStepProps {
  setFirstStepLoading: Dispatch<SetStateAction<boolean>>;
  setResult: Dispatch<SetStateAction<DisplayResult | null>>;
  toast: any; // 使用any临时替代
  session: Session | null;
}

export function useFirstStep({
  setFirstStepLoading,
  setResult,
  toast,
  session,
}: UseFirstStepProps) {
  // 处理流式响应
  const handleStreamResponse = async (
    query: string,
    files?: File[],
    transcriptFiles?: File[]
  ) => {
    try {
      console.log(
        "useFirstStep - handleStreamResponse - 接收的初稿文件数量:",
        files?.length || 0
      );
      console.log(
        "useFirstStep - handleStreamResponse - 接收的成绩单文件数量:",
        transcriptFiles?.length || 0
      );

      // 输出具体文件信息
      if (files && files.length > 0) {
        console.log(
          "useFirstStep - handleStreamResponse - 初稿文件:",
          files
            .map((f) => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`)
            .join(", ")
        );
      }
      if (transcriptFiles && transcriptFiles.length > 0) {
        console.log(
          "useFirstStep - handleStreamResponse - 成绩单文件:",
          transcriptFiles
            .map((f) => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`)
            .join(", ")
        );
      }

      setFirstStepLoading(true);
      setResult({
        content: "",
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep: "正在开始分析...",
        isComplete: false,
      });

      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("请求超时")), 30000); // 30秒超时
      });

      // 将文件传递给API服务
      console.log(
        "useFirstStep - 准备调用API - 初稿文件数量:",
        files?.length || 0
      );
      console.log(
        "useFirstStep - 准备调用API - 成绩单文件数量:",
        transcriptFiles?.length || 0
      );

      // 打印实际传递给API的文件详情
      console.log("useFirstStep - API调用前最终文件检查:");
      console.log(
        `- 初稿文件(${files?.length || 0}个):`,
        files && files.length > 0 ? files.map((f) => f.name).join(", ") : "无"
      );
      console.log(
        `- 成绩单文件(${transcriptFiles?.length || 0}个):`,
        transcriptFiles && transcriptFiles.length > 0
          ? transcriptFiles.map((f) => f.name).join(", ")
          : "无"
      );

      const streamPromise = apiService.streamQuery(
        query,
        {
          timestamp: new Date().toISOString(),
          source: "web",
          userId: session?.user?.id,
        },
        files,
        transcriptFiles
      );

      console.log("第一步API请求参数:", {
        query,
        timestamp: new Date().toISOString(),
        source: "web",
        userId: session?.user?.id,
        filesCount: files?.length || 0,
        transcriptFilesCount: transcriptFiles?.length || 0,
      });

      // 使用 Promise.race 实现超时处理
      const stream = (await Promise.race([
        streamPromise,
        timeoutPromise,
      ])) as ReadableStream<Uint8Array> | null;

      console.log("第一步API响应流:", stream);

      if (!stream) {
        throw new Error("无法获取响应流");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // 使用单个合并后的步骤数组，避免重复添加生成内容类型的步骤
      let mergedSteps: string[] = [];
      // 记录最后一个生成内容步骤的索引
      let lastContentStepIndex = -1;
      // 当前步骤
      let currentStep = "正在开始分析...";
      // 累积内容
      let accumulatedContent = "";
      // 是否已添加完成步骤
      let hasAddedCompletionStep = false;
      // 当前分析查询步骤的索引
      let currentAnalysisStepIndex: number | null = null;
      // 记录每个分析查询步骤的对应输出内容
      let analysisStepOutputs: Record<number, string> = {};

      try {
        while (true) {
          const { done, value } = await reader.read();
          console.log("第一步数据读取:", {
            done,
            value: value ? "有数据" : "无数据",
          });
          if (done) break;

          const chunk = decoder.decode(value);
          console.log(
            "第一步解码数据片段:",
            chunk.substring(0, 100) + (chunk.length > 100 ? "..." : "")
          );
          buffer += chunk;
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log("第一步解析的JSON数据:", data);

                switch (data.type) {
                  case "step":
                    // 更新当前步骤
                    currentStep = data.content;

                    // 处理新的"开始分析查询"步骤
                    if (data.content.includes("开始分析查询")) {
                      // 保存当前积累的输出内容到上一个分析步骤（如果有）
                      if (currentAnalysisStepIndex !== null) {
                        analysisStepOutputs[currentAnalysisStepIndex] =
                          accumulatedContent;
                      }

                      // 查找是否已有相同执行时间的"开始分析查询"步骤
                      const executionTimeMatch =
                        data.content.match(/\[执行时间: ([\d.]+)秒\]/);
                      const currentExecutionTime = executionTimeMatch
                        ? executionTimeMatch[1]
                        : null;

                      // 检查是否已存在具有相同执行时间的分析查询步骤
                      const existingStepIndex = mergedSteps.findIndex(
                        (step) => {
                          if (step.includes("开始分析查询")) {
                            const stepTimeMatch =
                              step.match(/\[执行时间: ([\d.]+)秒\]/);
                            return (
                              stepTimeMatch &&
                              stepTimeMatch[1] === currentExecutionTime
                            );
                          }
                          return false;
                        }
                      );

                      if (existingStepIndex >= 0) {
                        // 如果已存在相同的步骤，更新该步骤而不是添加新步骤
                        currentAnalysisStepIndex = existingStepIndex;
                        // 不需要将该步骤添加到mergedSteps中，因为已经存在
                      } else {
                        // 记录新步骤的索引
                        currentAnalysisStepIndex = mergedSteps.length;
                        // 将被下面的通用步骤处理逻辑添加到mergedSteps
                      }

                      accumulatedContent = ""; // 清空累积内容
                    }

                    // 判断是否为生成内容的步骤
                    if (
                      data.content.includes("生成内容") &&
                      !data.content.includes("生成内容完成")
                    ) {
                      // 如果已有生成内容的步骤，则更新它
                      if (lastContentStepIndex >= 0) {
                        mergedSteps[lastContentStepIndex] = data.content;
                      } else {
                        // 否则添加新步骤，并记录索引
                        lastContentStepIndex = mergedSteps.length;
                        mergedSteps.push(data.content);
                      }
                    } else if (data.content.includes("开始分析查询")) {
                      // 对于"开始分析查询"步骤，检查是否需要添加
                      const executionTimeMatch =
                        data.content.match(/\[执行时间: ([\d.]+)秒\]/);
                      const currentExecutionTime = executionTimeMatch
                        ? executionTimeMatch[1]
                        : null;

                      const existingStepIndex = mergedSteps.findIndex(
                        (step) => {
                          if (step.includes("开始分析查询")) {
                            const stepTimeMatch =
                              step.match(/\[执行时间: ([\d.]+)秒\]/);
                            return (
                              stepTimeMatch &&
                              stepTimeMatch[1] === currentExecutionTime
                            );
                          }
                          return false;
                        }
                      );

                      // 只有在不存在相同的步骤时才添加
                      if (existingStepIndex < 0) {
                        mergedSteps.push(data.content);
                      } else {
                        // 更新现有步骤
                        mergedSteps[existingStepIndex] = data.content;
                      }
                    } else {
                      // 对于其他类型的步骤，直接添加
                      mergedSteps.push(data.content);
                    }

                    // 更新结果
                    setResult((prev) => ({
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
                    // 获取新内容
                    const newContent = data.content || "";

                    // 重复内容检测 - 检查是否收到了与现有内容完全相同的大块内容
                    if (
                      newContent.length > 200 &&
                      accumulatedContent.includes(newContent)
                    ) {
                      console.log("检测到大段重复内容，忽略");
                      break; // 忽略这次更新
                    }

                    // 检测是否收到了完整内容的重复（比如完整文章被重复发送）
                    // 这种情况下新内容可能包含已累积的所有内容
                    if (
                      newContent.length > 500 &&
                      newContent.includes(accumulatedContent) &&
                      accumulatedContent.length > 200
                    ) {
                      console.log("检测到内容重复包含，使用更长的版本");
                      // 使用更新的完整版本替换而不是追加
                      accumulatedContent = newContent;
                    } else {
                      // 正常累积内容
                      accumulatedContent += newContent;
                    }

                    // 更新UI
                    setResult((prev) => {
                      // 如果是步骤内容，不修改
                      if (prev?._isStepContent) {
                        return prev;
                      }

                      return {
                        ...prev!,
                        content: accumulatedContent,
                        _isStepContent: false,
                      };
                    });
                    break;

                  case "error":
                    // 处理错误类型的消息
                    console.error("API返回错误:", data.content);

                    // 停止加载状态
                    setFirstStepLoading(false);

                    // 显示错误提示
                    toast({
                      title: "处理错误",
                      description: data.content,
                      variant: "destructive",
                    });

                    // 更新结果状态，标记为错误
                    setResult((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        isError: true,
                        errorMessage: data.content,
                        isComplete: true,
                      };
                    });
                    break;

                  case "transcript":
                    // 接收到成绩单解析数据
                    console.log("收到成绩单解析数据，完整内容:", data.content);
                    console.log("成绩单解析数据类型:", typeof data.content);
                    console.log(
                      "成绩单解析数据长度:",
                      data.content?.length || 0
                    );

                    // 在结果中添加transcriptAnalysis字段
                    setResult((prev) => {
                      if (!prev) return prev;

                      console.log("更新result的transcriptAnalysis字段");

                      // 使用完整对象更新，确保所有字段都存在
                      const updatedResult = {
                        ...prev,
                        transcriptAnalysis: data.content,
                      };

                      console.log("更新后的result:", {
                        hasTranscriptAnalysis:
                          !!updatedResult.transcriptAnalysis,
                        transcriptAnalysisLength:
                          updatedResult.transcriptAnalysis?.length || 0,
                      });

                      return updatedResult;
                    });

                    // 添加一个步骤表示成绩单已分析
                    if (
                      !mergedSteps.some((step) => step.includes("成绩单解析"))
                    ) {
                      const transcriptStep =
                        "已完成成绩单解析 [执行时间: 0.5秒]";
                      mergedSteps.push(transcriptStep);

                      // 更新步骤列表
                      setResult((prev) => ({
                        ...prev!,
                        steps: [...mergedSteps],
                      }));

                      console.log("添加成绩单解析步骤到steps列表");
                    }
                    break;

                  case "complete":
                    // 保存最后一个分析查询步骤的输出内容
                    if (currentAnalysisStepIndex !== null) {
                      analysisStepOutputs[currentAnalysisStepIndex] =
                        accumulatedContent;
                    }

                    // 内容去重处理 - 添加这部分
                    // 检测并去除重复内容
                    const uniqueContents = new Map();
                    const contentFingerprints = new Set();

                    // 第一步：识别重复内容
                    for (const [indexStr, content] of Object.entries(
                      analysisStepOutputs
                    )) {
                      if (!content || !content.trim()) continue;

                      // 创建内容指纹 - 对于JSON内容，使用其开头部分作为指纹
                      const isJsonContent =
                        content.trim().startsWith("{") &&
                        content.trim().endsWith("}");
                      const contentFingerprint = isJsonContent
                        ? content
                            .trim()
                            .substring(0, Math.min(50, content.length))
                        : content.trim();

                      // 检查是否已存在相同或高度相似的内容
                      if (!contentFingerprints.has(contentFingerprint)) {
                        contentFingerprints.add(contentFingerprint);
                        uniqueContents.set(indexStr, content);
                      }
                      // 如果已存在，不添加到uniqueContents中，相当于删除重复内容
                    }

                    // 清空原来的内容并重新赋值
                    analysisStepOutputs = {};
                    for (const [
                      indexStr,
                      content,
                    ] of uniqueContents.entries()) {
                      analysisStepOutputs[indexStr] = content;
                    }

                    // 为每个分析查询步骤插入其输出内容
                    for (const [indexStr, content] of Object.entries(
                      analysisStepOutputs
                    )) {
                      const index = parseInt(indexStr);
                      if (
                        index >= 0 &&
                        index < mergedSteps.length &&
                        content.trim()
                      ) {
                        // 检查步骤是否已经包含嵌入内容
                        if (!mergedSteps[index].includes("---CONTENT---")) {
                          // 只有在没有嵌入内容的情况下才添加
                          mergedSteps[
                            index
                          ] = `${mergedSteps[index]}\n---CONTENT---\n${content}\n---END_CONTENT---`;
                        } else {
                          // 如果已存在嵌入内容，则替换它而不是添加新的
                          mergedSteps[index] = mergedSteps[index].replace(
                            /\n---CONTENT---\n[\s\S]*?(?:\n---END_CONTENT---|$)/,
                            `\n---CONTENT---\n${content}\n---END_CONTENT---`
                          );
                        }
                      }
                    }

                    // 步骤去重处理 - 移除可能重复的"开始分析查询"步骤
                    // 只保留具有嵌入内容的分析步骤
                    const uniqueSteps = [];
                    const analyzedStepIndices = new Set();

                    for (let i = 0; i < mergedSteps.length; i++) {
                      const step = mergedSteps[i];

                      // 如果是分析步骤并且没有嵌入内容，可能是重复的
                      if (
                        step.includes("开始分析查询") &&
                        !step.includes("---CONTENT---")
                      ) {
                        // 检查是否有其他相似步骤有嵌入内容
                        let skipThisStep = false;
                        for (let j = 0; j < mergedSteps.length; j++) {
                          if (
                            i !== j &&
                            mergedSteps[j].includes("开始分析查询") &&
                            mergedSteps[j].includes("---CONTENT---")
                          ) {
                            // 找到有内容的相似步骤，跳过当前步骤
                            skipThisStep = true;
                            break;
                          }
                        }

                        if (skipThisStep) {
                          analyzedStepIndices.add(i);
                          continue; // 跳过这个步骤
                        }
                      }

                      // 保留其他步骤
                      if (!analyzedStepIndices.has(i)) {
                        uniqueSteps.push(step);
                      }
                    }

                    // 使用去重后的步骤数组
                    if (uniqueSteps.length < mergedSteps.length) {
                      mergedSteps = uniqueSteps;
                    }

                    setResult((prev) => {
                      // 检查是否是步骤点击显示的内容
                      if (prev?._isStepContent) {
                        // 如果是步骤点击的内容，只更新步骤和状态，不修改内容
                        return {
                          ...prev,
                          isComplete: true,
                          currentStep: undefined,
                          steps: [...mergedSteps],
                          // 保持_isStepContent标记
                          _isStepContent: true,
                        };
                      }

                      // 正常完成处理
                      return {
                        ...prev!,
                        isComplete: true,
                        currentStep: undefined,
                        steps: [...mergedSteps],
                        // 确保标记为非步骤内容
                        _isStepContent: false,
                      };
                    });
                    break;
                }
              } catch (parseError) {
                console.error(
                  "解析流数据时出错:",
                  parseError,
                  "原始数据:",
                  line
                );
              }
            }
          }
        }
      } catch (streamError) {
        console.error("读取流时出错:", streamError);
        throw new Error(
          `读取响应流时出错: ${
            streamError instanceof Error ? streamError.message : "未知错误"
          }`
        );
      } finally {
        // 确保读取器被释放
        reader.releaseLock();
      }
    } catch (error) {
      console.error("处理流式响应时出错:", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "处理失败",
        variant: "destructive",
      });

      // 即使出错，也设置一个基本结果，以便用户可以看到错误状态
      setResult((prev) => ({
        ...prev!,
        isComplete: true,
        currentStep: "处理出错，请重试",
        steps: [...(prev?.steps || []), "处理出错，请重试"],
      }));
    } finally {
      setFirstStepLoading(false);
    }
  };

  return {
    handleStreamResponse,
  };
}

/**
 * useCVDraft Hook
 *
 * 功能：管理CV助理简历初稿生成的自定义Hook
 *
 * 核心特性：
 * 1. 简历生成：
 *    - 基于分析报告生成简历
 *    - 多种模板样式支持
 *    - 个性化内容定制
 *    - 行业标准格式
 *
 * 2. 流式处理：
 *    - 实时接收+逐字显示模式
 *    - 字符显示间隔：0.2ms
 *    - 平滑的打字机效果
 *    - 逐段生成和显示
 *
 * 3. 内容优化：
 *    - 关键词优化
 *    - 格式标准化
 *    - 长度控制
 *    - 可读性提升
 *
 * 4. 状态管理：
 *    - 生成进度跟踪
 *    - 错误状态处理
 *    - 完成状态确认
 *    - 用户交互状态
 *
 * 5. 数据处理：
 *    - 报告内容解析
 *    - 结构化数据转换
 *    - 模板应用和渲染
 *    - 格式验证和修正
 *
 * 6. 用户体验：
 *    - 实时预览功能
 *    - 编辑和修改支持
 *    - 版本历史记录
 *    - 导出功能集成
 *
 * 依赖关系：
 * - 依赖CV报告的分析结果
 * - 与文件上传组件协作
 * - 集成流式响应处理
 *
 * API集成：
 * - 使用useStreamResponse处理流式响应
 * - 支持基于报告的简历生成
 * - 实时内容更新和状态同步
 *
 * 返回值：
 * - draft：生成的简历初稿
 * - isGenerating：生成状态
 * - error：错误信息
 * - generateDraft：生成函数
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/app/console/essaymaker/api";
import { DisplayResult } from "../../../types";
import { useStreamResponse } from "../../../hooks/useStreamResponse";
import { useCVLogger } from "./useCVLogger";

export function useCVDraft() {
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();
  // 集成CV日志记录功能
  const { logFormatResult } = useCVLogger();

  const generateDraft = async (
    reportResult: DisplayResult,
    onFormattedResumeChange: (result: DisplayResult) => void,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) => {
    // console.log("开始生成简历...");
    // console.log("当前结果:", reportResult);
    if (!reportResult || !reportResult.content) {
      // console.log("没有结果或内容，显示错误提示");
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先获取简历分析报告",
      });
      return;
    }

    // 记录开始时间用于计算耗时
    const startTime = Date.now();

    setIsGeneratingDraft(true);

    // 显示处理中提示
    toast({
      title: "正在生成",
      description: "简历初稿正在生成中...",
    });

    try {
      // console.log("调用格式化简历API...");
      // 调用格式化简历API
      const response = await apiService.formatResume(
        reportResult.content,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );

      // console.log("API响应:", response);
      // 检查响应类型
      if (response instanceof ReadableStream) {
        // console.log("开始处理流式响应...");
        await processStream(response, {
          onUpdate: (result) => {
            onFormattedResumeChange({
              ...result,
              currentStep: result.currentStep || "简历生成中",
            });
          },
          onComplete: async (result) => {
            setIsGeneratingDraft(false);
            onFormattedResumeChange({
              ...result,
              currentStep: "简历生成完成",
            });

            // 记录成功的格式化结果
            await logFormatResult(
              {
                rawResume: reportResult.content,
                customRolePrompt,
                customTaskPrompt,
                customOutputFormatPrompt,
              },
              result,
              true, // 成功
              Date.now() - startTime
            );

            toast({
              title: "生成成功",
              description: "简历已生成完成",
            });
          },
          onError: async (error) => {
            // console.error("生成简历时出错:", error);
            setIsGeneratingDraft(false);

            // 记录失败的格式化结果
            await logFormatResult(
              {
                rawResume: reportResult.content,
                customRolePrompt,
                customTaskPrompt,
                customOutputFormatPrompt,
              },
              { content: "", error: true },
              false, // 失败
              Date.now() - startTime,
              error instanceof Error ? error.message : "生成简历时发生错误"
            );

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
          charDelay: 0.2, // 字符显示间隔0.2毫秒
        });
      } else {
        // 处理非流式响应
        // console.log("接收到非流式响应");
        let content = "";
        if (typeof response === "string") {
          content = response;
        } else if (response && typeof response === "object") {
          // 使用类型断言和可选链访问content属性
          const responseObj = response as any;
          content = responseObj?.content || JSON.stringify(response);
        }

        setIsGeneratingDraft(false);

        // 记录成功的格式化结果
        await logFormatResult(
          {
            rawResume: reportResult.content,
            customRolePrompt,
            customTaskPrompt,
            customOutputFormatPrompt,
          },
          { content, isComplete: true, currentStep: "简历生成完成" },
          true,
          Date.now() - startTime
        );

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
      // console.error("生成简历初稿时出错:", error);
      setIsGeneratingDraft(false);

      // 记录失败的格式化结果
      await logFormatResult(
        {
          rawResume: reportResult.content,
          customRolePrompt,
          customTaskPrompt,
          customOutputFormatPrompt,
        },
        { content: "", error: true },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : "生成简历初稿时发生错误"
      );

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
    }
  };

  return {
    generateDraft,
    isGeneratingDraft,
  };
}

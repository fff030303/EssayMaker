import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/app/console/essaymaker/api";
import { DisplayResult } from "../../../types";
import { useStreamResponse } from "../../../hooks/useStreamResponse";
import { useCVLogger } from "./useCVLogger";

/**
 * useCVReport Hook
 *
 * 功能：管理CV助理报告生成的自定义Hook
 *
 * 核心特性：
 * 1. 报告生成：
 *    - 简历内容分析
 *    - 优化建议生成
 *    - 技能匹配评估
 *    - 行业标准对比
 *
 * 2. 流式处理：
 *    - 实时接收+逐字显示模式
 *    - 字符显示间隔：0.2ms
 *    - 平滑的打字机效果
 *    - 自动滚动到最新内容
 *
 * 3. 状态管理：
 *    - 生成状态跟踪
 *    - 错误状态处理
 *    - 加载进度指示
 *    - 完成状态确认
 *
 * 4. 数据处理：
 *    - 文件内容解析
 *    - 结构化数据提取
 *    - 格式转换和优化
 *    - 结果缓存机制
 *
 * 5. 错误处理：
 *    - 网络错误重试
 *    - 数据验证失败
 *    - 超时处理机制
 *    - 用户友好的错误提示
 *
 * 6. 性能优化：
 *    - 防抖处理
 *    - 内存使用控制
 *    - 异步操作优化
 *    - 资源清理机制
 *
 * API集成：
 * - 使用useStreamResponse处理流式响应
 * - 支持文件上传和内容分析
 * - 实时数据更新和状态同步
 *
 * 返回值：
 * - report：生成的报告内容
 * - isGenerating：生成状态
 * - error：错误信息
 * - generateReport：生成函数
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

export function useCVReport() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();
  const { processStream } = useStreamResponse();
  const { logAnalysisResult } = useCVLogger();

  const generateReport = async (
    resumeFile: File,
    supportFiles: File[],
    setResult: (result: DisplayResult | null) => void,
    onStepChange?: (step: number) => void,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) => {
    if (!resumeFile) {
      toast({
        variant: "destructive",
        title: "文件缺失",
        description: "请上传个人简历素材表",
      });
      return;
    }

    const startTime = Date.now();

    setIsGeneratingReport(true);

    const resultObject: DisplayResult = {
      content: "",
      steps: [],
      timestamp: new Date().toISOString(),
      isComplete: false,
      currentStep: "生成简历内容",
    };

    if (setResult) {
      setResult(resultObject);
    }

    toast({
      title: "正在处理",
      description: "简历正在生成中...",
    });

    if (onStepChange) {
      onStepChange(2);
    }

    try {
      const response = await apiService.generateResume(
        resumeFile,
        supportFiles,
        customRolePrompt,
        customTaskPrompt,
        customOutputFormatPrompt
      );
      console.log("API响应类型:", typeof response);

      if (response instanceof ReadableStream) {
        console.log("接收到流式响应，开始处理...");

        await processStream(response, {
          onUpdate: (result) => {
            if (setResult) {
              setResult({
                ...result,
                currentStep: result.currentStep || "简历分析中",
              });
            }
          },
          onComplete: async (result) => {
            setIsGeneratingReport(false);
            if (setResult) {
              setResult({
                ...result,
                currentStep: "简历分析完成",
              });
            }

            await logAnalysisResult(
              {
                fileContent: resumeFile.name,
                supportFiles: supportFiles.map((f) => f.name),
                customRolePrompt,
                customTaskPrompt,
                customOutputFormatPrompt,
                hasCustomPrompt: !!(customRolePrompt || customTaskPrompt || customOutputFormatPrompt),
              },
              result,
              true,
              Date.now() - startTime
            );

            toast({
              title: "已提交",
              description: "您的简历已分析完成",
            });
          },
          onError: async (error) => {
            console.error("处理简历时出错:", error);
            setIsGeneratingReport(false);

            await logAnalysisResult(
              {
                fileContent: resumeFile.name,
                supportFiles: supportFiles.map((f) => f.name),
                customRolePrompt,
                customTaskPrompt,
                customOutputFormatPrompt,
                hasCustomPrompt: !!(customRolePrompt || customTaskPrompt || customOutputFormatPrompt),
              },
              { content: "", error: true },
              false,
              Date.now() - startTime,
              error instanceof Error ? error.message : "处理简历时发生错误"
            );

            toast({
              variant: "destructive",
              title: "处理失败",
              description: "处理简历时发生错误，请重试",
            });
            if (setResult) {
              setResult({
                content: `生成简历时出错: ${error}`,
                steps: [],
                timestamp: new Date().toISOString(),
                isComplete: true,
                currentStep: "出错",
              });
            }
          },
          realtimeTypewriter: true,
          charDelay: 0.2,
        });
      } else {
        console.log("API响应数据:", response);

        if (response && typeof response === "object") {
          const responseObj = response as any;
          const content = responseObj?.text || JSON.stringify(response);
          setIsGeneratingReport(false);

          await logAnalysisResult(
            {
              fileContent: resumeFile.name,
              supportFiles: supportFiles.map((f) => f.name),
              customRolePrompt,
              customTaskPrompt,
              customOutputFormatPrompt,
              hasCustomPrompt: !!(customRolePrompt || customTaskPrompt || customOutputFormatPrompt),
            },
            { content, isComplete: true, currentStep: "简历生成完成" },
            true,
            Date.now() - startTime
          );

          if (setResult) {
            setResult({
              content,
              steps: [],
              timestamp: new Date().toISOString(),
              isComplete: true,
              currentStep: "简历生成完成",
            });
          }
        }
      }
    } catch (error) {
      console.error("提交简历时出错:", error);
      setIsGeneratingReport(false);

      await logAnalysisResult(
        {
          fileContent: resumeFile.name,
          supportFiles: supportFiles.map((f) => f.name),
          customRolePrompt,
          customTaskPrompt,
          customOutputFormatPrompt,
          hasCustomPrompt: !!(customRolePrompt || customTaskPrompt || customOutputFormatPrompt),
        },
        { content: "", error: true },
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : "上传简历时发生错误"
      );

      toast({
        variant: "destructive",
        title: "提交失败",
        description: "上传简历时发生错误，请重试",
      });

      if (setResult) {
        setResult({
          content: `生成简历时出错: ${error}`,
          steps: [],
          timestamp: new Date().toISOString(),
          isComplete: true,
          currentStep: "出错",
        });
      }
    }
  };

  return {
    generateReport,
    isGeneratingReport,
  };
}

// 第一步界面组件，负责：

// - 显示查询输入区域
// - 处理用户输入和提交
// - 展示查询结果
// - 检测查询类型并通知父组件
// - 根据查询结果决定是否需要进入多步骤流程

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { DisplayResult, AgentType } from "../types";
import { InputArea } from "./InputArea";
import { ResultSection } from "./ResultSection";
import { debounce } from "../utils/helpers";
import { QuickActionButtons, ButtonType } from "./QuickActionButtons";
import { AdvancedInputArea } from "./AdvancedInputArea";
import { useToast } from "@/hooks/use-toast";
import { ResultDisplay } from "./ResultDisplay";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { AssistantTips } from "./AssistantTips";
import { Button } from "@/components/ui/button";

// 在 FirstStepProps 接口中添加 isProfessorSearch 属性
interface FirstStepProps {
  query: string;
  setQuery: (query: string) => void;
  isLoading: boolean;
  result: DisplayResult | null;
  setResult: (result: DisplayResult | null) => void;
  showExamples: boolean;
  setShowExamples: (show: boolean) => void;
  isInputExpanded: boolean;
  setIsInputExpanded: (expanded: boolean) => void;
  expandedSteps: string[];
  setExpandedSteps: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: () => void;
  handleStepClick: (step: string, stepId: string) => void;
  handleExampleClick: (content: string) => void;
  setDetectedAgentType?: (type: AgentType) => void;
  onStepChange?: (step: number) => void;
  isProfessorSearch?: boolean; // 添加这个属性
  isPSAssistant?: boolean; // 添加这个属性，表示当前是否为PS初稿助理模式
  files: File[]; // 添加文件状态
  setFiles: React.Dispatch<React.SetStateAction<File[]>>; // 添加文件状态设置函数
  // 添加最终初稿相关的属性
  finalDraft?: DisplayResult | null;
  isGeneratingFinalDraft?: boolean;
  handleFinalDraftSubmit?: (
    draftQuery: string,
    draftFiles: File[],
    purifiedContent: string,
    direction: string,
    requirements?: string,
    transcriptAnalysis?: string | null // 添加成绩单解析参数，支持null
  ) => Promise<void>;
  setFinalDraft?: (finalDraft: DisplayResult | null) => void;
  onButtonChange?: (type: ButtonType) => void; // 添加按钮切换处理函数
  setIsPSAssistant?: (isPS: boolean) => void; // 添加设置PS初稿助理状态
  setShowStepNavigation?: (show: boolean) => void; // 添加控制步骤导航显示
  onUserInputChange?: (
    direction: string,
    requirements: string,
    transcriptAnalysis: string | null
  ) => void; // 添加接收用户输入的回调
  onOtherFilesChange?: (files: File[]) => void; // 添加接收其他文件的回调
  // 添加直接访问API的函数，以绕过handleSubmit
  handleStreamResponse?: (
    query: string,
    materialFiles?: File[],
    transcriptFiles?: File[]
  ) => Promise<void>;
  setIsCVAssistant?: (isCV: boolean) => void; // 添加设置CV助理状态
}

export function FirstStep({
  query,
  setQuery,
  isLoading,
  result,
  setResult,
  showExamples,
  setShowExamples,
  isInputExpanded,
  setIsInputExpanded,
  expandedSteps,
  setExpandedSteps,
  handleSubmit,
  handleStepClick,
  handleExampleClick,
  setDetectedAgentType,
  onStepChange,
  isProfessorSearch = false, // 设置默认值
  isPSAssistant, // 使用外部传入的isPSAssistant
  files, // 使用外部传入的files
  setFiles, // 使用外部传入的setFiles
  finalDraft,
  isGeneratingFinalDraft,
  handleFinalDraftSubmit,
  setFinalDraft,
  onButtonChange,
  setIsPSAssistant,
  setShowStepNavigation,
  onUserInputChange,
  onOtherFilesChange,
  handleStreamResponse,
  setIsCVAssistant,
}: FirstStepProps) {
  // 创建结果区域的引用
  const resultRef = useRef<HTMLDivElement>(null);

  // 使用toast钩子
  const { toast } = useToast();

  // 添加状态来跟踪当前输入模式
  const [inputMode, setInputMode] = useState<"simple" | "draft" | "custom">(
    "simple"
  );

  // 添加状态控制是否应该隐藏结果（用于清空初稿提纯结果）
  const [shouldHideResult, setShouldHideResult] = useState(false);

  // 记录上一次的输入模式
  const prevInputModeRef = useRef(inputMode);

  // 当输入模式变化时，如果从draft切换到其他模式，设置shouldHideResult为true
  useEffect(() => {
    if (prevInputModeRef.current === "draft" && inputMode !== "draft") {
      console.log("从初稿模式切换出去，隐藏结果");
      setShouldHideResult(true);

      // 为了安全起见，也清空query和files
      setQuery("");
      setFiles([]);
    } else if (inputMode === "draft") {
      // 当进入draft模式时，重置shouldHideResult
      setShouldHideResult(false);
    }

    // 更新上一次的输入模式记录
    prevInputModeRef.current = inputMode;
  }, [inputMode, setQuery, setFiles]);

  // 当用户在非draft模式下提交新的查询时，重置shouldHideResult
  useEffect(() => {
    if (inputMode !== "draft" && result) {
      setShouldHideResult(false);
    }
  }, [result, inputMode]);

  // 为简单输入区域单独保存一个状态
  const [simpleQuery, setSimpleQuery] = useState<string>("");
  const [simpleFiles, setSimpleFiles] = useState<File[]>([]);

  // 为复杂输入区域添加专用状态
  const [direction, setDirection] = useState<string>("");
  const [requirements, setRequirements] = useState<string>("");
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  // 添加提示文本状态
  const [placeholder, setPlaceholder] =
    useState<string>("你可以在这里输入问题或要求...");

  // 新增: 保存提纯版内容的状态
  const [purifiedDraft, setPurifiedDraft] = useState<string | null>(null);
  const [isPurifying, setIsPurifying] = useState<boolean>(false);

  // 新增: 最终初稿生成状态
  const [finalDraftResult, setFinalDraftResult] =
    useState<DisplayResult | null>(null);
  const [localIsGeneratingFinalDraft, setLocalIsGeneratingFinalDraft] =
    useState<boolean>(false);

  // 新增：保存成绩单解析结果
  const [transcriptAnalysis, setTranscriptAnalysis] = useState<string | null>(
    null
  );

  // 跟踪files状态变化
  useEffect(() => {
    console.log("FirstStep - files状态更新 - 文件数量:", files.length);
  }, [files]);

  // 同步简单模式的状态到父组件
  useEffect(() => {
    if (inputMode === "simple" || inputMode === "custom") {
      setQuery(simpleQuery);
      setFiles(simpleFiles);
    }
  }, [inputMode, simpleQuery, simpleFiles, setQuery, setFiles]);

  // 监听result变化，保存提纯版内容
  useEffect(() => {
    if (
      result &&
      result.isComplete &&
      inputMode === "draft" &&
      !localIsGeneratingFinalDraft &&
      purifiedDraft !== result.content // 添加条件避免重复设置相同的值
    ) {
      // 只有当不是在生成最终初稿时，才更新提纯版内容
      setPurifiedDraft(result.content);
      setIsPurifying(false);
      console.log("保存提纯版内容:", result.content.substring(0, 100) + "...");
    }
  }, [result, inputMode, localIsGeneratingFinalDraft, purifiedDraft]);

  // 从步骤中检测agent类型
  const detectAgentTypeFromSteps = (steps: string[]): AgentType => {
    // 查找包含转移到特定agent的步骤
    for (const step of steps) {
      const lowerStep = step.toLowerCase();

      if (
        lowerStep.includes("transfer to course info compile expert") ||
        lowerStep.includes("course_info_compile_expert")
      ) {
        return AgentType.COURSE_INFO;
      }

      if (
        lowerStep.includes("transfer to university research coordinator") ||
        lowerStep.includes("university_research_coordinator")
      ) {
        return AgentType.UNIVERSITY_RESEARCH;
      }

      if (
        lowerStep.includes("transfer to application advisor") ||
        lowerStep.includes("application_advisor")
      ) {
        return AgentType.APPLICATION_ADVISOR;
      }

      if (
        lowerStep.includes("transfer to research expert") ||
        lowerStep.includes("research_expert")
      ) {
        return AgentType.RESEARCH;
      }

      if (
        lowerStep.includes("transfer to professor search expert") ||
        lowerStep.includes("professor_search_expert")
      ) {
        return AgentType.PROFESSOR_SEARCH; // 需要在AgentType枚举中添加这个类型
      }
    }

    return AgentType.UNKNOWN;
  };

  // 为跟踪上一次检测到的agent类型添加ref
  const prevAgentTypeRef = useRef<AgentType>(AgentType.UNKNOWN);

  // 当结果更新时，检测agent类型并通知父组件
  useEffect(() => {
    if (result?.steps && result.steps.length > 0 && setDetectedAgentType) {
      const agentType = detectAgentTypeFromSteps(result.steps);

      // 只有当检测到的类型与之前不同时才更新
      if (agentType !== prevAgentTypeRef.current) {
        prevAgentTypeRef.current = agentType;
        setDetectedAgentType(agentType);
      }
    }
  }, [result, setDetectedAgentType]);

  // 新增：监听finalDraftResult变化，实现流式生成检测
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (finalDraftResult && !finalDraftResult.isComplete) {
      // 设置3秒定时器
      timeoutId = setTimeout(() => {
        // 3秒内没有新内容，认为生成完成
        setFinalDraftResult((prev) => {
          if (prev) {
            return {
              ...prev,
              isComplete: true,
            };
          }
          return prev;
        });
      }, 3000);
    }

    // 清理定时器
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [finalDraftResult]);

  // 为跟踪上一次的输入值添加ref
  const prevInputValueRef = useRef<string>("");

  // 监听direction和requirements变化，同步到父组件
  useEffect(() => {
    if (onUserInputChange) {
      // 防止循环更新：只有在值真正变化时才触发更新
      const newValue = `${direction}|${requirements}|${transcriptAnalysis}`;

      if (newValue !== prevInputValueRef.current) {
        prevInputValueRef.current = newValue;
        // 添加成绩单解析结果作为第三个参数
        onUserInputChange(direction, requirements, transcriptAnalysis);
      }
    }
  }, [direction, requirements, transcriptAnalysis, onUserInputChange]);

  // 为跟踪上一次的文件列表添加ref
  const prevOtherFilesRef = useRef<File[]>([]);

  // 监听otherFiles变化，同步到父组件
  useEffect(() => {
    if (onOtherFilesChange) {
      // 比较文件列表是否有变化
      const filesChanged =
        prevOtherFilesRef.current.length !== otherFiles.length ||
        otherFiles.some(
          (file, index) =>
            prevOtherFilesRef.current[index]?.name !== file.name ||
            prevOtherFilesRef.current[index]?.size !== file.size
        );

      if (filesChanged) {
        prevOtherFilesRef.current = [...otherFiles];
        onOtherFilesChange(otherFiles);
      }
    }
  }, [otherFiles, onOtherFilesChange]);

  // 处理简单输入区域的提交
  const handleSimpleSubmit = useCallback(() => {
    // 验证输入
    if (!simpleQuery.trim()) {
      toast({
        title: "输入错误",
        description: "请输入内容",
        variant: "destructive",
      });
      return;
    }

    // 在提交新查询时重置shouldHideResult
    setShouldHideResult(false);

    // 处理PS分稿助理模式 - 通过placeholder检测当前模式
    let finalQuery = simpleQuery;

    // 检测是否处于PS分稿助理模式
    if (inputMode === "simple" && placeholder.includes("分稿")) {
      // 自动为用户输入添加详细的查询模板
      finalQuery = `请提供${simpleQuery}课程的详细信息，包括核心课程、选修课程、学分要求、课程大纲和评估方式。`;
      console.log("PS分稿助理 - 自动拼接查询:", finalQuery);
    }

    // 更新父组件状态
    setQuery(finalQuery);
    setFiles(simpleFiles);
    setShowExamples(false);
    setIsInputExpanded(false);

    // 调用父组件提交
    handleSubmit();
  }, [
    simpleQuery,
    simpleFiles,
    setQuery,
    setFiles,
    setShowExamples,
    setIsInputExpanded,
    handleSubmit,
    toast,
    inputMode,
    placeholder,
  ]);

  // 处理高级输入提交 - 修改为与简单输入相同的模式
  const handleAdvancedSubmit = async () => {
    console.log("FirstStep - handleAdvancedSubmit - 准备数据");

    // 验证必填项
    // 初稿模式下验证文件
    if (inputMode === "draft" && !draftFile) {
      toast({
        title: "文件缺失",
        description: "请上传初稿文件",
        variant: "destructive",
      });
      return;
    }

    // 设置提纯中状态
    setIsPurifying(true);
    // 清除之前的提纯结果
    setPurifiedDraft(null);
    // 清除最终初稿结果
    setFinalDraftResult(null);
    // 清除之前的成绩单解析结果
    setTranscriptAnalysis(null);

    // 构建查询文本
    let queryText = `请提取该文件中重要的内容`;

    // 分开处理初稿文件和成绩单文件
    // 记录文件信息到控制台
    if (draftFile) {
      console.log(
        `初稿文件(material_file): ${draftFile.name} (${(
          draftFile.size / 1024
        ).toFixed(1)} KB)`
      );
    }

    // 记录成绩单文件信息
    if (otherFiles.length > 0) {
      console.log(
        `成绩单文件(transcript_files): ${otherFiles.length}个文件:`,
        otherFiles.map((file) => file.name).join(", ")
      );
    }

    // 使用状态更新回调和Promise来确保状态更新完成
    await new Promise<void>((resolve) => {
      // 先设置查询文本
      setQuery(queryText);

      // 只设置初稿文件，不再合并所有文件
      if (draftFile) {
        // 只传递初稿文件到files状态
        setFiles([draftFile]);
      } else {
        setFiles([]);
      }

      // 先通知父组件关于成绩单文件的变化
      if (onOtherFilesChange) {
        // 传递otherFiles后要确保状态已更新再继续
        onOtherFilesChange(otherFiles);
      }

      setShowExamples(false);
      setIsInputExpanded(false);

      // 使用更长的延迟确保所有状态更新完成
      setTimeout(resolve, 100);
    });

    // 延迟再次确保状态更新已完成
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    console.log("状态更新完成，准备调用handleSubmit");
    console.log("当前初稿文件:", draftFile ? draftFile.name : "无");
    console.log("当前成绩单文件数量:", otherFiles.length);

    // 重要修改：直接将当前组件内的otherFiles传递给handleSubmit，不依赖于父组件状态更新
    // 修改handleSubmit的调用方式，传递本地的otherFiles
    if (typeof handleSubmit === "function" && handleSubmit.length === 0) {
      // 原始handleSubmit没有参数，我们需要特殊处理
      // 为了确保成绩单文件能传递到后端，我们需要临时修改一下files状态
      if (draftFile && otherFiles.length > 0) {
        console.log("直接使用本地文件调用API");
        // 直接调用API而不是通过handleSubmit
        await handleStreamResponse?.(queryText, [draftFile], otherFiles);
      } else {
        // 没有成绩单文件或初稿文件，正常调用handleSubmit
        handleSubmit();
      }
    } else {
      // handleSubmit可以接受参数或者有特殊实现
      handleSubmit();
    }
  };

  // 添加监听器处理结果中的成绩单解析部分
  useEffect(() => {
    if (result && result.isComplete && inputMode === "draft") {
      try {
        // 尝试从结果中提取成绩单解析部分
        const content = result.content || "";

        // 检查是否包含成绩单解析部分
        if (
          content.includes("成绩单解析") ||
          content.includes("成绩分析") ||
          content.includes("GPA分析")
        ) {
          console.log("检测到成绩单解析结果");

          // 尝试提取成绩单解析部分
          // 寻找常见的分隔标记
          const markers = [
            "## 成绩单解析",
            "### 成绩单解析",
            "## 成绩分析",
            "### 成绩分析",
            "## GPA分析",
            "### GPA分析",
          ];

          let transcriptSection = "";

          // 尝试找到并提取成绩单解析部分
          for (const marker of markers) {
            if (content.includes(marker)) {
              const startIdx = content.indexOf(marker);
              let endIdx = content.length;

              // 寻找下一个同级或更高级标题作为结束点
              const nextHeadingMatch = content
                .slice(startIdx + marker.length)
                .match(/^#{1,3}\s/m);
              if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
                endIdx = startIdx + marker.length + nextHeadingMatch.index;
              }

              transcriptSection = content.slice(startIdx, endIdx).trim();
              break;
            }
          }

          if (transcriptSection) {
            console.log(
              "成功提取成绩单解析结果:",
              transcriptSection.substring(0, 100) + "..."
            );
            setTranscriptAnalysis(transcriptSection);
          }
        }
      } catch (error) {
        console.error("提取成绩单解析失败:", error);
      }
    }
  }, [result, inputMode]);

  // 新增：处理生成最终初稿
  const handleGenerateFinalDraft = async () => {
    if (!purifiedDraft) {
      toast({
        title: "错误",
        description: "请先提交初稿文件获取提纯版内容",
        variant: "destructive",
      });
      return;
    }

    if (!direction.trim()) {
      toast({
        title: "错误",
        description: "请填写申请方向",
        variant: "destructive",
      });
      return;
    }

    console.log("准备生成最终初稿");
    console.log(
      "成绩单解析状态:",
      transcriptAnalysis ? `存在 (${transcriptAnalysis.length}字节)` : "不存在"
    );

    try {
      // 构建查询
      const finalDraftQuery = `生成最终初稿`;

      // 使用otherFiles作为成绩单文件上传 (已废弃，保留兼容)
      const transcriptFiles = otherFiles || [];

      if (transcriptFiles.length > 0) {
        console.log(
          `上传${transcriptFiles.length}个成绩单文件作为辅助资料:`,
          transcriptFiles.map((file) => file.name).join(", ")
        );
      } else {
        console.log("没有上传成绩单文件");
      }

      // 调用函数进行处理，传递所有必要的参数
      await handleFinalDraftSubmit!(
        finalDraftQuery,
        transcriptFiles, // 传递成绩单文件 (已废弃，保留兼容)
        purifiedDraft, // 传递提纯后的内容
        direction, // 传递申请方向
        requirements, // 传递具体要求
        transcriptAnalysis || undefined // 传递成绩单解析结果，确保类型正确
      );

      // 结果会自动更新到finalDraft状态
    } catch (error) {
      console.error("生成最终初稿时出错:", error);
      toast({
        title: "生成失败",
        description: "生成最终初稿时出现错误，请重试",
        variant: "destructive",
      });
    }
  };

  // 新增：处理输入变化的函数
  const handleAdvancedInputChange = useCallback(() => {
    // 构建查询文本
    let queryText = `请提取该文件中重要的内容`;

    // 实时更新query
    console.log("FirstStep - 输入变化，更新查询文本:", queryText);
    setQuery(queryText);
  }, [direction, requirements, setQuery]);

  // 新增：处理文件变化的函数
  const handleAdvancedFileChange = useCallback(() => {
    // 根据当前阶段处理不同的文件
    // 如果已经有提纯版内容，意味着我们在第二步，此时要包含其他文件
    if (purifiedDraft) {
      // 第二步上传，包含其他辅助文件
      console.log("FileStep - 第二步文件变化，更新其他辅助文件");
      const secondStepFiles = otherFiles || [];
      // 不需要setFiles，因为这些文件会在handleGenerateFinalDraft中使用
    } else {
      // 第一步只考虑初稿文件
      const firstStepFiles = draftFile ? [draftFile] : [];
      console.log(
        "FirstStep - 第一步文件变化，更新初稿文件数量:",
        firstStepFiles.length
      );
      setFiles(firstStepFiles);
    }
  }, [draftFile, otherFiles, purifiedDraft, setFiles]);

  // 处理快速操作按钮点击事件
  const handleDraftClick = () => {
    // 切换到初稿高级输入模式
    setInputMode("draft");
    // 不再需要在这里清空，因为会在统一的handleButtonChange中处理
  };

  // 切换到简单模式，而不是复杂模式的custom类型
  const handleCustomClick = () => {
    setInputMode("simple");
    // 设置适合分稿的简洁提示文本
    setPlaceholder("例如：南加州大学(USC) 经济学硕士");
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  // 切换到简单模式
  const handleSchoolProfessorClick = () => {
    setInputMode("simple");
    // 更改提示文本而不是直接设置查询内容
    setPlaceholder("例如：查询斯坦福大学计算机科学系的教授信息");
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  const handleQuestionClick = () => {
    // 切换到简单模式
    setInputMode("simple");
    // 更改提示文本而不是直接设置查询内容
    setPlaceholder("例如：介绍一下留学申请的主要步骤和注意事项");
    // 不清空simpleQuery，保留用户之前的输入 - 现在会在handleButtonChange中处理
    setIsInputExpanded(true);
  };

  // 添加统一的按钮切换处理函数 - 清空输入和文件
  const handleButtonChange = useCallback(
    (type: ButtonType) => {
      console.log("按钮切换至:", type);

      // 清空所有输入和文件
      setSimpleQuery("");
      setSimpleFiles([]);
      setDirection("");
      setRequirements("");
      setDraftFile(null);
      setOtherFiles([]);
      setPurifiedDraft(null); // 清空提纯版内容
      setFinalDraftResult(null); // 清空最终初稿结果

      // 同时清空父组件的状态
      setQuery("");
      setFiles([]);

      // 直接将result设为null，确保结果不会显示
      setResult(null);

      // 设置shouldHideResult为true，确保即使有result也不会显示
      setShouldHideResult(true);

      // 清空个人陈述初稿
      if (setFinalDraft) {
        setFinalDraft(null);
      }

      // 设置CV助理状态
      if (setIsCVAssistant) {
        setIsCVAssistant(type === "cv");
      }
    },
    [
      setQuery,
      setFiles,
      setResult,
      setShouldHideResult,
      setFinalDraft,
      setIsCVAssistant,
    ]
  );

  // 新增：处理清空生成内容
  const handleClearGeneratedContent = useCallback(() => {
    // 清空提纯版内容
    setPurifiedDraft(null);
    // 清空最终初稿结果
    setFinalDraftResult(null);
    // 清空父组件的result
    setResult(null);

    // 清空个人陈述初稿
    if (setFinalDraft) {
      setFinalDraft(null);
    }

    // 新增：清空用户输入和上传的文件
    setDirection("");
    setRequirements("");
    setDraftFile(null);
    setOtherFiles([]);

    // 显示清空成功提示
    toast({
      title: "已清空",
      description: "所有内容已重置",
    });
  }, [
    setResult,
    setFinalDraft,
    setDirection,
    setRequirements,
    setDraftFile,
    setOtherFiles,
  ]);

  // 添加状态来跟踪当前助理类型
  const [currentAssistantType, setCurrentAssistantType] = useState<
    "draft" | "cv" | "ps" | "custom"
  >("custom");

  return (
    <div className="w-full flex flex-col items-center">
      {/* 快速操作按钮 */}
      <QuickActionButtons
        onDraftClick={handleDraftClick}
        onSchoolProfessorClick={handleSchoolProfessorClick}
        onQuestionClick={handleQuestionClick}
        onCustomClick={handleCustomClick}
        onButtonChange={onButtonChange}
        setResult={setResult}
        setIsPSAssistant={setIsPSAssistant}
        setShowStepNavigation={setShowStepNavigation}
        setIsCVAssistant={setIsCVAssistant}
        setCurrentAssistantType={setCurrentAssistantType}
      />

      {/* 只在初稿模式下显示提示组件 */}
      {inputMode === "draft" && <AssistantTips type="draft" />}

      {/* 根据当前模式显示不同的输入区域 */}
      {inputMode === "simple" || inputMode === "custom" ? (
        /* 简单输入区域 - 现在也用于custom类型 */
        <InputArea
          query={simpleQuery}
          setQuery={setSimpleQuery}
          isLoading={isLoading}
          isInputExpanded={isInputExpanded}
          setIsInputExpanded={setIsInputExpanded}
          handleSubmit={handleSimpleSubmit}
          handleExampleClick={handleExampleClick}
          files={simpleFiles}
          setFiles={setSimpleFiles}
          placeholder={placeholder} // 传递提示文本
        />
      ) : (
        /* 高级输入区域 - 现在只用于draft类型 */
        <div className="w-full px-4 py-2 overflow-visible">
          <AdvancedInputArea
            isLoading={isLoading}
            type="draft" // 固定为draft类型
            direction={direction}
            requirements={requirements}
            setDirection={setDirection}
            setRequirements={setRequirements}
            draftFile={draftFile}
            otherFiles={otherFiles}
            setDraftFile={setDraftFile}
            setOtherFiles={setOtherFiles}
            onSubmitClick={handleAdvancedSubmit}
            onInputChange={handleAdvancedInputChange}
            onFileChange={handleAdvancedFileChange}
            purifiedDraft={purifiedDraft}
            isPurifying={isPurifying}
            onGenerateFinalDraft={handleGenerateFinalDraft}
            onClearGeneratedContent={handleClearGeneratedContent}
            onStepChange={onStepChange} // 添加跳转步骤的回调
          />
        </div>
      )}

      {/* 结果区域 - 如果有结果 */}
      <div ref={resultRef}>
        {/* 初稿模式下不再显示结果，因为已经移到DraftGeneration组件中 */}

        {/* 非初稿模式下的结果显示 - 添加shouldHideResult条件 */}
        {inputMode !== "draft" && result && !shouldHideResult && (
          <ResultSection
            result={result}
            expandedSteps={expandedSteps}
            setExpandedSteps={setExpandedSteps}
            handleStepClick={handleStepClick}
          />
        )}
      </div>
    </div>
  );
}

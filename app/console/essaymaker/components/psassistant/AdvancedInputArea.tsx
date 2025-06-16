/**
 * AdvancedInputArea 组件 - 现代化设计 (重构版)
 *
 * 功能：PS助理的高级输入区域组件，采用与分稿助理相同的现代化设计风格
 *
 * 设计特点：
 * 1. 现代化卡片布局：使用渐变背景和阴影效果
 * 2. 图标+标题组合：统一的视觉层次结构
 * 3. 可折叠设计：支持展开/收起功能，节省空间
 * 4. 组件化架构：拆分为多个子组件，便于维护
 * 5. 响应式交互：流畅的悬停和过渡效果
 *
 * 组件架构：
 * - DirectionInputSection: 申请方向输入组件
 * - RequirementsSection: 写作需求定制组件
 * - FileUploadSection: 文件上传组件
 *
 * @author EssayMaker Team
 * @version 3.0.0 - 组件化重构，拆分为多个子组件
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronUp, Send, ChevronDown, Sparkles, NotebookText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { DisplayResult } from "../../types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FullScreenLoadingAnimation } from "../LoadingAnimation";

// 🆕 导入拆分的子组件
import { DirectionInputSection } from "./components/DirectionInputSection";
import { RequirementsSection } from "./components/RequirementsSection";
import { FileUploadSection } from "./components/FileUploadSection";

interface AdvancedInputAreaProps {
  isLoading: boolean;
  type: "draft" | "custom"; // 区分初稿还是定制内容类型
  // 添加新的props用于直接更新父组件状态
  direction: string;
  requirements: string;
  setDirection: (direction: string) => void;
  setRequirements: React.Dispatch<React.SetStateAction<string>>;
  draftFile: File | null;
  otherFiles: File[];
  setDraftFile: (file: File | null) => void;
  setOtherFiles: (files: File[]) => void;
  onSubmitClick: () => void;
  // 添加输入变化回调
  onInputChange: () => void;
  // 添加文件变化回调
  onFileChange: () => void;
  // 新增：个人陈述素材表文件提纯版状态
  purifiedDraft?: string | null;
  isPurifying?: boolean;
  // 新增：生成最终初稿按钮的回调
  onGenerateFinalDraft?: () => void;
  // 新增：清除生成内容的回调
  onClearGeneratedContent?: () => void;
  // 新增：最终初稿生成结果
  finalDraftResult?: DisplayResult | null;
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft?: boolean;
  // 新增：跳转到步骤的回调函数
  onStepChange?: (step: number) => void;
  // 以下是新增的PSFileUpload传递过来的props
  schoolInfo: any; // 请根据实际数据结构替换'any'
  setSchoolInfo: (info: any) => void; // 请根据实际数据结构替换'any'
  programInfo: any; // 请根据实际数据结构替换'any'
  setProgramInfo: (info: any) => void; // 请根据实际数据结构替换'any'
  otherRequirements: any; // 请根据实际数据结构替换'any'
  setOtherRequirements: (req: any) => void; // 请根据实际数据结构替换'any'
  // 🆕 粘贴模式相关props
  isPasteMode?: boolean;
  setPasteMode?: (isPaste: boolean) => void;
  pastedText?: string;
  setPastedText?: (text: string) => void;
}

export function AdvancedInputArea({
  isLoading,
  type,
  // 使用父组件传入的状态和更新函数
  direction,
  requirements,
  setDirection,
  setRequirements,
  draftFile,
  otherFiles,
  setDraftFile,
  setOtherFiles,
  onSubmitClick,
  // 添加回调函数
  onInputChange,
  onFileChange,
  // 新增：个人陈述素材表文件提纯版状态
  purifiedDraft,
  isPurifying,
  // 新增：生成最终初稿的回调
  onGenerateFinalDraft,
  // 新增：清除生成内容的回调
  onClearGeneratedContent,
  // 新增：最终初稿生成结果
  finalDraftResult,
  // 新增：是否正在生成最终初稿
  isGeneratingFinalDraft,
  // 新增：跳转到步骤的回调函数
  onStepChange,
  // 以下是新增的PSFileUpload传递过来的props
  schoolInfo,
  setSchoolInfo,
  programInfo,
  setProgramInfo,
  otherRequirements,
  setOtherRequirements,
  // 🆕 粘贴模式相关props
  isPasteMode: parentIsPasteMode,
  setPasteMode: parentSetPasteMode,
  pastedText: parentPastedText,
  setPastedText: parentSetPastedText,
}: AdvancedInputAreaProps) {
  const { toast } = useToast();

  // 🆕 组件状态管理
  const [isCollapsed, setIsCollapsed] = useState(false); // 主卡片折叠状态
  const [submitting, setSubmitting] = useState(false); // 提交状态
  
  // 🆕 粘贴模式状态管理 - 使用本地状态，如果父组件没有传递的话
  const [localIsPasteMode, setLocalIsPasteMode] = useState(false);
  const [localPastedText, setLocalPastedText] = useState("");
  
  const isPasteMode = parentIsPasteMode !== undefined ? parentIsPasteMode : localIsPasteMode;
  const setIsPasteMode = parentSetPasteMode || setLocalIsPasteMode;
  const pastedText = parentPastedText !== undefined ? parentPastedText : localPastedText;
  const setPastedText = parentSetPastedText || setLocalPastedText;

  // 监听isLoading变化，重置submitting状态
  useEffect(() => {
    if (!isLoading && submitting) {
      setSubmitting(false);
    }
  }, [isLoading, submitting]);

  // 监听输入变化
  useEffect(() => {
    if (onInputChange) {
      onInputChange();
    }
  }, [direction, requirements, onInputChange]);

  // 监听文件变化
  useEffect(() => {
    if (onFileChange) {
      onFileChange();
    }
  }, [draftFile, otherFiles, onFileChange]);

  // 监听最终初稿生成状态
  useEffect(() => {
    if (!finalDraftResult) return;

    console.log("检查 finalDraftResult:", {
      isComplete: finalDraftResult.isComplete,
      content: finalDraftResult.content,
    });

    // 如果内容已经生成完成，直接设置状态为false
    if (finalDraftResult.isComplete) {
      console.log("检测到完成状态，设置 isGeneratingFinalDraft 为 false");
    }
  }, [finalDraftResult?.isComplete]);

  // 处理提交
  const handleSubmit = () => {
    // 初稿模式下必须有个人陈述素材表文件或粘贴内容
    if (type === "draft") {
      if (isPasteMode) {
        if (!pastedText.trim()) {
          toast({
            variant: "destructive",
            title: "内容缺失",
            description: "请粘贴个人陈述素材内容",
            action: <ToastAction altText="关闭">关闭</ToastAction>,
          });
          return;
        }
      } else {
        if (!draftFile) {
          toast({
            variant: "destructive",
            title: "文件缺失",
            description: "请上传个人陈述素材表文件",
            action: <ToastAction altText="关闭">关闭</ToastAction>,
          });
          return;
        }
      }
    }

    // 防止重复提交，设置提交状态
    setSubmitting(true);

    try {
      // 直接调用父组件提交函数，不在这里构建queryText
      onSubmitClick();
    } finally {
      // 重置提交状态，确保按钮不会一直禁用
      setTimeout(() => {
        setSubmitting(false);
      }, 1000); // 1秒后重置状态，给用户一个短暂的反馈
    }
  };

  // 处理生成最终初稿
  const handleGenerateFinalDraft = () => {
    // 添加日志来检查purifiedDraft的值
    console.log("生成初稿时的purifiedDraft值:", purifiedDraft);
    console.log("生成初稿时的direction值:", direction);

    // 首先检查是否填写了申请方向
    if (!direction.trim()) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先填写申请方向",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 然后检查是否存在提纯版内容
    if (!purifiedDraft) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先提交个人陈述素材表文件生成提纯版",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }

    // 调用父组件的回调函数
    if (onGenerateFinalDraft) {
      onGenerateFinalDraft();
    } else {
      console.error("未提供onGenerateFinalDraft回调函数");
    }
  };

  // 检查表单是否可以提交
  const canSubmit = direction.trim() && !isLoading && !submitting;

  console.log("状态变化:", {
    isLoading,
    submitting,
    disabled: isLoading || submitting,
  });

  return (
    <>
      {/* 全屏加载动画 - 在生成过程中显示 */}
      {(isLoading || isGeneratingFinalDraft) && (
        <FullScreenLoadingAnimation
          text={
            isGeneratingFinalDraft
              ? "正在生成个人陈述初稿，请勿切换页面..."
              : "正在分析个人陈述素材，请勿切换页面..."
          }
        />
      )}

      <div className="w-full max-w-4xl mx-auto mb-8">
        <Card
          className="border shadow-md bg-gradient-to-br from-stone-100 via-zinc-100 to-slate-100/90 rounded-xl overflow-hidden"
          style={{ border: "none !important", outline: "none !important" }}
        >
          {/* 🆕 折叠状态下的摘要显示 */}
          {isCollapsed ? (
            <CardHeader
              className={`py-4 px-6 rounded-t-xl ${
                !isLoading
                  ? "cursor-pointer hover:bg-stone-100/70 transition-colors"
                  : ""
              }`}
              onClick={!isLoading ? () => setIsCollapsed(false) : undefined}
              style={{
                border: "none !important",
                boxShadow: "none !important",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                    <NotebookText className="h-5 w-5 text-stone-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-600">
                      {isLoading ? "正在生成初稿..." : "信息已填写"}
                    </div>
                    <div className="text-lg font-medium truncate text-stone-800">
                      {direction || "个人陈述初稿生成"}
                    </div>
                  </div>
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <span>展开编辑</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardHeader>
          ) : (
            // 🆕 展开状态下的完整表单
            <>
              <CardHeader
                className="pb-4 bg-gradient-to-r from-stone-200/60 to-zinc-200/50 border-b border-stone-300/30 rounded-t-xl"
                style={{
                  border: "none !important",
                  boxShadow: "none !important",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-stone-200 to-zinc-200/95 rounded-lg">
                      <NotebookText className="h-6 w-6 text-stone-700" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-stone-800">
                      个人陈述初稿生成
                    </CardTitle>
                  </div>
                  {canSubmit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCollapsed(true)}
                      className="text-stone-600 hover:text-stone-800 hover:bg-stone-100/70"
                    >
                      <ChevronUp className="h-4 w-4 mr-1" />
                      收起
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 px-6 pt-6 pb-6 bg-stone-50/50 rounded-b-xl">
                {/* 🆕 申请方向输入区域 */}
                <DirectionInputSection
                  direction={direction}
                  setDirection={setDirection}
                  isLoading={isLoading}
                />

                <Separator className="my-6" />

                {/* 🆕 写作需求定制区域 */}
                <RequirementsSection
                  requirements={requirements}
                  setRequirements={setRequirements}
                  isLoading={isLoading}
                />

                <Separator className="my-6" />

                {/* 🆕 文件上传区域 */}
                <FileUploadSection
                  draftFile={draftFile}
                  setDraftFile={setDraftFile}
                  otherFiles={otherFiles}
                  setOtherFiles={setOtherFiles}
                  isLoading={isLoading}
                  isPasteMode={isPasteMode}
                  setPasteMode={setIsPasteMode}
                  pastedText={pastedText}
                  setPastedText={setPastedText}
                />

                {/* 🆕 提交按钮区域 */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    size="lg"
                    className="px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-stone-700 hover:bg-stone-800 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        正在生成...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        开始分析
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* 添加CSS样式来确保圆角效果 */}
        <style jsx>{`
          .rounded-xl {
            border-radius: 0.75rem !important;
            overflow: hidden !important;
          }
          .rounded-t-xl {
            border-top-left-radius: 0.75rem !important;
            border-top-right-radius: 0.75rem !important;
          }
          .rounded-b-xl {
            border-bottom-left-radius: 0.75rem !important;
            border-bottom-right-radius: 0.75rem !important;
          }
        `}</style>
      </div>
    </>
  );
}

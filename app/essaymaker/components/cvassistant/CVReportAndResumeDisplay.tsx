/**
 * CVReportAndResumeDisplay 组件
 * 
 * 功能：CV助理的报告和简历展示组件，显示分析结果和生成的简历
 * 
 * 核心特性：
 * 1. 双栏布局：
 *    - 左侧：分析报告展示
 *    - 右侧：生成的简历内容
 *    - 响应式布局适配
 *    - 可调整的分栏比例
 * 
 * 2. 报告展示：
 *    - 简历分析结果
 *    - 优化建议和改进点
 *    - 技能匹配度分析
 *    - 行业标准对比
 * 
 * 3. 简历展示：
 *    - 格式化的简历内容
 *    - 实时生成和更新
 *    - 多种模板样式
 *    - 导出功能支持
 * 
 * 4. 交互功能：
 *    - 内容复制和下载
 *    - 编辑和修改选项
 *    - 版本对比功能
 *    - 分享和保存
 * 
 * 5. 状态管理：
 *    - 加载状态指示
 *    - 错误状态处理
 *    - 生成进度跟踪
 *    - 完成状态确认
 * 
 * 6. 用户体验：
 *    - 流畅的内容切换
 *    - 清晰的视觉层次
 *    - 直观的操作反馈
 *    - 优雅的动画效果
 * 
 * 技术实现：
 * - 使用自定义Hook管理状态
 * - 支持流式内容更新
 * - Markdown渲染支持
 * - 响应式设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { DisplayResult } from "../../types";
import { DraftResultDisplay } from "../DraftResultDisplay";
import { useState, useEffect } from "react";
import { useCVDraft } from "./hooks/useCVDraft";

interface CVReportAndResumeDisplayProps {
  result: DisplayResult | null;
  formattedResume: DisplayResult | null;
  onFormattedResumeChange: (result: DisplayResult) => void;
  onStepChange: (step: number) => void;
  onGeneratingStateChange?: (isGenerating: boolean) => void;
}

export function CVReportAndResumeDisplay({
  result,
  formattedResume,
  onFormattedResumeChange,
  onStepChange,
  onGeneratingStateChange,
}: CVReportAndResumeDisplayProps) {
  const { generateDraft, isGeneratingDraft } = useCVDraft();

  // 自定义提示词状态
  const [customRolePrompt, setCustomRolePrompt] = useState("");
  const [customTaskPrompt, setCustomTaskPrompt] = useState("");
  const [customOutputFormatPrompt, setCustomOutputFormatPrompt] = useState("");

  // 使用 useCVDraft hook 处理简历生成
  const handleGenerateResume = async () => {
    if (!result) return;

    await generateDraft(
      result,
      onFormattedResumeChange,
      customRolePrompt,
      customTaskPrompt,
      customOutputFormatPrompt
    );
  };

  // 监听生成状态变化，通知父组件
  useEffect(() => {
    if (onGeneratingStateChange) {
      onGeneratingStateChange(isGeneratingDraft);
    }
  }, [isGeneratingDraft, onGeneratingStateChange]);

  // 如果没有结果，显示引导信息
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="text-center p-8 max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">简历生成</h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的文件，我们将为您生成专业的简历。请先在第一步上传您的文件。
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => onStepChange(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回文件上传
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 有结果的情况
  return (
    <div className="flex flex-col items-center justify-start w-full px-0">
      <div className="w-full max-w-[1800px] mx-auto">
        <div className="p-2">
          {/* 当有格式化简历时使用双列布局 */}
          {formattedResume ? (
            // 有格式化简历时的布局
            <div className="flex flex-col">
              {/* 自定义提示词输入区域 - 在双列布局上方 */}
              <div className="mb-6 p-6 border rounded-lg bg-card hidden">
                <h3 className="text-lg font-semibold mb-4">自定义提示词设置</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色提示词</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务提示词</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式提示词</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* 双列布局区域 */}
              <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
                {/* 左侧 - 简历分析报告 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={result}
                      title="简历分析报告"
                      key="resume-analysis"
                      headerActions={
                        <Button
                          disabled={
                            isGeneratingDraft ||
                            !result.content ||
                            !result.isComplete
                          }
                          onClick={handleGenerateResume}
                          title={
                            !result.isComplete
                              ? "请等待内容创作完成后再生成简历"
                              : ""
                          }
                          variant="default"
                          size="sm"
                          className="mr-2"
                        >
                          {isGeneratingDraft ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              生成简历
                            </>
                          )}
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* 右侧 - 生成的简历 */}
                <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-visible pb-6 flex flex-col h-full">
                  <div className="rounded-lg overflow-visible flex-grow h-full">
                    <DraftResultDisplay
                      result={formattedResume}
                      title="生成的简历"
                      key="formatted-resume"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 没有格式化简历时的布局
            <div className="w-full max-w-[1300px] mx-auto">
              {/* 自定义提示词输入区域 */}
              <div className="mb-6 p-6 border rounded-lg bg-card hidden">
                <h3 className="text-lg font-semibold mb-4">自定义提示词设置</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-prompt">角色提示词</Label>
                    <Input
                      id="role-prompt"
                      value={customRolePrompt}
                      onChange={(e) => setCustomRolePrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="task-prompt">任务提示词</Label>
                    <Input
                      id="task-prompt"
                      value={customTaskPrompt}
                      onChange={(e) => setCustomTaskPrompt(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="format-prompt">输出格式提示词</Label>
                    <Textarea
                      id="format-prompt"
                      value={customOutputFormatPrompt}
                      onChange={(e) =>
                        setCustomOutputFormatPrompt(e.target.value)
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg overflow-visible pb-6">
                <DraftResultDisplay
                  result={result}
                  title="简历分析报告"
                  key="resume-analysis"
                  headerActions={
                    <Button
                      disabled={
                        isGeneratingDraft ||
                        !result.content ||
                        !result.isComplete
                      }
                      onClick={handleGenerateResume}
                      title={
                        !result.isComplete
                          ? "请等待内容创作完成后再生成简历"
                          : ""
                      }
                      variant="default"
                      size="sm"
                      className="mr-2"
                    >
                      {isGeneratingDraft ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 mr-1" />
                          生成简历
                        </>
                      )}
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

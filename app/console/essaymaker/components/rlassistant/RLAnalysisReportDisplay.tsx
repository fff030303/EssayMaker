/**
 * RLAnalysisReportDisplay 组件
 * 
 * 功能：推荐信分析报告展示组件，显示文件分析结果和推荐信生成建议
 * 
 * 核心特性：
 * 1. 分析报告展示：
 *    - 文件内容分析结果
 *    - 推荐人背景评估
 *    - 申请者优势识别
 *    - 改进建议提供
 * 
 * 2. 智能内容渲染：
 *    - 自动检测HTML和Markdown格式
 *    - 动态选择最佳渲染方式
 *    - 支持混合格式内容处理
 *    - 实时内容更新和显示
 * 
 * 3. 流式生成支持：
 *    - 实时接收流式数据
 *    - 逐字显示打字机效果
 *    - 平滑的内容更新动画
 *    - 自动滚动到最新内容
 * 
 * 4. 用户交互：
 *    - 内容复制功能
 *    - 导出下载选项
 *    - 手动滚动控制
 *    - 加载状态指示
 * 
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 动态高度调整
 *    - 内容溢出处理
 *    - 优雅的布局适应
 * 
 * 6. 状态管理：
 *    - 加载状态指示
 *    - 错误状态处理
 *    - 生成进度跟踪
 *    - 完成状态确认
 * 
 * 技术实现：
 * - 使用ReactMarkdown进行Markdown渲染
 * - 使用DOMPurify进行HTML安全化
 * - 支持remarkGfm扩展语法
 * - 自定义组件样式和交互
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Copy,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  User,
  Target,
  Award,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DisplayResult } from "../../types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RLReportAndResumeDisplayProps {
  result: DisplayResult | null;
  isLoading?: boolean;
  streamContent?: string;
  isComplete?: boolean;
}

export function RLReportAndResumeDisplay({
  result,
  isLoading = false,
  streamContent = "",
  isComplete = false,
}: RLReportAndResumeDisplayProps) {
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [isRecommendationExpanded, setIsRecommendationExpanded] =
    useState(true);
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 自动滚动到底部
  useEffect(() => {
    if (contentRef.current && streamContent) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamContent]);

  // 复制内容到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "已复制",
        description: "内容已复制到剪贴板",
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "无法复制到剪贴板",
      });
    }
  };

  // 下载为文本文件
  const downloadAsText = (
    content: string,
    filename: string = "推荐信分析报告.txt"
  ) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "下载完成",
      description: `文件 ${filename} 已下载`,
    });
  };

  // 解析推荐信内容的不同部分
  const parseRecommendationContent = (content: string) => {
    const sections: { [key: string]: string } = {
      analysis: "",
      recommendation: "",
      suggestions: "",
      template: "",
    };

    // 简单的内容分割逻辑，可以根据实际API返回格式调整
    const lines = content.split("\n");
    let currentSection = "analysis";

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("推荐信分析") || lowerLine.includes("分析结果")) {
        currentSection = "analysis";
        continue;
      } else if (
        lowerLine.includes("推荐信内容") ||
        lowerLine.includes("推荐信正文")
      ) {
        currentSection = "recommendation";
        continue;
      } else if (lowerLine.includes("建议") || lowerLine.includes("改进")) {
        currentSection = "suggestions";
        continue;
      } else if (lowerLine.includes("模板") || lowerLine.includes("格式")) {
        currentSection = "template";
        continue;
      }

      sections[currentSection] += line + "\n";
    }

    return sections;
  };

  // 获取显示内容
  const getDisplayContent = () => {
    if (streamContent) {
      return streamContent;
    }
    return result?.content || "";
  };

  const displayContent = getDisplayContent();
  const parsedContent = parseRecommendationContent(displayContent);

  // 如果没有内容且不在加载中，不显示组件
  if (!displayContent && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-[800px] mx-auto mt-6 hidden">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg font-semibold">
                  分析报告
                </CardTitle>
              </div>

              {/* 状态指示器 */}
              <div className="flex items-center space-x-2">
                {isLoading && !isComplete && (
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>生成中</span>
                  </Badge>
                )}
                {isComplete && (
                  <Badge
                    variant="default"
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>已完成</span>
                  </Badge>
                )}
                {result?.timestamp && (
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsContentVisible(!isContentVisible)}
                className="flex items-center space-x-1"
              >
                {isContentVisible ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>隐藏</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>显示</span>
                  </>
                )}
              </Button>

              {displayContent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(displayContent)}
                    className="flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>复制</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAsText(displayContent)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>下载</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {isContentVisible && (
          <CardContent className="pt-0">
            {/* 当前步骤显示 */}
            {result?.currentStep && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    当前步骤: {result.currentStep}
                  </span>
                </div>
              </div>
            )}

            {/* 内容显示区域 */}
            <div
              ref={contentRef}
              className="space-y-4 max-h-[600px] overflow-y-auto"
            >
              {/* 推荐信分析部分 */}
              {parsedContent.analysis && (
                <Collapsible
                  open={isAnalysisExpanded}
                  onOpenChange={setIsAnalysisExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="font-medium">推荐信分析</span>
                      </div>
                      {isAnalysisExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {parsedContent.analysis.trim()}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 推荐信内容部分 */}
              {parsedContent.recommendation && (
                <Collapsible
                  open={isRecommendationExpanded}
                  onOpenChange={setIsRecommendationExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">推荐信内容</span>
                      </div>
                      {isRecommendationExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {parsedContent.recommendation.trim()}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 改进建议部分 */}
              {parsedContent.suggestions && (
                <Collapsible
                  open={isSuggestionsExpanded}
                  onOpenChange={setIsSuggestionsExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">改进建议</span>
                      </div>
                      {isSuggestionsExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {parsedContent.suggestions.trim()}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 模板格式部分 */}
              {parsedContent.template && (
                <Collapsible
                  open={isTemplateExpanded}
                  onOpenChange={setIsTemplateExpanded}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">推荐信模板</span>
                      </div>
                      {isTemplateExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                        {parsedContent.template.trim()}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 如果没有解析出具体部分，显示完整内容 */}
              {!parsedContent.analysis &&
                !parsedContent.recommendation &&
                !parsedContent.suggestions &&
                !parsedContent.template &&
                displayContent && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <BookOpen className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-800">
                        推荐信分析结果
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                      {displayContent}
                    </pre>
                  </div>
                )}

              {/* 加载中的占位符 */}
              {isLoading && !displayContent && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">正在进行推荐信分析...</span>
                  </div>
                </div>
              )}

              {/* 实时流式内容显示 */}
              {streamContent && isLoading && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      实时生成中...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 底部操作区域 */}
            {displayContent && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {displayContent.length} 字符
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(displayContent)}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>复制全部</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadAsText(
                          displayContent,
                          `推荐信分析_${new Date().toLocaleDateString()}.txt`
                        )
                      }
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-3 w-3" />
                      <span>导出文件</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, Send, File } from "lucide-react";
import { DisplayResult } from "../types";
import { DraftResultDisplay } from "./DraftResultDisplay";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface DraftGenerationProps {
  result: DisplayResult | null;
  finalDraft: DisplayResult | null;
  finalDraftResult: DisplayResult | null;
  onStepChange: (step: number) => void;
  onGenerateFinalDraft?: () => void;
  isGeneratingFinalDraft?: boolean;
  userDirection?: string;
  userRequirements?: string;
  otherFiles?: File[];
}

export function DraftGeneration({
  result,
  finalDraft,
  finalDraftResult,
  onStepChange,
  onGenerateFinalDraft,
  isGeneratingFinalDraft = false,
  userDirection = "",
  userRequirements = "",
  otherFiles = [],
}: DraftGenerationProps) {
  const [generatingFinalDraft, setGeneratingFinalDraft] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setGeneratingFinalDraft(isGeneratingFinalDraft);
  }, [isGeneratingFinalDraft]);
  
  useEffect(() => {
    if (finalDraft && finalDraft.isComplete) {
      setGeneratingFinalDraft(false);
    }
  }, [finalDraft]);
  
  const handleGenerateFinalDraft = () => {
    if (!result || !result.content) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请先提交初稿文件生成素材整理报告",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }
    
    if (!userDirection.trim()) {
      toast({
        variant: "destructive",
        title: "生成失败",
        description: "请返回第一步填写申请方向",
        action: <ToastAction altText="关闭">关闭</ToastAction>,
      });
      return;
    }
    
    setGeneratingFinalDraft(true);
    
    if (onGenerateFinalDraft) {
      onGenerateFinalDraft();
    } else {
      console.error("未提供onGenerateFinalDraft回调函数");
      setGeneratingFinalDraft(false);
    }
  };
  
  // 如果没有结果，显示引导信息
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full">
        <div className="text-center p-8 max-w-md mb-8">
          <h2 className="text-2xl font-bold mb-4">
            初稿生成
          </h2>
          <p className="text-muted-foreground mb-6">
            基于您上传的文件，我们将为您生成个人陈述初稿。请先在第一步上传您的文件。
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => onStepChange(1)}
            >
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
    <div className="flex flex-col items-center justify-center min-h-full w-full px-0">
      <div className="w-full max-w-[1800px] mx-auto">
        {/* 增加顶部留白 */}
        <div className="p-2 pt-6">
          {/* 当有初稿时使用双列布局 */}
          {finalDraft || finalDraftResult ? (
            // 有初稿时的布局
            <div className="flex flex-col lg:flex-row gap-6 xl:gap-10 justify-center">
              {/* 左侧 - 素材整理报告 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-hidden">
                <div className="rounded-lg overflow-hidden">
                  <DraftResultDisplay result={result} title="素材整理报告" />
                </div>
              </div>
              
              {/* 右侧 - 个人陈述初稿 */}
              <div className="w-full lg:w-[46%] xl:w-[46%] min-w-0 shrink-0 overflow-hidden">
                <div className="rounded-lg overflow-hidden">
                  <DraftResultDisplay 
                    result={finalDraft || finalDraftResult!} 
                    title="个人陈述初稿" 
                  />
                </div>
              </div>
            </div>
          ) : (
            // 没有初稿时的布局
            <div className="w-full max-w-[1300px] mx-auto">
              <div className="rounded-lg overflow-hidden">
                <DraftResultDisplay result={result} title="素材整理报告" />
              </div>
            </div>
          )}
            <div className="mt-8 flex flex-col items-center pb-6">
                {/* 申请方向和要求 */}
                {userDirection && (
                <div className="mb-6 text-center max-w-[600px]">
                    <p className="text-base text-gray-700 mb-2">
                    <span className="font-semibold">申请方向:</span> {userDirection}
                    </p>
                    {userRequirements && (
                    <p className="text-base text-gray-700">
                        <span className="font-semibold">具体要求:</span> {userRequirements}
                    </p>
                    )}
                </div>
                )}
                
                {/* 辅助资料文件 */}
                {otherFiles.length > 0 && (
                <div className="mb-6 text-center">
                    <p className="text-base text-gray-700 mb-3">
                    <span className="font-semibold">辅助资料文件:</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-[600px]">
                    {otherFiles.map((file, index) => (
                        <div key={index} className="flex items-center bg-gray-50 border border-gray-100 rounded-md px-3 py-1.5 text-sm">
                        <File className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span className="truncate max-w-[180px]">{file.name}</span>
                        <span className="ml-1.5 text-gray-500 text-xs">
                            ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        </div>
                    ))}
                    </div>
                </div>
                )}
                
                {/* 生成按钮 */}
                <Button 
                disabled={generatingFinalDraft || isGeneratingFinalDraft || !onGenerateFinalDraft || !result.content || !userDirection.trim()}
                onClick={handleGenerateFinalDraft}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-lime-50
                    text-gray-700 font-semibold text-base shadow-lg transition-transform duration-50
                    hover:scale-105 active:scale-95 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-300"
                >
                {generatingFinalDraft || isGeneratingFinalDraft ? (
                    <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                    </>
                ) : (
                    <>
                    <Send className="h-4 w-4 mr-2" />
                    生成个人陈述初稿
                    </>
                )}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
} 
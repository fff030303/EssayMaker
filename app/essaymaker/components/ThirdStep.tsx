"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, Loader2, ArrowLeft, FileText } from "lucide-react";
import { DisplayResult } from "../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/components/ui/use-toast";

interface ThirdStepProps {
  finalResult: DisplayResult | null;
  onStepChange?: (step: number) => void;
}

export function ThirdStep({ finalResult, onStepChange }: ThirdStepProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col min-w-full">
      <div className="p-2 sm:p-3 md:p-5 overflow-visible">
        <Card className="shadow-lg flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2 sm:gap-3 pb-3 pt-4 px-3 sm:pb-4 sm:pt-5 sm:px-5 flex-shrink-0">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm sm:text-base font-medium">
                最终文章
              </CardTitle>
            </div>
            {finalResult && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(finalResult.content);
                    toast({
                      title: "已复制",
                      description: "内容已复制到剪贴板",
                    });
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  复制
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([finalResult.content], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "essay.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  下载
                </Button>
              </div>
            )}
          </CardHeader>
          {finalResult?.currentStep && (
            <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm text-gray-500 bg-gray-50 border-t border-b border-gray-100 flex-shrink-0">
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span>{finalResult.currentStep}</span>
            </div>
          )}
          <CardContent className="pt-4 px-3 pb-4 sm:pt-6 sm:px-6 sm:pb-6 flex-grow">
            {finalResult ? (
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-4 leading-relaxed" {...props} />
                    ),
                    h1: ({ node, ...props }) => (
                      <h1
                        className="text-xl font-bold mt-6 mb-4 text-gray-900"
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-lg font-bold mt-5 mb-3 text-gray-900"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-base font-bold mt-4 mb-2 text-gray-900"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="my-3 pl-6 list-disc" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="my-3 pl-6 list-decimal" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-gray-200 pl-4 italic my-4 text-gray-600"
                        {...props}
                      />
                    ),
                    code: ({ node, className, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline =
                        !match && !className?.includes("contains-task-list");
                      return isInline ? (
                        <code
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-gray-100 p-3 rounded-md text-sm font-mono overflow-x-auto my-4 text-gray-800"
                          {...props}
                        />
                      );
                    },
                  }}
                >
                  {finalResult.content || "正在生成内容..."}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-gray-500 p-6">
                <p>请先完成前两步操作，然后生成最终文章</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

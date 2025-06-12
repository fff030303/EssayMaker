/**
 * DraftResult 处理函数自定义 Hook
 * 包含复制、下载等处理逻辑
 */

"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ContentSegment } from "../contentUtils";
import { cleanMarkdownToPlainText, removeHtmlKeepMarkdown } from "../utils";

interface UseDraftResultHandlersProps {
  contentSegments: ContentSegment[];
  effectiveResult: any;
  title: string;
}

export function useDraftResultHandlers({
  contentSegments,
  effectiveResult,
  title,
}: UseDraftResultHandlersProps) {
  const [copying, setCopying] = useState(false);
  const { toast } = useToast();

  // 处理复制内容
  const handleCopy = async () => {
    if (!effectiveResult?.content) return;

    setCopying(true);
    try {
      // 只复制resume类型的内容，忽略reasoning
      let contentToCopy = "";
      if (contentSegments.length > 0) {
        const resumeSegments = contentSegments.filter(
          (seg) => seg.content_type !== "reasoning"
        );
        contentToCopy = resumeSegments.map((seg) => seg.content).join("\n\n");
      } else {
        contentToCopy = effectiveResult.content;
      }

      // 使用清理函数去除Markdown格式，获取纯文本
      const cleanContent = cleanMarkdownToPlainText(contentToCopy);

      // 尝试使用现代clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanContent);
      } else {
        // 回退到传统方法
        const textArea = document.createElement("textarea");
        textArea.value = cleanContent;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) throw new Error("document.execCommand复制失败");
      }

      toast({
        title: "复制成功",
        description: "内容已复制到剪贴板（已去除格式）",
      });
    } catch (err) {
      console.error("复制失败:", err);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板，请尝试手动复制",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  // 处理下载内容
  const handleDownload = async () => {
    if (!effectiveResult?.content) return;

    try {
      // 获取要下载的内容
      let contentToDownload = "";
      if (contentSegments.length > 0) {
        const resumeSegments = contentSegments.filter(
          (seg) => seg.content_type !== "reasoning"
        );
        contentToDownload = resumeSegments
          .map((seg) => seg.content)
          .join("\n\n");
      } else {
        contentToDownload = effectiveResult.content;
      }

      // 去除HTML代码，保留Markdown格式
      const processedContent = removeHtmlKeepMarkdown(contentToDownload);

      console.log("下载内容处理:", {
        原始内容长度: contentToDownload.length,
        处理后长度: processedContent.length,
        原始预览: contentToDownload.substring(0, 200) + "...",
        处理后预览: processedContent.substring(0, 200) + "...",
      });

      // 使用格式化Word生成器处理Markdown
      const { generateWordDocumentWithFormatting } = await import(
        "../../../utils/docxGenerator"
      );
      await generateWordDocumentWithFormatting(processedContent, title);

      toast({
        title: "下载成功",
        description: `${title}已下载为Word文档`,
      });
    } catch (error) {
      console.error("下载Word文档失败:", error);

      // 如果格式化下载失败，尝试纯文本下载
      try {
        console.log("尝试使用纯文本生成器...");
        const { generateWordDocument } = await import(
          "../../../utils/docxGenerator"
        );

        let contentToDownload = "";
        if (contentSegments.length > 0) {
          const resumeSegments = contentSegments.filter(
            (seg) => seg.content_type !== "reasoning"
          );
          contentToDownload = resumeSegments
            .map((seg) => seg.content)
            .join("\n\n");
        } else {
          contentToDownload = effectiveResult.content;
        }

        const cleanContent = cleanMarkdownToPlainText(contentToDownload);
        await generateWordDocument(cleanContent, title);

        toast({
          title: "下载成功（纯文本）",
          description: `${title}已下载为Word文档`,
        });
      } catch (fallbackError) {
        console.error("纯文本docx生成也失败:", fallbackError);
        toast({
          title: "下载失败",
          description: "文档下载失败，请稍后重试",
          variant: "destructive",
        });
      }
    }
  };

  return {
    copying,
    handleCopy,
    handleDownload,
  };
}

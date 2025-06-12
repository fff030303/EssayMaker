/**
 * 操作按钮组件
 * 包含复制、下载、流式生成控制等按钮
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Pause, Play, Square, Loader2 } from "lucide-react";
import type { ColorScheme } from "./config";

interface ActionButtonsProps {
  // 基础props
  headerActions?: React.ReactNode;
  colorScheme: ColorScheme;

  // 状态
  isComplete: boolean;
  copying: boolean;

  // 全局流式生成相关
  enableGlobalStreaming?: boolean;
  taskId?: string;
  isStreaming: boolean;
  isPaused: boolean;

  // 处理函数
  handleCopy: () => void;
  handleDownload: () => void;
  handlePauseGlobalStream: () => void;
  handleResumeGlobalStream: () => void;
  handleStopGlobalStream: () => void;
}

export function ActionButtons({
  headerActions,
  colorScheme,
  isComplete,
  copying,
  enableGlobalStreaming,
  taskId,
  isStreaming,
  isPaused,
  handleCopy,
  handleDownload,
  handlePauseGlobalStream,
  handleResumeGlobalStream,
  handleStopGlobalStream,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      {headerActions}

      {/* 全局流式生成控制按钮 */}
      {enableGlobalStreaming && taskId && (
        <>
          {isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 rounded-full transition-colors ${colorScheme.buttonHover}`}
              onClick={handlePauseGlobalStream}
              title="暂停生成"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}

          {isPaused && (
            <Button
              variant="ghost"
              size="sm"
              className={`w-10 h-10 p-0 rounded-full transition-colors ${colorScheme.buttonHover}`}
              onClick={handleResumeGlobalStream}
              title="恢复生成"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          {(isStreaming || isPaused) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              onClick={handleStopGlobalStream}
              title="停止生成"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {/* 复制和下载按钮 - 仅在生成完成后显示 */}
      {isComplete && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={`w-10 h-10 p-0 rounded-full transition-colors ${colorScheme.buttonHover}`}
            onClick={handleCopy}
            disabled={copying}
            title="复制内容"
          >
            {copying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-10 h-10 p-0 rounded-full transition-colors ${colorScheme.buttonHover}`}
            onClick={handleDownload}
            title="下载Word文档"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

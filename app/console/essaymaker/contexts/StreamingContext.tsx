"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { DisplayResult } from '../types';
import { useToast } from '@/hooks/use-toast';

// 流式生成任务的类型定义
export interface StreamingTask {
  id: string;
  type: 'ps_draft' | 'cv_generation' | 'rl_generation' | 'general_query';
  title: string;
  status: 'pending' | 'streaming' | 'completed' | 'error' | 'paused';
  result: DisplayResult | null;
  startTime: number;
  endTime?: number;
  error?: string;
  // 流式生成的控制器
  controller?: AbortController;
  reader?: ReadableStreamDefaultReader<Uint8Array>;
  // 恢复生成所需的参数
  resumeParams?: {
    query: string;
    files?: File[];
    assistantType?: string;
    [key: string]: any;
  };
}

// 上下文类型定义
interface StreamingContextType {
  // 当前活跃的任务
  activeTasks: Map<string, StreamingTask>;
  
  // 创建新的流式生成任务
  createTask: (
    type: StreamingTask['type'],
    title: string,
    resumeParams?: StreamingTask['resumeParams']
  ) => string;
  
  // 开始流式生成
  startStreaming: (
    taskId: string,
    stream: ReadableStream<Uint8Array>,
    onUpdate?: (result: DisplayResult) => void,
    onComplete?: (result: DisplayResult) => void,
    onError?: (error: Error) => void
  ) => Promise<void>;
  
  // 暂停流式生成
  pauseStreaming: (taskId: string) => void;
  
  // 恢复流式生成
  resumeStreaming: (taskId: string) => Promise<void>;
  
  // 停止流式生成
  stopStreaming: (taskId: string) => void;
  
  // 获取任务状态
  getTask: (taskId: string) => StreamingTask | undefined;
  
  // 更新任务结果
  updateTaskResult: (taskId: string, result: DisplayResult) => void;
  
  // 清理已完成的任务
  cleanupTask: (taskId: string) => void;
  
  // 获取所有活跃任务
  getActiveTasks: () => StreamingTask[];
}

const StreamingContext = createContext<StreamingContextType | null>(null);

export function StreamingProvider({ children }: { children: React.ReactNode }) {
  const [activeTasks, setActiveTasks] = useState<Map<string, StreamingTask>>(new Map());
  const { toast } = useToast();
  
  // 用于生成唯一ID
  const taskIdCounter = useRef(0);
  
  // 创建新任务
  const createTask = useCallback((
    type: StreamingTask['type'],
    title: string,
    resumeParams?: StreamingTask['resumeParams']
  ): string => {
    const taskId = `task_${Date.now()}_${++taskIdCounter.current}`;
    
    const newTask: StreamingTask = {
      id: taskId,
      type,
      title,
      status: 'pending',
      result: null,
      startTime: Date.now(),
      resumeParams,
    };
    
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      newMap.set(taskId, newTask);
      return newMap;
    });
    
    // console.log(`[StreamingContext] 创建新任务: ${taskId} (${type})`);
    return taskId;
  }, []);
  
  // 开始流式生成
  const startStreaming = useCallback(async (
    taskId: string,
    stream: ReadableStream<Uint8Array>,
    onUpdate?: (result: DisplayResult) => void,
    onComplete?: (result: DisplayResult) => void,
    onError?: (error: Error) => void
  ) => {
    const task = activeTasks.get(taskId);
    if (!task) {
      // console.error(`[StreamingContext] 任务不存在: ${taskId}`);
      return;
    }
    
    // console.log(`[StreamingContext] 开始流式生成: ${taskId}`);
    // 创建中止控制器
    const controller = new AbortController();
    const reader = stream.getReader();
    
    // 更新任务状态
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      const updatedTask = {
        ...task,
        status: 'streaming' as const,
        controller,
        reader,
      };
      newMap.set(taskId, updatedTask);
      return newMap;
    });
    
    try {
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let currentStep = '正在生成中...';
      let steps: string[] = [];
      
      // 初始结果
      let result: DisplayResult = {
        content: '',
        timestamp: new Date().toISOString(),
        steps: [],
        currentStep,
        isComplete: false,
      };
      
      // 更新任务结果
      const updateResult = (newResult: DisplayResult) => {
        setActiveTasks(prev => {
          const newMap = new Map(prev);
          const currentTask = newMap.get(taskId);
          if (currentTask) {
            newMap.set(taskId, {
              ...currentTask,
              result: newResult,
            });
          }
          return newMap;
        });
        onUpdate?.(newResult);
      };
      
      // 初始更新
      updateResult(result);
      
      while (true) {
        // 检查是否被中止
        if (controller.signal.aborted) {
          // console.log(`[StreamingContext] 流式生成被中止: ${taskId}`);
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        buffer += chunk;
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'content':
                  if (data.content) {
                    accumulatedContent += data.content;
                    result = {
                      ...result,
                      content: accumulatedContent,
                    };
                    updateResult(result);
                  }
                  break;
                  
                case 'step':
                  currentStep = data.content;
                  steps.push(data.content);
                  result = {
                    ...result,
                    currentStep,
                    steps: [...steps],
                  };
                  updateResult(result);
                  break;
                  
                case 'complete':
                  result = {
                    ...result,
                    isComplete: true,
                    currentStep: undefined,
                  };
                  updateResult(result);
                  
                  // 标记任务完成
                  setActiveTasks(prev => {
                    const newMap = new Map(prev);
                    const currentTask = newMap.get(taskId);
                    if (currentTask) {
                      newMap.set(taskId, {
                        ...currentTask,
                        status: 'completed',
                        endTime: Date.now(),
                      });
                    }
                    return newMap;
                  });
                  
                  onComplete?.(result);
                  // console.log(`[StreamingContext] 流式生成完成: ${taskId}`);
                  return;
                  
                case 'error':
                  throw new Error(data.content || '生成过程中发生错误');
              }
            } catch (parseError) {
              // console.error(`[StreamingContext] 解析数据错误:`, parseError);
            }
          }
        }
      }
      
    } catch (error) {
      // console.error(`[StreamingContext] 流式生成错误: ${taskId}`, error);
      // 标记任务错误
      setActiveTasks(prev => {
        const newMap = new Map(prev);
        const currentTask = newMap.get(taskId);
        if (currentTask) {
          newMap.set(taskId, {
            ...currentTask,
            status: 'error',
            error: error instanceof Error ? error.message : '未知错误',
            endTime: Date.now(),
          });
        }
        return newMap;
      });
      
      onError?.(error instanceof Error ? error : new Error('未知错误'));
      
      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      // 清理资源
      try {
        reader.releaseLock();
      } catch (e) {
        // console.warn(`[StreamingContext] 释放reader失败:`, e);
      }
    }
  }, [activeTasks, toast]);
  
  // 暂停流式生成
  const pauseStreaming = useCallback((taskId: string) => {
    const task = activeTasks.get(taskId);
    if (!task || task.status !== 'streaming') {
      // console.warn(`[StreamingContext] 无法暂停任务: ${taskId}`);
      return;
    }
    
    // console.log(`[StreamingContext] 暂停流式生成: ${taskId}`);
    // 中止当前流
    task.controller?.abort();
    
    // 更新任务状态
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      const currentTask = newMap.get(taskId);
      if (currentTask) {
        newMap.set(taskId, {
          ...currentTask,
          status: 'paused',
        });
      }
      return newMap;
    });
    
    toast({
      title: '已暂停',
      description: `${task.title} 已暂停生成`,
    });
  }, [activeTasks, toast]);
  
  // 恢复流式生成
  const resumeStreaming = useCallback(async (taskId: string) => {
    const task = activeTasks.get(taskId);
    if (!task || task.status !== 'paused' || !task.resumeParams) {
      // console.warn(`[StreamingContext] 无法恢复任务: ${taskId}`);
      return;
    }
    
    // console.log(`[StreamingContext] 恢复流式生成: ${taskId}`);
    // 这里需要重新调用API来恢复生成
    // 具体实现取决于您的API设计
    toast({
      title: '功能开发中',
      description: '恢复生成功能正在开发中',
    });
  }, [activeTasks, toast]);
  
  // 停止流式生成
  const stopStreaming = useCallback((taskId: string) => {
    const task = activeTasks.get(taskId);
    if (!task) {
      // console.warn(`[StreamingContext] 任务不存在: ${taskId}`);
      return;
    }
    
    // console.log(`[StreamingContext] 停止流式生成: ${taskId}`);
    // 中止当前流
    task.controller?.abort();
    
    // 移除任务
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
    
    toast({
      title: '已停止',
      description: `${task.title} 已停止生成`,
    });
  }, [activeTasks, toast]);
  
  // 获取任务
  const getTask = useCallback((taskId: string) => {
    return activeTasks.get(taskId);
  }, [activeTasks]);
  
  // 更新任务结果
  const updateTaskResult = useCallback((taskId: string, result: DisplayResult) => {
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      const task = newMap.get(taskId);
      if (task) {
        newMap.set(taskId, {
          ...task,
          result,
        });
      }
      return newMap;
    });
  }, []);
  
  // 清理任务
  const cleanupTask = useCallback((taskId: string) => {
    // console.log(`[StreamingContext] 清理任务: ${taskId}`);
    setActiveTasks(prev => {
      const newMap = new Map(prev);
      newMap.delete(taskId);
      return newMap;
    });
  }, []);
  
  // 获取所有活跃任务
  const getActiveTasks = useCallback(() => {
    return Array.from(activeTasks.values());
  }, [activeTasks]);
  
  // 清理已完成的任务（定期清理）
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30分钟
      
      setActiveTasks(prev => {
        const newMap = new Map(prev);
        let cleaned = false;
        
        for (const [taskId, task] of newMap.entries()) {
          if (
            (task.status === 'completed' || task.status === 'error') &&
            task.endTime &&
            now - task.endTime > maxAge
          ) {
            newMap.delete(taskId);
            cleaned = true;
            // console.log(`[StreamingContext] 自动清理过期任务: ${taskId}`);
          }
        }
        
        return cleaned ? newMap : prev;
      });
    }, 5 * 60 * 1000); // 每5分钟检查一次
    
    return () => clearInterval(cleanup);
  }, []);
  
  const value: StreamingContextType = {
    activeTasks,
    createTask,
    startStreaming,
    pauseStreaming,
    resumeStreaming,
    stopStreaming,
    getTask,
    updateTaskResult,
    cleanupTask,
    getActiveTasks,
  };
  
  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
}

// Hook for using the streaming context
export function useStreaming() {
  const context = useContext(StreamingContext);
  if (!context) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
} 
import { useCallback } from 'react';
import { useStreaming, StreamingTask } from '../contexts/StreamingContext';
import { DisplayResult } from '../types';
import { useToast } from '@/hooks/use-toast';

export interface GlobalStreamOptions {
  onUpdate?: (result: DisplayResult) => void;
  onComplete?: (result: DisplayResult) => void;
  onError?: (error: Error) => void;
  // 是否在后台继续生成（即使离开页面）
  backgroundGeneration?: boolean;
  // 任务标题
  title?: string;
  // 任务类型
  taskType?: StreamingTask['type'];
  // 恢复生成所需的参数
  resumeParams?: {
    query: string;
    files?: File[];
    assistantType?: string;
    [key: string]: any;
  };
}

export function useGlobalStreamResponse() {
  const {
    createTask,
    startStreaming,
    pauseStreaming,
    resumeStreaming,
    stopStreaming,
    getTask,
    updateTaskResult,
    cleanupTask,
    getActiveTasks,
  } = useStreaming();
  
  const { toast } = useToast();

  // 开始全局流式生成
  const startGlobalStream = useCallback(async (
    stream: ReadableStream<Uint8Array>,
    options: GlobalStreamOptions = {}
  ): Promise<string> => {
    const {
      onUpdate,
      onComplete,
      onError,
      backgroundGeneration = true,
      title = '内容生成',
      taskType = 'general_query',
      resumeParams,
    } = options;

    // 创建新任务
    const taskId = createTask(taskType, title, resumeParams);
    
    console.log(`[GlobalStreamResponse] 创建全局流式任务: ${taskId}`);

    // 开始流式生成
    await startStreaming(
      taskId,
      stream,
      (result) => {
        console.log(`[GlobalStreamResponse] 任务 ${taskId} 更新:`, {
          contentLength: result.content.length,
          isComplete: result.isComplete,
        });
        onUpdate?.(result);
      },
      (result) => {
        console.log(`[GlobalStreamResponse] 任务 ${taskId} 完成`);
        onComplete?.(result);
        
        if (!backgroundGeneration) {
          // 如果不需要后台生成，完成后清理任务
          setTimeout(() => cleanupTask(taskId), 5000);
        }
      },
      (error) => {
        console.error(`[GlobalStreamResponse] 任务 ${taskId} 错误:`, error);
        onError?.(error);
      }
    );

    return taskId;
  }, [createTask, startStreaming, cleanupTask]);

  // 恢复现有任务的流式生成
  const resumeGlobalStream = useCallback(async (taskId: string) => {
    console.log(`[GlobalStreamResponse] 恢复任务: ${taskId}`);
    await resumeStreaming(taskId);
  }, [resumeStreaming]);

  // 暂停流式生成
  const pauseGlobalStream = useCallback((taskId: string) => {
    console.log(`[GlobalStreamResponse] 暂停任务: ${taskId}`);
    pauseStreaming(taskId);
  }, [pauseStreaming]);

  // 停止流式生成
  const stopGlobalStream = useCallback((taskId: string) => {
    console.log(`[GlobalStreamResponse] 停止任务: ${taskId}`);
    stopStreaming(taskId);
  }, [stopStreaming]);

  // 获取任务状态
  const getTaskStatus = useCallback((taskId: string) => {
    return getTask(taskId);
  }, [getTask]);

  // 更新任务结果
  const updateTask = useCallback((taskId: string, result: DisplayResult) => {
    updateTaskResult(taskId, result);
  }, [updateTaskResult]);

  // 获取所有活跃任务
  const getAllTasks = useCallback(() => {
    return getActiveTasks();
  }, [getActiveTasks]);

  // 检查是否有正在进行的任务
  const hasActiveStreaming = useCallback(() => {
    const tasks = getActiveTasks();
    return tasks.some(task => task.status === 'streaming');
  }, [getActiveTasks]);

  // 获取特定类型的活跃任务
  const getActiveTasksByType = useCallback((type: StreamingTask['type']) => {
    const tasks = getActiveTasks();
    return tasks.filter(task => task.type === type && task.status === 'streaming');
  }, [getActiveTasks]);

  // 清理任务
  const cleanupGlobalTask = useCallback((taskId: string) => {
    cleanupTask(taskId);
  }, [cleanupTask]);

  return {
    // 核心功能
    startGlobalStream,
    resumeGlobalStream,
    pauseGlobalStream,
    stopGlobalStream,
    
    // 状态查询
    getTaskStatus,
    updateTask,
    getAllTasks,
    hasActiveStreaming,
    getActiveTasksByType,
    
    // 任务管理
    cleanupGlobalTask,
  };
} 
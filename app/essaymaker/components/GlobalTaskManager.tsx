"use client";

import React, { useState, useEffect } from 'react';
import { useStreaming, StreamingTask } from '../contexts/StreamingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

// 任务类型图标映射
const taskTypeIcons = {
  ps_draft: FileText,
  cv_generation: User,
  rl_generation: MessageSquare,
  general_query: MessageSquare,
};

// 任务类型标签映射
const taskTypeLabels = {
  ps_draft: 'PS初稿',
  cv_generation: 'CV生成',
  rl_generation: 'RL生成',
  general_query: '通用查询',
};

// 状态颜色映射
const statusColors = {
  pending: 'bg-gray-500',
  streaming: 'bg-blue-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
  paused: 'bg-yellow-500',
};

// 状态标签映射
const statusLabels = {
  pending: '等待中',
  streaming: '生成中',
  completed: '已完成',
  error: '错误',
  paused: '已暂停',
};

interface TaskCardProps {
  task: StreamingTask;
  onPause: (taskId: string) => void;
  onResume: (taskId: string) => void;
  onStop: (taskId: string) => void;
  onCleanup: (taskId: string) => void;
}

function TaskCard({ task, onPause, onResume, onStop, onCleanup }: TaskCardProps) {
  const { toast } = useToast();
  
  // 计算进度（基于内容长度的估算）
  const estimatedProgress = task.result?.content 
    ? Math.min(task.result.isComplete ? 100 : Math.min(task.result.content.length / 10, 90), 100)
    : 0;
  
  // 计算运行时间
  const runningTime = task.endTime 
    ? task.endTime - task.startTime 
    : Date.now() - task.startTime;
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };
  
  const TaskIcon = taskTypeIcons[task.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <TaskIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm font-medium truncate">
                  {task.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {taskTypeLabels[task.type]}
                  </Badge>
                  <Badge 
                    className={`text-xs text-white ${statusColors[task.status]}`}
                  >
                    {statusLabels[task.status]}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* 控制按钮 */}
            <div className="flex items-center gap-1">
              {task.status === 'streaming' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onPause(task.id)}
                  title="暂停"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              
              {task.status === 'paused' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onResume(task.id)}
                  title="恢复"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              
              {(task.status === 'streaming' || task.status === 'paused') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  onClick={() => onStop(task.id)}
                  title="停止"
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
              
              {(task.status === 'completed' || task.status === 'error') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                  onClick={() => onCleanup(task.id)}
                  title="清理"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* 进度条 */}
          {task.status === 'streaming' && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>生成进度</span>
                <span>{Math.round(estimatedProgress)}%</span>
              </div>
              <Progress value={estimatedProgress} className="h-2" />
            </div>
          )}
          
          {/* 当前步骤 */}
          {task.result?.currentStep && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="truncate">{task.result.currentStep}</span>
              </div>
            </div>
          )}
          
          {/* 内容预览 */}
          {task.result?.content && (
            <div className="mb-3">
              <div className="text-xs text-gray-600 mb-1">内容预览</div>
              <div className="text-xs bg-gray-50 p-2 rounded border max-h-20 overflow-hidden">
                {task.result.content.substring(0, 100)}
                {task.result.content.length > 100 && '...'}
              </div>
            </div>
          )}
          
          {/* 错误信息 */}
          {task.status === 'error' && task.error && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span className="truncate">{task.error}</span>
              </div>
            </div>
          )}
          
          {/* 时间信息 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>运行时间: {formatTime(runningTime)}</span>
            </div>
            
            {task.status === 'completed' && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>已完成</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function GlobalTaskManager() {
  const { 
    getActiveTasks, 
    pauseStreaming, 
    resumeStreaming, 
    stopStreaming, 
    cleanupTask 
  } = useStreaming();
  
  const [tasks, setTasks] = useState<StreamingTask[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  
  // 定期更新任务列表
  useEffect(() => {
    const updateTasks = () => {
      const activeTasks = getActiveTasks();
      setTasks(activeTasks);
      
      // 如果有活跃任务，显示管理器
      const hasActiveTasks = activeTasks.length > 0;
      setIsVisible(hasActiveTasks);
    };
    
    // 立即更新一次
    updateTasks();
    
    // 每秒更新一次
    const interval = setInterval(updateTasks, 1000);
    
    return () => clearInterval(interval);
  }, [getActiveTasks]);
  
  const handlePause = (taskId: string) => {
    pauseStreaming(taskId);
    toast({
      title: '已暂停',
      description: '任务已暂停，您可以稍后恢复',
    });
  };
  
  const handleResume = (taskId: string) => {
    resumeStreaming(taskId);
    toast({
      title: '正在恢复',
      description: '正在恢复任务生成',
    });
  };
  
  const handleStop = (taskId: string) => {
    stopStreaming(taskId);
    toast({
      title: '已停止',
      description: '任务已停止并清理',
    });
  };
  
  const handleCleanup = (taskId: string) => {
    cleanupTask(taskId);
    toast({
      title: '已清理',
      description: '任务已从列表中移除',
    });
  };
  
  if (!isVisible || tasks.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 right-4 w-80 max-h-[80vh] overflow-y-auto z-50 bg-white rounded-lg shadow-lg border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">生成任务</h3>
        <Badge variant="outline">
          {tasks.length} 个任务
        </Badge>
      </div>
      
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onCleanup={handleCleanup}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
} 
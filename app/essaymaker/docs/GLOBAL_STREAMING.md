# 全局流式生成功能

## 概述

全局流式生成功能允许用户在不同页面间继续流式生成任务，即使离开当前页面，生成过程也会在后台继续进行。这大大提升了用户体验，特别是对于长时间的生成任务。

## 核心特性

### 1. 跨页面状态保持
- 流式生成任务在全局状态中管理
- 用户可以在任意页面查看和控制生成任务
- 页面刷新或导航不会中断生成过程

### 2. 后台生成支持
- 生成任务在后台继续执行
- 不依赖特定组件的生命周期
- 支持长时间运行的生成任务

### 3. 任务管理
- 暂停/恢复生成任务
- 停止并清理任务
- 查看任务进度和状态
- 自动清理过期任务

### 4. 实时状态同步
- 多个组件可以同时监听同一任务
- 状态变化实时同步到所有相关组件
- 支持任务完成通知

## 架构设计

### 1. 核心组件

#### StreamingContext
全局状态管理上下文，负责：
- 管理所有活跃的流式生成任务
- 提供任务创建、控制和查询接口
- 处理任务生命周期管理

#### useGlobalStreamResponse Hook
增强版的流式响应处理Hook，提供：
- 创建全局流式任务
- 任务状态查询和控制
- 与本地组件状态的集成

#### GlobalTaskManager 组件
全局任务管理界面，显示：
- 所有活跃任务的列表
- 任务进度和状态
- 控制按钮（暂停/恢复/停止）

#### DraftResultComponent（增强版）
支持全局流式生成的结果显示组件：
- 可以连接到全局任务
- 显示全局任务的实时状态
- 提供任务控制界面

### 2. 数据流

```
用户操作 → useGlobalStreamResponse → StreamingContext → GlobalTaskManager
                                    ↓
                              DraftResultComponent
```

## 使用方法

### 1. 基础设置

首先，在应用根组件中包装 `StreamingProvider`：

```tsx
import { StreamingProvider } from './contexts/StreamingContext';
import { GlobalTaskManager } from './components/GlobalTaskManager';

function App() {
  return (
    <StreamingProvider>
      {/* 你的应用内容 */}
      <YourAppContent />
      
      {/* 全局任务管理器 */}
      <GlobalTaskManager />
    </StreamingProvider>
  );
}
```

### 2. 创建全局流式任务

在组件中使用 `useGlobalStreamResponse` Hook：

```tsx
import { useGlobalStreamResponse } from './hooks/useGlobalStreamResponse';

function MyComponent() {
  const { startGlobalStream } = useGlobalStreamResponse();
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleStartGeneration = async () => {
    // 获取流式响应（从API）
    const stream = await apiService.generateContent();
    
    // 创建全局任务
    const newTaskId = await startGlobalStream(stream, {
      title: "内容生成",
      taskType: "general_query",
      backgroundGeneration: true,
      resumeParams: {
        query: "生成内容",
        // 其他恢复生成所需的参数
      },
      onUpdate: (result) => {
        console.log("生成更新:", result);
      },
      onComplete: (result) => {
        console.log("生成完成:", result);
      },
      onError: (error) => {
        console.error("生成错误:", error);
      },
    });
    
    setTaskId(newTaskId);
  };

  return (
    <div>
      <button onClick={handleStartGeneration}>
        开始后台生成
      </button>
      
      {/* 如果有任务ID，显示结果组件 */}
      {taskId && (
        <DraftResultDisplay
          result={null}
          title="生成结果"
          enableGlobalStreaming={true}
          taskId={taskId}
        />
      )}
    </div>
  );
}
```

### 3. 显示全局任务结果

使用增强版的 `DraftResultDisplay` 组件：

```tsx
<DraftResultDisplay
  result={localResult}
  title="生成结果"
  enableGlobalStreaming={true}  // 启用全局流式生成
  taskId={globalTaskId}         // 全局任务ID
  onTaskCreated={(id) => {      // 任务创建回调
    setGlobalTaskId(id);
  }}
  headerActions={
    <div>
      {/* 自定义头部按钮 */}
    </div>
  }
/>
```

### 4. 任务控制

```tsx
import { useGlobalStreamResponse } from './hooks/useGlobalStreamResponse';

function TaskController({ taskId }: { taskId: string }) {
  const {
    pauseGlobalStream,
    resumeGlobalStream,
    stopGlobalStream,
    getTaskStatus,
  } = useGlobalStreamResponse();

  const task = getTaskStatus(taskId);

  return (
    <div>
      <p>任务状态: {task?.status}</p>
      
      {task?.status === 'streaming' && (
        <button onClick={() => pauseGlobalStream(taskId)}>
          暂停
        </button>
      )}
      
      {task?.status === 'paused' && (
        <button onClick={() => resumeGlobalStream(taskId)}>
          恢复
        </button>
      )}
      
      <button onClick={() => stopGlobalStream(taskId)}>
        停止
      </button>
    </div>
  );
}
```

## 任务类型

系统支持以下任务类型：

- `ps_draft`: PS初稿生成
- `cv_generation`: CV生成
- `rl_generation`: RL生成
- `general_query`: 通用查询

每种类型都有对应的图标和标签显示。

## 任务状态

- `pending`: 等待开始
- `streaming`: 正在生成
- `paused`: 已暂停
- `completed`: 已完成
- `error`: 发生错误

## 配置选项

### GlobalStreamOptions

```typescript
interface GlobalStreamOptions {
  onUpdate?: (result: DisplayResult) => void;
  onComplete?: (result: DisplayResult) => void;
  onError?: (error: Error) => void;
  backgroundGeneration?: boolean;  // 是否支持后台生成
  title?: string;                  // 任务标题
  taskType?: StreamingTask['type']; // 任务类型
  resumeParams?: {                 // 恢复生成所需参数
    query: string;
    files?: File[];
    assistantType?: string;
    [key: string]: any;
  };
}
```

## 最佳实践

### 1. 任务生命周期管理
- 及时清理已完成的任务
- 为长时间运行的任务设置合理的超时
- 处理网络中断和错误恢复

### 2. 用户体验
- 提供清晰的任务状态指示
- 支持任务暂停和恢复
- 在任务完成时通知用户

### 3. 性能优化
- 避免创建过多并发任务
- 合理设置任务清理间隔
- 监控内存使用情况

### 4. 错误处理
- 提供友好的错误提示
- 支持任务重试机制
- 记录详细的错误日志

## 故障排除

### 常见问题

1. **任务无法创建**
   - 检查是否正确包装了 `StreamingProvider`
   - 确认API返回的是有效的 `ReadableStream`

2. **任务状态不同步**
   - 检查组件是否正确使用了相同的 `taskId`
   - 确认没有多个 `StreamingProvider` 实例

3. **内存泄漏**
   - 确保及时清理已完成的任务
   - 检查是否有未释放的流读取器

### 调试技巧

1. 启用控制台日志查看任务状态变化
2. 使用 `GlobalTaskManager` 组件监控所有活跃任务
3. 检查网络请求确认流式响应正常

## 未来扩展

### 计划中的功能

1. **任务持久化**
   - 支持页面刷新后恢复任务
   - 本地存储任务状态

2. **任务队列**
   - 支持任务排队执行
   - 优先级管理

3. **进度估算**
   - 更准确的进度计算
   - 剩余时间估算

4. **任务分享**
   - 支持任务结果分享
   - 协作功能

## 总结

全局流式生成功能为EssayMaker应用提供了强大的后台处理能力，显著提升了用户体验。通过合理使用这些功能，可以创建更加流畅和用户友好的应用界面。 
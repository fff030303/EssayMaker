# Cotton Upto 助手

## 📋 项目概述

Cotton Upto 助手是一个现代化的内容生成工具，采用组件化架构设计，参考分稿助理的成功经验，提供高质量的内容分析和生成服务。

## 🏗️ 项目结构

```
cottonupto/
├── CottonUptoAssistantMain.tsx     # 主组件 - 总体协调和状态管理
├── CottonUptoFileUploadForm.tsx    # 文件上传表单组件
├── README.md                       # 项目说明文档
├── components/                     # 子组件目录
│   ├── QueryInputSection.tsx       # 查询输入区域组件
│   ├── PersonalizationSection.tsx  # 个性化需求组件
│   └── FileUploadSection.tsx       # 文件上传组件
├── hooks/                          # 自定义 Hook 目录
│   └── useCottonUptoLogger.ts      # 日志记录 Hook
├── utils/                          # 工具函数目录
│   └── helpers.ts                  # 通用工具函数
└── constants/                      # 常量配置目录
    └── index.ts                    # 配置常量
```

## 🎯 核心功能

### 1. 内容输入支持
- **文件上传**: 支持多种格式文档（PDF、Word、TXT 等）
- **文本粘贴**: 直接粘贴内容进行分析
- **个性化定制**: 支持风格偏好和特殊要求设置

### 2. 智能分析
- **内容理解**: AI 深度分析用户需求
- **实时流式处理**: 提供即时反馈和进度显示
- **多步骤展示**: 清晰展示分析和生成过程

### 3. 用户体验
- **响应式设计**: 适配各种设备屏幕
- **拖拽上传**: 便捷的文件上传体验
- **折叠界面**: 节省空间的交互设计

## 🔧 技术特性

### 组件化架构
- **模块化设计**: 每个功能独立封装为组件
- **状态管理**: 统一的状态流转和数据传递
- **可复用性**: 组件设计遵循可复用原则

### 现代化技术栈
- **React 18+**: 使用最新的 React 特性
- **TypeScript**: 类型安全的开发体验
- **Tailwind CSS**: 现代化的样式系统
- **Lucide Icons**: 清晰的图标系统

### 异步处理
- **流式响应**: 实时显示生成过程
- **错误处理**: 完善的异常处理机制
- **性能监控**: 记录和分析性能数据

## 🚀 使用方法

### 基本使用

```tsx
import { CottonUptoAssistantMain } from './components/cottonupto/CottonUptoAssistantMain';

function App() {
  return (
    <CottonUptoAssistantMain
      onStepChange={(step) => console.log('步骤变化:', step)}
      setResult={(result) => console.log('结果更新:', result)}
    />
  );
}
```

### 高级配置

```tsx
import { CottonUptoAssistantMain } from './components/cottonupto/CottonUptoAssistantMain';

function App() {
  const handleDataSave = (file, content, doc) => {
    // 处理数据保存逻辑
    console.log('保存数据:', { file, content, doc });
  };

  return (
    <CottonUptoAssistantMain
      onStepChange={(step) => console.log('步骤变化:', step)}
      setResult={(result) => console.log('结果更新:', result)}
      onDataSave={handleDataSave}
      onClearAll={() => console.log('清空所有内容')}
    />
  );
}
```

## 📝 组件说明

### CottonUptoAssistantMain
主组件，负责整体状态管理和组件协调。

**主要功能:**
- 状态管理和数据流转
- 组件间通信协调
- 错误处理和用户反馈
- 滚动控制和UI交互

### CottonUptoFileUploadForm
文件上传表单组件，处理用户输入和文件上传。

**主要功能:**
- 用户需求文本输入
- 文件上传和预览
- 表单验证和提交
- 加载状态管理

### 子组件
- **QueryInputSection**: 查询输入区域
- **PersonalizationSection**: 个性化需求设置
- **FileUploadSection**: 文件上传功能

## 🛠️ 开发指南

### 添加新功能
1. 在 `components/` 目录下创建新组件
2. 在 `hooks/` 目录下添加相关 Hook
3. 更新 `constants/` 中的配置项
4. 在主组件中集成新功能

### 样式定制
使用 Tailwind CSS 类名进行样式定制，主题色彩为翠绿色系（emerald/teal）。

### 错误处理
所有错误都通过 `useCottonUptoLogger` Hook 进行记录和处理。

## 📊 性能优化

- **懒加载**: 组件按需加载
- **防抖处理**: 用户输入防抖优化
- **内存管理**: 及时清理无用数据
- **流式处理**: 大文件分块处理

## 🔍 调试信息

开发模式下，在浏览器控制台中可以查看详细的调试信息：
- 组件状态变化
- API 请求响应
- 错误日志记录
- 性能监控数据

## 📈 未来扩展

- 支持更多文件格式
- 增加内容模板功能
- 集成更多AI模型
- 添加批量处理功能
- 优化移动端体验

## 🤝 贡献指南

1. 遵循现有代码风格
2. 编写清晰的注释文档
3. 确保类型安全
4. 添加必要的测试用例 
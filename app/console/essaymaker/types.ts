// 应用程序的核心数据类型定义

export interface DisplayResult {
  content: string;
  timestamp: string;
  steps: string[];
  currentStep?: string;
  isComplete: boolean;
  _isStepContent?: boolean;
  // 添加成绩单解析结果字段
  transcriptAnalysis?: string;
  stream?: ReadableStream<Uint8Array>; // 添加stream属性
  // 🆕 添加写作需求字段，用于推荐信助理
  writingRequirements?: string;
  isError?: boolean;
  errorMessage?: string;
  // 新增字段用于步骤内容管理
  _stepContents?: Record<string, string>;
  _originalContent?: string;
  _selectedStepId?: string;
  _stepTitle?: string;
}

// 定义Agent类型枚举
export enum AgentType {
  UNKNOWN = "unknown",
  COURSE_INFO = "course_info",
  UNIVERSITY_RESEARCH = "university_research",
  APPLICATION_ADVISOR = "application_advisor",
  RESEARCH = "research",
  PROFESSOR_SEARCH = "professor_search",
}

// 添加Example接口定义
export interface Example {
  title: string;
  content: string;
  type?: AgentType;
}

// 添加StepContentResult接口定义
export interface StepContentResult {
  content: string;
  isComplete: boolean;
  timestamp: string;
  steps?: string[];
  currentStep?: string;
  // 添加缺失的属性
  type?: string; // 步骤类型: "search" | "web" | "generation" | "analysis" | "system" | "tool" | "default"
  title?: string; // 步骤标题
  details?: string; // 详细内容
}

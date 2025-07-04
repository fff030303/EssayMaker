// 定义应用中使用的类型：

// - WorkflowExecution：API响应类型
// - DisplayResult：UI展示用的结果类型
// - StepContentResult：步骤内容解析结果类型
// - AgentType：代理类型枚举（决定处理流程）
// - Example：示例项目类型

// 定义API响应类型
export interface WorkflowExecution {
  result: string;
  steps: string[];
  timestamp: string;
}

// UI展示用的结果类型
export interface DisplayResult {
  content: string;
  timestamp: string;
  steps: string[];
  currentStep?: string;
  isComplete?: boolean;
  simplifiedContent?: string;
  transcriptAnalysis?: string;
  _isStepContent?: boolean; // 内部标记，指示此内容是步骤点击的结果而非主要内容
  // 添加错误状态字段
  isError?: boolean;
  errorMessage?: string;
  // 🆕 添加写作需求字段，用于推荐信助理
  writingRequirements?: string;
  // 🆕 添加步骤内容映射，用于保存每个步骤的具体内容
  _stepContents?: Record<string, string>;
  // 🔧 新增：步骤管理相关字段
  _originalContent?: string; // 保存原始完整内容
  _selectedStepId?: string; // 当前选择的步骤ID
  _stepTitle?: string; // 步骤标题
  step?: string; // 当前步骤标识
  summary?: string; // 内容摘要
  isCompleted?: boolean; // 是否完成标记
}

export interface QueryResponse {
  workflow_execution: WorkflowExecution;
}

export interface APIError {
  error: string;
  message: string;
  status: number;
}

// 步骤内容解析结果类型
export interface StepContentResult {
  type: string;
  title: string;
  content?: string;
  details?: string;
}

// Agent类型枚举
export enum AgentType {
  COURSE_INFO = "course_info_compile_expert",
  UNIVERSITY_RESEARCH = "university_research_coordinator",
  APPLICATION_ADVISOR = "application_advisor",
  RESEARCH = "research_expert",
  UNKNOWN = "unknown",
  PROFESSOR_SEARCH = "professor_search", // 新增的教授搜索类型
}

// 示例项目类型
export interface Example {
  title: string;
  content: string;
  type?: AgentType;
}

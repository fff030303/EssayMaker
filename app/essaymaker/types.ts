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
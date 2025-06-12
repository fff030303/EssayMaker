/**
 * StepResultDisplay 类型定义模块
 *
 * 包含：
 * - 组件 Props 接口
 * - 内容类型定义
 * - 策略生成相关类型
 * - 其他辅助类型
 */

import { DisplayResult } from "@/app/console/essaymaker/types";

/**
 * 主组件 Props 接口
 */
export interface StepResultDisplayProps {
  result: DisplayResult | null;
  title?: string;
  onGenerateStrategy?: (strategyResult: DisplayResult) => void;
  originalEssayFile?: File | null;
  searchResult?: string;
  onStepChange?: (step: number) => void;
  personalizationRequirements?: string;
  onShowFullContent?: () => void;
}

/**
 * 内容渲染器 Props 接口
 */
export interface ContentRendererProps {
  content: string;
}

/**
 * 策略操作组件 Props 接口
 */
export interface StrategyActionsProps {
  displayData: DisplayResult | null;
  customPrompt?: string;
  isGenerating?: boolean;
  onGenerateStrategy?: () => void;
  onShowPromptSettings?: () => void;
}

/**
 * 提示词设置组件 Props 接口
 */
export interface PromptSettingsProps {
  customRole: string;
  customTask: string;
  customOutputFormat: string;
  isGenerating?: boolean;
  onRoleChange: (value: string) => void;
  onTaskChange: (value: string) => void;
  onOutputFormatChange: (value: string) => void;
  onReset: () => void;
}

/**
 * 内容类型枚举
 */
export type ContentType = "html" | "markdown";

/**
 * 内容检测结果接口
 */
export interface ContentDetectionResult {
  type: ContentType;
  confidence: number;
  reasons: string[];
}

/**
 * 内容处理配置接口
 */
export interface ContentProcessingConfig {
  sanitizeHtml?: boolean;
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  preserveLineBreaks?: boolean;
}

/**
 * 策略生成配置接口
 */
export interface StrategyGenerationConfig {
  customPrompt?: string;
  includeContext?: boolean;
  maxLength?: number;
  temperature?: number;
}

/**
 * 错误处理接口
 */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

/**
 * 组件状态接口
 */
export interface ComponentState {
  isLoading: boolean;
  error: ErrorInfo | null;
  lastUpdated: Date | null;
}

/**
 * 导出所有需要的类型
 */
export type { DisplayResult };

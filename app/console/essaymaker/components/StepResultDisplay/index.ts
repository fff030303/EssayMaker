/**
 * StepResultDisplay 组件模块导出
 *
 * 重构自原 ResultDisplay 组件
 * 提供模块化的结果显示功能
 */

// 导出主组件
export { default as StepResultDisplay } from "./StepResultDisplay";
export { StepResultDisplay as StepResultDisplayComponent } from "./StepResultDisplay";

// 导出子组件
export { ContentRenderer } from "./components/ContentRenderer";
export { StrategyActions } from "./components/StrategyActions";
export { PromptSettings } from "./components/PromptSettings";

// 导出工具函数
export {
  detectContentType,
  extractMarkdownFromHtml,
  processMarkdownLineBreaks,
  sanitizeHtml,
} from "./utils/contentProcessing";

export {
  generateRewriteStrategy,
  validateStrategyGenerationParams,
  createDefaultStrategyHandler,
} from "./utils/strategyGenerator";

// 导出类型
export type {
  StepResultDisplayProps,
  ContentRendererProps,
  StrategyActionsProps,
  PromptSettingsProps,
  ContentType,
  DisplayResult,
} from "./types";

// 导出样式
export { globalContentStyles } from "./styles/contentStyles";

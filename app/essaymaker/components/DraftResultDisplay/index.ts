/**
 * DraftResultDisplay 模块导出文件
 * 
 * 功能：统一导出DraftResultDisplay模块的所有组件和类型
 * 
 * 导出内容：
 * - DraftResultComponent：主要的结果显示组件
 * - DraftResultDisplayProps：组件属性类型定义
 * - MarkdownComponents：Markdown渲染组件
 * - 工具函数和样式定义
 * 
 * 模块化设计：
 * - 清晰的组件分离
 * - 统一的导入入口
 * - 类型安全保证
 * - 便于维护和扩展
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

// 索引文件 - 统一导出所有模块

export { DraftResultDisplay } from "./DraftResultComponent";
export { scrollbarStyles } from "./styles";
export {
  detectContentType,
  extractMarkdownFromHtml,
  processMarkdownLineBreaks,
  sanitizeHtml,
} from "./utils";
export { markdownComponents } from "./MarkdownComponents";
export type { DraftResultDisplayProps, ContentType } from "./types";

/**
 * DraftResultDisplay 模块导出文件
 * 
 * 功能：统一导出DraftResultDisplay相关组件和类型
 * 
 * 导出内容：
 * - DraftResultDisplay：主要的结果显示组件
 * - DraftResultDisplayProps：组件属性类型定义
 * 
 * 模块化设计：
 * - 将复杂组件拆分到独立目录
 * - 提供统一的导入入口
 * - 保持向后兼容性
 * - 简化外部引用
 * 
 * 使用方式：
 * ```typescript
 * import { DraftResultDisplay } from "./DraftResultDisplay";
 * import type { DraftResultDisplayProps } from "./DraftResultDisplay";
 * ```
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

// 重定向文件 - 从模块化结构中导入并重新导出
export { DraftResultDisplay } from "./DraftResultDisplay/DraftResultComponent";
export type { DraftResultDisplayProps } from "./DraftResultDisplay/types";

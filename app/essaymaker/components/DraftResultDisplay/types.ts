/**
 * DraftResultDisplay 类型定义文件
 * 
 * 功能：定义初稿结果显示组件相关的TypeScript类型
 * 
 * 类型定义：
 * - DraftResultDisplayProps：主组件属性接口
 * - 支持流式生成和实时显示
 * - 兼容多种内容格式
 * 
 * 特性：
 * - 严格的类型检查
 * - 完整的属性定义
 * - 可选属性支持
 * - 扩展性设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

import { DisplayResult } from "../../types";

export interface DraftResultDisplayProps {
  result: DisplayResult | null;
  title?: string;
  headerActions?: React.ReactNode;
}

export type ContentType = "html" | "markdown";

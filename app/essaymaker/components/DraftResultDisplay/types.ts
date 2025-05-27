// 类型定义文件 - 从 DraftResultDisplay.tsx 中提取的类型定义

import { DisplayResult } from "../../types";

export interface DraftResultDisplayProps {
  result: DisplayResult | null;
  title?: string;
  headerActions?: React.ReactNode;
}

export type ContentType = "html" | "markdown";

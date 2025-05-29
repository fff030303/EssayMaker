/**
 * 没用哈，别看了
 * 
 * ExampleList 组件
 * 
 * 功能：展示预设的查询示例列表，支持两种显示模式
 * 
 * 显示模式：
 * 1. Popover模式（inPopover=true）：
 *    - 垂直列表布局，适合在弹出框中显示
 *    - 紧凑的按钮样式，带有图标和标题
 *    - 灰色背景，提供视觉分组
 * 
 * 2. 页面模式（inPopover=false）：
 *    - 水平排列的圆形按钮
 *    - 更大的按钮尺寸，适合页面直接展示
 *    - 阴影效果，提供更好的视觉层次
 * 
 * 特性：
 * - 智能图标分配（根据示例类型自动选择图标）
 * - 响应式设计，支持不同屏幕尺寸
 * - 悬停效果和过渡动画
 * - 点击回调，支持将示例内容传递给父组件
 * 
 * 图标映射：
 * - 课程相关：BookOpen
 * - 学校/机构：Building  
 * - 个人/教授：User
 * - 搜索/通用：Search
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import { Button } from "@/components/ui/button";
import { Example } from "../types";
import { BookOpen, Building, User, Search } from "lucide-react";

interface ExampleListProps {
  examples: Example[];
  onExampleClick: (content: string, index: number) => void;
  inPopover?: boolean; // 添加一个参数来区分是否在Popover中显示
}

export function ExampleList({
  examples,
  onExampleClick,
  inPopover = true,
}: ExampleListProps) {
  // 为每个示例分配图标
  const getIconForExample = (index: number) => {
    switch (index) {
      case 0: // 课程详细信息
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 1: // 学校与专业综合分析
        return <Building className="h-4 w-4 mr-2" />;
      case 2: // 个人背景申请规划
        return <User className="h-4 w-4 mr-2" />;
      case 3: // 通用研究主题
        return <Search className="h-4 w-4 mr-2" />;
      case 4: // 博士项目查询
        return <BookOpen className="h-4 w-4 mr-2" />;
      case 5: // 教授查询
        return <User className="h-4 w-4 mr-2" />;
      case 6: // 特定教授详情
        return <User className="h-4 w-4 mr-2" />;
      default:
        return <Search className="h-4 w-4 mr-2" />;
    }
  };

  // 根据是否在Popover中显示使用不同的样式
  if (inPopover) {
    return (
      <div className="w-full bg-gray-50 p-3 rounded-lg"> {/* 修改这里：添加背景色、内边距和圆角 */}
        <h3 className="text-sm font-medium mb-2">快捷选择</h3>
        <div className="flex flex-col gap-1">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              className="flex items-center justify-start px-3 py-2 h-auto text-left hover:bg-gray-200 transition-colors duration-200"
              onClick={() => onExampleClick(example.content, index)}
            >
              {getIconForExample(index)}
              <span className="truncate">{example.title}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // 原始布局，用于非Popover场景
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {examples.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            className="flex items-center whitespace-nowrap px-6 py-3 rounded-full bg-gray-50 border border-gray-300 hover:bg-gray-100 shadow-md hover:shadow-lg transition-all"
            onClick={() => onExampleClick(example.content, index)}
          >
            {getIconForExample(index)}
            <span>{example.title}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

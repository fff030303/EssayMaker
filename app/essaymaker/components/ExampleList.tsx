// 这个组件展示预设的查询示例，有两种显示模式：

// - 在弹出框(Popover)中显示：垂直列表布局
// - 在页面中直接显示：水平排列的圆形按钮
// - 每个示例都有对应的图标（如书本、建筑、用户等）
// - 点击示例会触发回调函数，将示例内容传递给父组件


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

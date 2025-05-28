/**
 * TipsButton 组件
 * 
 * 功能：提供帮助提示按钮，显示使用指南和建议
 * 
 * 核心特性：
 * 1. 交互式提示：
 *    - 悬浮显示提示内容
 *    - 点击切换显示状态
 *    - 自动定位和对齐
 * 
 * 2. 内容管理：
 *    - 支持多种提示类型
 *    - 动态内容加载
 *    - 格式化文本显示
 * 
 * 3. 视觉设计：
 *    - 统一的图标样式
 *    - 平滑的动画效果
 *    - 响应式布局适配
 * 
 * 4. 用户体验：
 *    - 直观的交互反馈
 *    - 易于理解的提示信息
 *    - 不干扰主要操作流程
 * 
 * 使用场景：
 * - 功能说明和指导
 * - 操作建议和最佳实践
 * - 常见问题解答
 * - 快捷键和技巧提示
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

interface TipsButtonProps {
  onSelect: (text: string) => void;
  className?: string;
}

export function TipsButton({ onSelect, className }: TipsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tips = [
    {
      title: "弃用部分素材",
      content:
        "弃用个人陈述素材整理报告中XX部分素材，直接搜索相关信息（如时事新闻）进行补充，注意进行深入分析和阐述",
    },
    {
      title: "增加部分细节",
      content:
        "要求在第二段学术基础展示中添加上传成绩单中的XX课程，深入展开与申请方向相关的阐述；补充科研/实习/职业规划经历的细节",
    },
    {
      title: "保证内容真实",
      content: "禁止添加素材表中不存在的数据/操作步骤",
    },
    {
      title: "其他写作需求",
      content: "请选用XX经历作为第三段研究经历深化/第四段实习经历深化的素材",
    },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn(className)}>
          需求模板
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-2">
          <h4 className="font-medium">快捷写作需求填写：</h4>
          <div className="space-y-1">
            {tips.map((tip, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => {
                  onSelect(tip.content);
                  setIsOpen(false);
                }}
              >
                {tip.title}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

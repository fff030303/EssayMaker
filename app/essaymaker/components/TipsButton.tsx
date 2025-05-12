import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TipsButtonProps {
  onSelect: (text: string) => void;
  className?: string;
}

export function TipsButton({ onSelect, className }: TipsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tips = [
    {
      title: "弃用部分素材",
      content: "弃用个人陈述素材整理报告中XX部分素材，直接搜索相关信息（如时事新闻）进行补充，注意进行深入分析和阐述"
    },
    {
      title: "增加部分细节",
      content: "要求在第二段学术基础展示中添加上传成绩单中的XX课程，深入展开与申请方向相关的阐述；补充科研/实习/职业规划经历的细节"
    },
    {
      title: "保证内容真实",
      content: "禁止添加素材表中不存在的数据/操作步骤"
    },
    {
      title: "其他写作需求",
      content: "请选用XX经历作为第三段研究经历深化/第四段实习经历深化的素材"
    }
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("text-xs text-gray-500 hover:text-gray-700", className)}
        >
          需求模板
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <div className="text-sm font-medium text-gray-700 mb-2">快捷写作需求填写：</div>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <button
                key={index}
                className="w-full text-left p-2 hover:bg-gray-100 rounded-md transition-colors"
                onClick={() => {
                  onSelect(tip.content);
                  setIsOpen(false);
                }}
              >
                <div className="text-sm font-medium text-gray-700">{tip.title}</div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 
import { cn } from "@/lib/utils";

interface AssistantTipsProps {
  type: "draft" | "cv" | "ps" | "custom";
  content?: string;
}

export function AssistantTips({ type, content }: AssistantTipsProps) {
  const tips = {
    draft: [
      "AI存在幻觉，请务必仔细阅读和辨别创作的内容",
      "此工具仅用于PS初稿写作，如需添加具体院校及专业信息，请使用PS分稿写作助理",
      "请不要使用此工具执行<u>限制字数</u>的写作任务及<u>英文翻译</u>任务",
    ],
    cv: [
      
    ],
    ps: [
      
    ],
    custom: [
      
    ]
  };

  let tipsToShow = content ? [content] : tips[type];
  
  if (!tipsToShow || tipsToShow.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="input-gradient-border rounded-3xl">
        <div className="w-full h-full bg-white rounded-[calc(1.5rem-3px)] p-4">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium text-gray-700 mb-2">使用说明：</div>
            {tipsToShow.map((tip, index) => (
              <div key={`tip-${index}`} className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">{index + 1}.</span>
                <span dangerouslySetInnerHTML={{ __html: tip }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
import { cn } from "@/lib/utils";

interface AssistantTipsProps {
  type: "draft" | "cv" | "ps" | "custom";
}

export function AssistantTips({ type }: AssistantTipsProps) {
  const tips = {
    draft: [
      "AI存在幻觉，请务必仔细阅读和辨别创作的内容",
      "此工具仅用于PS初稿写作，如需添加具体院校及专业信息，请使用PS分稿写作助理",
      "请不要使用此工具执行限制字数的写作任务及英文翻译任务（限制字数及英文翻译这两个词加下划线）"
    ],
    cv: [
      "AI存在幻觉，请务必仔细阅读和辨别创作的内容",
      "此工具仅用于简历优化，请确保上传的简历格式正确",
      "建议同时上传相关证明材料，以获得更准确的优化建议"
    ],
    ps: [
      "AI存在幻觉，请务必仔细阅读和辨别创作的内容",
      "此工具用于PS分稿写作，请确保提供准确的院校和专业信息",
      "建议同时上传成绩单等辅助材料，以获得更个性化的建议"
    ],
    custom: [
      "AI存在幻觉，请务必仔细阅读和辨别创作的内容",
      "请确保提供清晰的问题描述，以获得更准确的回答",
      "如需上传文件，请确保文件格式正确且内容相关"
    ]
  };

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="input-gradient-border rounded-3xl">
        <div className="w-full h-full bg-white rounded-[calc(1.5rem-3px)] p-4">
          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium text-gray-700 mb-2">使用说明：</div>
            {tips[type].map((tip, index) => (
              <div key={`tip-${index}`} className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">{index + 1}.</span>
                <span>
                  {tip.split("（").map((part, i, arr) => {
                    if (i === arr.length - 1 && part.includes("）")) {
                      const [text, underline] = part.split("）");
                      return (
                        <span key={`part-${index}-${i}`}>
                          {text}
                          <span className="underline">{underline}</span>
                          ）
                        </span>
                      );
                    }
                    return <span key={`part-${index}-${i}`}>{part}</span>;
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 
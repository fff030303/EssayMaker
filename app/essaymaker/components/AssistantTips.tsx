import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AssistantTipsProps {
  type: "draft" | "cv" | "ps" | "custom";
}

export function AssistantTips({ type }: AssistantTipsProps) {
  const tips = {
    draft: [
      "AI存在幻觉，请仔细辨别创作内容",
      "此工具仅用于PS初稿写作",
      "不适用于限制字数/英文翻译任务",
    ],
    cv: [
      "AI存在幻觉，请仔细辨别创作内容",
      "此工具仅用于简历优化",
      "建议上传证明材料以获得更准确建议",
    ],
    ps: [
      "AI存在幻觉，请仔细辨别创作内容",
      "此工具用于PS分稿写作",
      "建议上传辅助材料以获得个性化建议",
    ],
    custom: [
      "AI存在幻觉，请仔细辨别创作内容",
      "提供清晰的问题描述以获得准确回答",
      "上传文件需确保格式正确且内容相关",
    ],
  };

  return (
    <div className="w-full max-w-[800px] mx-auto my-2">
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
        <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
          {tips[type].map((tip, index) => (
            <div key={`tip-${index}`} className="flex items-center gap-1">
              <span className="text-blue-500 font-medium">{index + 1}.</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

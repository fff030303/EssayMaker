import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assistantTips } from "../config/tips";

interface AssistantTipsProps {
  type: "draft" | "cv" | "ps" | "custom";
}

export function AssistantTips({ type }: AssistantTipsProps) {
  // 使用外部配置中的提示信息
  const tips = assistantTips;
  
  // 如果当前类型的提示数组为空，则不渲染任何内容
  if (!tips[type] || tips[type].length === 0) {
    return null;
  }

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

import { Search, Globe, Brain, PenTool, Circle } from "lucide-react";

// 获取步骤图标
export function getStepIcon(type: string) {
  switch (type) {
    case "search":
      return <Search className="h-4 w-4 text-blue-500" />;
    case "web":
      return <Globe className="h-4 w-4 text-green-500" />;
    case "analysis":
      return <Brain className="h-4 w-4 text-purple-500" />;
    case "generation":
      return <PenTool className="h-4 w-4 text-orange-500" />;
    case "default":
    default:
      return <Circle className="h-4 w-4 text-gray-500" />;
  }
}

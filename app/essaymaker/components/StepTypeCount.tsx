"use client";

import { parseStepContent } from "../utils/helpers";

// 步骤类型计数组件
interface StepTypeCountProps {
  steps: string[];
  type: string;
  icon: React.ReactNode;
  label: string;
}

export function StepTypeCount({ steps, type, icon, label }: StepTypeCountProps) {
  const count = steps.filter((step) => {
    try {
      const stepData = parseStepContent(step);
      return stepData.type === type;
    } catch (error) {
      console.error("Error parsing step content:", error);
      return false;
    }
  }).length;

  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-xs text-muted-foreground">
        {label}: {count}
      </span>
    </div>
  );
} 
"use client";

import { Textarea } from "@/components/ui/textarea";

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ContentEditor({ value, onChange }: ContentEditorProps) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="请输入内容..."
      className="min-h-[300px]"
    />
  );
}

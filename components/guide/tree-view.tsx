import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chapter } from "@/types/guide";

interface TreeViewProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelect: (chapter: Chapter) => void;
  onAdd: (level: number, parentId: string | null) => void;
}

export function TreeView({
  chapters,
  selectedChapter,
  onSelect,
  onAdd,
}: TreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem("guide-tree-expanded");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(
      "guide-tree-expanded",
      JSON.stringify(Array.from(expandedIds))
    );
  }, [expandedIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderChapter = (chapter: Chapter, depth: number = 0) => {
    const isExpanded = expandedIds.has(chapter.id);
    const hasChildren = chapter.children && chapter.children.length > 0;
    const isSelected = selectedChapter?.id === chapter.id;
    const indentLevel = chapter.level === 1 ? 0 : chapter.level === 2 ? 1 : 2;

    return (
      <div key={chapter.id} className="relative">
        <div
          className={cn(
            "group flex items-center gap-2 py-1.5",
            "hover:bg-accent/50 rounded-sm cursor-pointer",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: `${indentLevel * 1.5}rem` }}
          onClick={() => {
            onSelect(chapter);
            if (hasChildren) {
              toggleExpand(chapter.id);
            }
          }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {hasChildren ? (
              <div className="h-5 w-5 p-0.5 flex items-center justify-center">
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform text-muted-foreground",
                    isExpanded && "rotate-90"
                  )}
                />
              </div>
            ) : (
              <div className="w-5" />
            )}
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1 rounded-md flex-1 min-w-0"
              )}
            >
              {chapter.level === 1 && chapter.emoji && (
                <span className="flex-none text-muted-foreground">
                  {chapter.emoji}
                </span>
              )}
              <span className="truncate">{chapter.title}</span>
            </div>
          </div>

          {chapter.level < 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(chapter.level + 1, chapter.id);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                添加{chapter.level === 1 ? "子节" : "内容"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="relative">
            {chapter.children?.map((child) => renderChapter(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2 px-4">
      {chapters.map((chapter) => renderChapter(chapter))}
      {chapters.length === 0 && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={() => onAdd(1, null)}>
            <Plus className="h-4 w-4 mr-2" />
            添加章节
          </Button>
        </div>
      )}
    </div>
  );
}

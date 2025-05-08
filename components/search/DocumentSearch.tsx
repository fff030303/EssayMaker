"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Chapter } from "@/types/guide";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  chapterId: string;
  sectionIndex: number;
  subsectionIndex: number;
  chapterTitle: string;
  sectionTitle: string;
  subsectionTitle: string;
  contentSnippet: string;
  category: string;
}

interface DocumentSearchProps {
  chapters: Chapter[];
  onResultClick: (result: SearchResult) => void;
  guideCategory: string;
}

// 简单的防抖函数
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function DocumentSearch({
  chapters,
  onResultClick,
  guideCategory,
}: DocumentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 模拟搜索API函数
  const searchDocuments = async (
    query: string,
    category: string,
    pageParam = 0,
    pageSize = 10
  ): Promise<{
    results: SearchResult[];
    nextPage: number | null;
  }> => {
    // 如果没有查询词，返回空结果
    if (!query.trim()) {
      return { results: [], nextPage: null };
    }

    // 创建搜索结果数组
    const allResults: SearchResult[] = [];

    // 遍历所有章节、部分和子部分
    chapters.forEach((chapter) => {
      // 如果指定了分类且不匹配，则跳过
      if (category !== "general" && chapter.guideCategory !== category) {
        return;
      }

      const sections =
        chapter.children?.filter((child) => child.level === 2) || [];

      sections.forEach((section, sectionIndex) => {
        const subsections =
          section.children?.filter((child) => child.level === 3) || [];

        subsections.forEach((subsection, subsectionIndex) => {
          const content = subsection.content?.content || "";

          // 检查标题和内容是否包含搜索词
          const titleMatch = subsection.title
            .toLowerCase()
            .includes(query.toLowerCase());
          const contentMatch = content
            .toLowerCase()
            .includes(query.toLowerCase());

          if (titleMatch || contentMatch) {
            // 提取内容片段（包含搜索词的上下文）
            let contentSnippet = "";
            if (contentMatch) {
              const index = content.toLowerCase().indexOf(query.toLowerCase());
              const start = Math.max(0, index - 50);
              const end = Math.min(content.length, index + query.length + 50);
              contentSnippet =
                (start > 0 ? "..." : "") +
                content.substring(start, end) +
                (end < content.length ? "..." : "");
            }

            allResults.push({
              id: `${chapter.id}-${sectionIndex}-${subsectionIndex}`,
              chapterId: chapter.id,
              sectionIndex,
              subsectionIndex,
              chapterTitle: chapter.title,
              sectionTitle: section.title,
              subsectionTitle: subsection.title,
              contentSnippet,
              category: chapter.guideCategory || "general",
            });
          }
        });
      });
    });

    // 按相关性排序（这里简单实现，可以根据需要优化）
    allResults.sort((a, b) => {
      const aTitle = a.subsectionTitle.toLowerCase();
      const bTitle = b.subsectionTitle.toLowerCase();
      const aHasTitle = aTitle.includes(query.toLowerCase());
      const bHasTitle = bTitle.includes(query.toLowerCase());

      if (aHasTitle && !bHasTitle) return -1;
      if (!aHasTitle && bHasTitle) return 1;
      return 0;
    });

    // 分页
    const start = pageParam * pageSize;
    const end = start + pageSize;
    const paginatedResults = allResults.slice(start, end);

    // 确定是否有下一页
    const nextPage = end < allResults.length ? pageParam + 1 : null;

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      results: paginatedResults,
      nextPage,
    };
  };

  // 使用TanStack Query的无限查询
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["documentSearch", debouncedSearchQuery, guideCategory],
    queryFn: ({ pageParam }) =>
      searchDocuments(debouncedSearchQuery, guideCategory, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: debouncedSearchQuery.length > 1,
  });

  // 搜索快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsDialogOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 处理滚动加载更多
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || !isDialogOpen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isDialogOpen]);

  // 当对话框打开时，聚焦搜索输入框
  useEffect(() => {
    if (isDialogOpen && dialogInputRef.current) {
      setTimeout(() => {
        dialogInputRef.current?.focus();
      }, 100);
    }
  }, [isDialogOpen]);

  // 高亮文本中的搜索词
  function highlightText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span
              key={index}
              className="bg-yellow-200 text-black px-0.5 rounded"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  }

  // 处理搜索结果点击
  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    setIsDialogOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* 搜索按钮 */}
      <div className="relative w-full">
        <Button
          variant="outline"
          className="w-full justify-start text-sm text-muted-foreground"
          onClick={() => setIsDialogOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>搜索指南内容... (Ctrl+K)</span>
        </Button>
      </div>

      {/* 搜索对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>搜索指南内容</DialogTitle>
          </DialogHeader>

          {/* 搜索输入框 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={dialogInputRef}
              type="text"
              placeholder="输入关键词搜索..."
              className="w-full bg-background py-2 pl-10 pr-4 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 搜索结果区域 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">搜索中...</p>
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-sm text-destructive">搜索出错，请重试</p>
              </div>
            ) : !debouncedSearchQuery || debouncedSearchQuery.length <= 1 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  请输入至少2个字符进行搜索
                </p>
              </div>
            ) : data?.pages[0].results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">未找到匹配结果</p>
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground px-4 py-2 border-b">
                  搜索结果
                </div>
                <div className="divide-y">
                  {data?.pages.map((page, pageIndex) => (
                    <React.Fragment key={pageIndex}>
                      {page.results.map((result) => (
                        <div
                          key={result.id}
                          className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-none mt-0.5">
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="text-base font-medium">
                                {highlightText(
                                  result.subsectionTitle,
                                  debouncedSearchQuery
                                )}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {result.chapterTitle} &gt; {result.sectionTitle}
                              </p>
                              {result.contentSnippet && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                  {highlightText(
                                    result.contentSnippet,
                                    debouncedSearchQuery
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>

                {/* 加载更多指示器 */}
                {hasNextPage && (
                  <div ref={loadMoreRef} className="p-4 text-center">
                    {isFetchingNextPage ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        滚动加载更多
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

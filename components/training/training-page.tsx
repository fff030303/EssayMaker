"use client";

import { TrainingMap } from "@/components/training/training-map";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Layout, LayoutTemplate, Settings } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DateRange } from "react-day-picker";
import { logger } from "@/lib/logger";
import { useTrainings, getTrainings } from "@/hooks/use-trainings";
import { useQueryClient } from "@tanstack/react-query";
import { TrainingNode, TrainingLink } from "@/types/training";
import { useTrainingFiltersStore } from "@/app/console/training/hooks/use-training-filters-store";
import {
  FilterBar,
  FilterPanel,
} from "@/app/console/training/components/training-filters";
import React from "react";

interface TrainingPageProps {
  title: string;
  role: string;
  className?: string;
  levelNames: readonly string[];
  showBookmarked?: boolean;
  headerControls?: React.ReactNode;
}

// 拆分头部组件
const TrainingPageHeader = React.memo(
  ({
    title,
    layout,
    handleLayoutChange,
    canManage,
    headerControls,
  }: {
    title: string;
    layout: "horizontal" | "vertical";
    handleLayoutChange: (layout: "horizontal" | "vertical") => void;
    canManage: boolean;
    headerControls?: React.ReactNode;
  }) => {
    return (
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">{title}</h1>
          {headerControls}
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <Link href="/console/training/manage">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                管理
              </Button>
            </Link>
          )}
          <div className="flex">
            <Button
              variant={layout === "horizontal" ? "default" : "outline"}
              onClick={() => handleLayoutChange("horizontal")}
              size="icon"
              className="h-8 w-8 rounded-r-none"
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === "vertical" ? "default" : "outline"}
              onClick={() => handleLayoutChange("vertical")}
              size="icon"
              className="h-8 w-8 rounded-l-none border-l-0"
            >
              <Layout className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

// 拆分内容组件
const TrainingContent = React.memo(
  ({
    options,
    layout,
    levelNames,
    session,
  }: {
    options: any;
    layout: "horizontal" | "vertical";
    levelNames: readonly string[];
    session: any;
  }) => {
    const observerTarget = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // 组件挂载时添加淡入效果
    useEffect(() => {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }, [options]); // 依赖筛选选项，使其变化时重置动画

    // 使用 useTrainings hook 获取数据，保留无限滚动功能
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
      useTrainings({
        role: options.role,
        limit: 10,
        bookmarked: options.bookmarked,
        // 添加筛选条件
        serverSideFilter: true,
        country: options.country.length > 0 ? options.country : undefined,
        businessModule:
          options.businessModule.length > 0
            ? options.businessModule
            : undefined,
        serviceType:
          options.serviceType.length > 0 ? options.serviceType : undefined,
        stage: options.stage.length > 0 ? options.stage : undefined,
        major: options.major.length > 0 ? options.major : undefined,
        keyword: options.keyword || undefined,
        dateRange: options.dateRange || undefined,
      });

    // 修改前端筛选逻辑，当serverSideFilter为true时不需要进行前端筛选
    const filteredTrainings = useMemo(() => {
      if (!data) return { nodes: [], links: [] };

      // 获取所有已加载数据
      const allNodes = data.pages.flatMap((page) => page.data);

      // 对数据进行去重，防止重复显示同一个培训卡片
      const uniqueNodes = Array.from(
        new Map(allNodes.map((node) => [node.id, node])).values()
      );

      // 不需要前端筛选，因为已经在服务器端筛选了
      const nodes = uniqueNodes;
      const links: TrainingLink[] = [];

      return { nodes, links };
    }, [data]);

    // 设置无限滚动
    useEffect(() => {
      if (!observerTarget.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          // 修改加载条件:当有下一页且不在加载中时就加载更多
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(observerTarget.current);

      return () => observer.disconnect();
    }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

    // 初始加载更多数据
    useEffect(() => {
      if (data?.pages.length === 1 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, [data?.pages.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[800px]">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      );
    }

    return (
      <div
        className={`transition-opacity duration-300 ease-in-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 培训图谱 */}
        <TrainingMap
          data={filteredTrainings}
          layout={layout}
          levelNames={levelNames}
          isLoading={isLoading}
          onNodeClick={async (node: TrainingNode) => {
            // 记录节点点击事件
            logger.debug("用户点击培训节点", {
              module: "TrainingPage",
              data: { nodeId: node.id, nodeTitle: node.title },
            });

            // 如果有URL，打开链接
            if (node.url && node.url.length > 0) {
              window.open(node.url[0], "_blank");
            }

            // 记录查看数据
            try {
              const response = await fetch("/api/training/view", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  trainingId: node.id,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to record view");
              }
            } catch (error) {
              logger.clientError(
                "记录培训查看失败",
                error instanceof Error ? error.message : "未知错误",
                {
                  method: "POST",
                  error: error instanceof Error ? error.message : String(error),
                }
              );
            }
          }}
        />

        {/* 无限滚动触发点 */}
        <div ref={observerTarget} className="h-10" />

        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="text-sm text-muted-foreground">加载更多...</div>
          </div>
        )}
      </div>
    );
  }
);

// 拆分筛选器组件
const TrainingFilters = React.memo(() => {
  return (
    <div className="border rounded-lg">
      <div className="p-3 border-b">
        <FilterBar />
      </div>
      <FilterPanel />
    </div>
  );
});

// 更新主组件
export function TrainingPage({
  title,
  role,
  className = "",
  levelNames,
  showBookmarked = false,
  headerControls,
}: TrainingPageProps) {
  const [layout, setLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 使用Zustand store管理筛选状态
  const options = useTrainingFiltersStore((state) => state.options);
  const setOptions = useTrainingFiltersStore((state) => state.setOptions);
  const resetOptions = useTrainingFiltersStore((state) => state.resetOptions);

  const { data: session } = useSession();
  const router = useRouter();

  // 检查用户是否有管理权限
  const canManage =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  // 在组件挂载时初始化筛选状态
  useEffect(() => {
    setOptions({
      ...options,
      role,
      bookmarked: showBookmarked,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, showBookmarked]);

  // 记录布局切换
  const handleLayoutChange = useCallback(
    (newLayout: "horizontal" | "vertical") => {
      setLayout(newLayout);
      logger.userAction(
        "用户切换培训图谱布局",
        "CHANGE_LAYOUT",
        session?.user?.id || "unknown",
        { layout: newLayout }
      );
    },
    [session?.user?.id]
  );

  // 预取收藏数据
  useEffect(() => {
    // 预取相反状态的数据
    const prefetchOptions = {
      role,
      limit: 10,
      bookmarked: !showBookmarked,
    };

    // 使用 prefetchInfiniteQuery 预取数据
    queryClient.prefetchInfiniteQuery({
      queryKey: ["trainings", prefetchOptions],
      queryFn: ({ pageParam = 1 }) =>
        getTrainings({ ...prefetchOptions, page: pageParam as number }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.meta.page < lastPage.meta.pageCount
          ? lastPage.meta.page + 1
          : undefined,
      pages: 1,
    });
  }, [queryClient, role, showBookmarked]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 使用拆分的头部组件 */}
      <TrainingPageHeader
        title={title}
        layout={layout}
        handleLayoutChange={handleLayoutChange}
        canManage={canManage}
        headerControls={headerControls}
      />

      {/* 使用拆分的筛选组件 */}
      <TrainingFilters />

      {/* 使用拆分的内容组件 */}
      <TrainingContent
        key={JSON.stringify({
          role: options.role,
          country: options.country,
          businessModule: options.businessModule,
          serviceType: options.serviceType,
          major: options.major,
          stage: options.stage,
          keyword: options.keyword,
          dateRange: options.dateRange ? true : false,
          bookmarked: options.bookmarked,
        })}
        options={options}
        layout={layout}
        levelNames={levelNames}
        session={session}
      />
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import { InterviewCard } from "./interview-card";
import { useInterviews } from "@/hooks/use-interviews";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Interview,
  InterviewsResponse,
  StudyDegreeType,
} from "@/types/interview";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function InterviewList() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isAdmin =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  const observerTarget = useRef<HTMLDivElement>(null);

  // 从URL获取筛选参数
  const filters = {
    country: searchParams?.get("country") || undefined,
    university: searchParams?.get("university") || undefined,
    majorCategory: searchParams?.get("majorCategory") || undefined,
    program: searchParams?.get("program") || undefined,
    targetDegree:
      (searchParams?.get("targetDegree") as StudyDegreeType) || undefined,
    status: isAdmin ? undefined : "approved",
  };

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInterviews(filters);

  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // 骨架屏组件
  const SkeletonCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="rounded-lg border bg-card">
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="text-center text-muted-foreground">
        加载失败，请稍后重试
      </div>
    );
  }

  if (!data?.pages[0].data.length && !isLoading && !isFetching) {
    return <div className="text-center text-muted-foreground">暂无面经</div>;
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200",
          isFetching && !isFetchingNextPage ? "opacity-60" : "opacity-100"
        )}
      >
        {(data?.pages || []).map((page) =>
          (page.data || []).map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview as Interview}
            />
          ))
        )}
      </div>

      {(isLoading || (isFetching && !data?.pages?.length)) && <SkeletonCards />}

      <div ref={observerTarget} className="h-4" />

      {isFetchingNextPage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="rounded-lg border bg-card">
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

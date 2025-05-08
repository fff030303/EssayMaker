"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  rootMargin?: string;
  disableAutoLoad?: boolean;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  className = "",
  rootMargin = "10px",
  disableAutoLoad = false,
}: InfiniteScrollProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [loadTriggered, setLoadTriggered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intersectingRef = useRef(false);
  const prevScrollPosRef = useRef(0);
  const consecutiveLoadsRef = useRef(0);

  const throttledLoadMore = useCallback(() => {
    if (!hasMore || isLoading || loadTriggered) return;

    if (consecutiveLoadsRef.current > 2) {
      console.log("检测到频繁加载，增加冷却时间");
      setTimeout(() => {
        consecutiveLoadsRef.current = 0;
      }, 3000);
      return;
    }

    setLoadTriggered(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    console.log("InfiniteScroll: 触发滚动加载");
    onLoadMore();

    consecutiveLoadsRef.current += 1;

    timerRef.current = setTimeout(() => {
      setLoadTriggered(false);
    }, 1500);
  }, [hasMore, isLoading, loadTriggered, onLoadMore]);

  const checkActiveScrolling = useCallback(() => {
    if (typeof window === "undefined") return false;

    const currentScrollPos = window.scrollY;
    const isScrollingDown = currentScrollPos > prevScrollPosRef.current;
    prevScrollPosRef.current = currentScrollPos;

    return isScrollingDown && currentScrollPos - prevScrollPosRef.current > 50;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !intersectingRef.current) {
      setLoadTriggered(false);
    }

    if (!isLoading && consecutiveLoadsRef.current > 0) {
      consecutiveLoadsRef.current -= 1;
    }
  }, [isLoading]);

  useEffect(() => {
    if (!observerTarget.current || disableAutoLoad) return;

    const observer = new IntersectionObserver(
      (entries) => {
        intersectingRef.current = entries[0].isIntersecting;

        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !loadTriggered
        ) {
          requestAnimationFrame(() => {
            throttledLoadMore();
          });
        }
      },
      {
        threshold: 0.8,
        rootMargin,
      }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [throttledLoadMore, hasMore, isLoading, rootMargin, disableAutoLoad]);

  const handleManualLoad = () => {
    if (!isLoading && hasMore) {
      consecutiveLoadsRef.current = 0;
      throttledLoadMore();
    }
  };

  return (
    <div ref={observerTarget} className={`py-4 text-center ${className}`}>
      {hasMore && (
        <button
          onClick={handleManualLoad}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "加载中..." : "加载更多"}
        </button>
      )}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      )}
      {!hasMore && !isLoading && (
        <span className="text-sm text-muted-foreground">已加载全部数据</span>
      )}
    </div>
  );
}

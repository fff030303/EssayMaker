"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCarousel } from "@/contexts/CarouselContext";

type Card = {
  id: number;
  name: React.ReactNode;
  designation: React.ReactNode;
  content: React.ReactNode;
};

interface CardStackProps {
  items: Card[];
  offset?: number;
  scaleFactor?: number;
  autoPlayInterval?: number;
  direction?: "up" | "right";
  className?: string;
  startTime?: number;
  maxVisibleCards?: number;
  showIndicator?: boolean;
  indicatorStyle?: "minimal" | "elegant" | "integrated";
  cardHeight?: string;
}

export function CardStack({
  items,
  offset = 5,
  scaleFactor = 0.06,
  autoPlayInterval,
  direction = "up",
  className,
  startTime,
  maxVisibleCards = 3,
  showIndicator = true,
  indicatorStyle = "elegant",
  cardHeight = "300px",
}: CardStackProps) {
  const CARD_OFFSET = offset || 10;
  const SCALE_FACTOR = scaleFactor || 0.06;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isPaused, setPaused } = useCarousel();

  // 处理点击事件
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const halfWidth = rect.width / 2;

      setCurrentIndex((current) => {
        const next =
          x < halfWidth
            ? (current - 1 + items.length) % items.length
            : (current + 1) % items.length;
        return next;
      });

      // 标记用户已交互
      setUserInteracted(true);
      setPaused(true);
    },
    [items.length, setPaused]
  );

  // 修改鼠标进入处理
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setPaused(true);
  }, [setPaused]);

  // 修改鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // 只有当用户没有手动交互时，才恢复自动播放
    if (!userInteracted) {
      setPaused(false);
    }
  }, [setPaused, userInteracted]);

  // 设置自动播放
  useEffect(() => {
    if (!autoPlayInterval || !startTime || isHovered || isPaused) return;

    const now = Date.now();
    const elapsed = now - startTime;
    const initialIndex = Math.floor(elapsed / autoPlayInterval) % items.length;
    setCurrentIndex(initialIndex);

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % items.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, items.length, startTime, isHovered, isPaused]);

  // 根据 currentIndex 重排卡片
  const orderedCards = useMemo(() => {
    return items.map((_, index) => {
      const actualIndex = (index + currentIndex) % items.length;
      return items[actualIndex];
    });
  }, [items, currentIndex]);

  // 限制显示的卡片数量
  const visibleCards = useMemo(() => {
    return orderedCards.slice(
      0,
      Math.min(maxVisibleCards, orderedCards.length)
    );
  }, [orderedCards, maxVisibleCards]);

  // 添加卡片总数和当前位置指示器
  const cardIndicator = useMemo(() => {
    if (!showIndicator || items.length <= 1) return null;

    // 最小化指示器 - 简洁的线条设计
    if (indicatorStyle === "minimal") {
      return (
        <div className="absolute bottom-[-32px] left-0 right-0 flex justify-center items-center gap-1 px-4">
          <div className="h-[2px] bg-gray-200 dark:bg-gray-800 rounded-full flex-1 overflow-hidden">
            <motion.div
              className="h-full bg-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${(currentIndex / (items.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs font-light text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
            {currentIndex + 1}/{items.length}
          </div>
        </div>
      );
    }

    // 集成式指示器 - 融入卡片设计
    if (indicatorStyle === "integrated") {
      return (
        <div className="absolute top-4 right-4 z-50 pointer-events-none">
          <div className="bg-black/10 dark:bg-white/10 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-medium text-black/70 dark:text-white/70">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      );
    }

    // 优雅指示器 - 默认，更精致的设计
    return (
      <div className="absolute bottom-[-40px] left-0 right-0 flex justify-center">
        <div className="bg-white/80 dark:bg-black/50 backdrop-blur-sm shadow-sm px-3 py-1.5 rounded-full flex items-center gap-3">
          <div className="flex gap-[3px]">
            {Array.from({ length: Math.min(items.length, 7) }).map((_, i) => {
              // 如果卡片数量超过7个，显示前3个，中间省略，后3个
              if (items.length > 7) {
                if (i === 3) {
                  return (
                    <div key="ellipsis" className="flex items-end pb-0.5">
                      <span className="text-[8px] text-gray-400 dark:text-gray-500 mx-0.5">
                        •••
                      </span>
                    </div>
                  );
                }
                if (i > 3 && i < items.length - 3) return null;
              }

              const isActive =
                items.length <= 7
                  ? i === currentIndex % items.length
                  : (i < 3 && currentIndex < 3) ||
                    (i > 3 && currentIndex >= items.length - 3) ||
                    i === currentIndex - items.length + 7;

              return (
                <motion.div
                  key={i}
                  className={cn(
                    "rounded-full",
                    isActive ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  )}
                  initial={false}
                  animate={{
                    width: isActive ? 16 : 6,
                    height: 6,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              );
            })}
          </div>

          <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 min-w-[24px]">
            {currentIndex + 1}/{items.length}
          </div>
        </div>
      </div>
    );
  }, [currentIndex, items.length, showIndicator, indicatorStyle]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full card-stack-container cursor-pointer overflow-visible",
        className
      )}
      style={{ height: cardHeight }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        // 直接处理点击事件，不做高度限制检查
        handleClick(e);
      }}
    >
      {visibleCards.map((card, index) => (
        <motion.div
          key={card.id}
          className="absolute bg-white dark:bg-black w-full rounded-3xl p-6 shadow-xl border border-neutral-200 dark:border-white/[0.1] shadow-black/[0.1] dark:shadow-white/[0.05] flex flex-col justify-between pointer-events-none"
          style={{
            transformOrigin: direction === "up" ? "top center" : "center left",
            height: cardHeight,
            maxWidth: "100%",
            overflow: "hidden",
            borderRadius: "1.5rem",
          }}
          animate={{
            [direction === "up" ? "y" : "x"]:
              direction === "up"
                ? index * (isHovered ? -45 : -35)
                : index * (isHovered ? 65 : 55),
            scale: 1 - index * SCALE_FACTOR,
            zIndex: items.length - index,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <div className="space-y-4">
            <div className="font-medium text-base text-neutral-900 dark:text-neutral-100">
              {card.name}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">
              {card.designation}
            </div>
            {card.content && (
              <div className="font-normal text-neutral-700 dark:text-neutral-300">
                {card.content}
              </div>
            )}
          </div>
        </motion.div>
      ))}
      {cardIndicator}
    </div>
  );
}

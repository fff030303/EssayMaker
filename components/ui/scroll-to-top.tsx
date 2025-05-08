"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  className?: string;
  threshold?: number; // 显示按钮的滚动阈值
  smooth?: boolean; // 是否使用平滑滚动
}

export function ScrollToTop({
  className,
  threshold = 300,
  smooth = true,
}: ScrollToTopProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > threshold);
    };

    // 添加滚动监听
    window.addEventListener("scroll", handleScroll, { passive: true });
    // 初始检查
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return (
    <div
      className={cn(
        "fixed z-50 transition-opacity duration-200",
        "bottom-4 right-4 lg:bottom-8 lg:right-8",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
    >
      <div className="relative group">
        <Button
          variant="default"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90",
            "text-primary-foreground"
          )}
          onClick={scrollToTop}
          aria-label="回到顶部"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

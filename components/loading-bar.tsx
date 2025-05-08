"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<"start" | "waiting" | "complete">(
    "start"
  );

  useEffect(() => {
    const originalFetch = window.fetch;
    let activeRequests = 0;

    window.fetch = async (...args) => {
      const startLoading = () => {
        if (activeRequests === 0) {
          requestAnimationFrame(() => {
            setLoading(true);
            setProgress("start");
            // 快速到达35%
            setTimeout(() => setProgress("waiting"), 200);
          });
        }
        activeRequests++;
      };

      const stopLoading = () => {
        activeRequests--;
        if (activeRequests === 0) {
          requestAnimationFrame(() => {
            // 完成剩余进度
            setProgress("complete");
            setTimeout(() => {
              setLoading(false);
              setProgress("start");
            }, 300);
          });
        }
      };

      startLoading();

      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        // 即使发生错误也要继续抛出，让应用程序的其他部分能够处理它
        throw error;
      } finally {
        stopLoading();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div
        className={cn(
          "h-full bg-primary",
          progress === "start" && "animate-loading-start",
          progress === "waiting" && "animate-loading-waiting",
          progress === "complete" && "animate-loading-complete"
        )}
      />
    </div>
  );
}

// 添加到 globals.css
const styles = `
@keyframes loading-bar {
  0% {
    width: 0;
    opacity: 1;
  }
  50% {
    width: 50%;
    opacity: 0.5;
  }
  100% {
    width: 100%;
    opacity: 0;
  }
}

.animate-loading-bar {
  animation: loading-bar 1s ease-in-out infinite;
}
`;

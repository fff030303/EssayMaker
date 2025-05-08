"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageVisitTracker() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 添加记录控制状态
  const lastRecordedPath = useRef<string | null>(null);
  const isRecording = useRef<boolean>(false);

  // 记录页面访问
  useEffect(() => {
    // 只有当用户已登录且路径变化时记录
    if (session?.user?.id && pathname) {
      // 防止重复记录同一路径或快速连续记录
      if (lastRecordedPath.current === pathname || isRecording.current) {
        console.log("防止重复记录:", pathname);
        return;
      }

      isRecording.current = true;

      // 构建请求体
      const visitData = {
        userId: session.user.id,
        email: session.user.email || "",
        name: session.user.name || "未知",
        path: pathname,
        query: searchParams?.toString() || null,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
      };

      // 发送记录请求
      fetch("/api/logs/record-page-visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(visitData),
      })
        .then(() => {
          // 更新最后记录的路径
          lastRecordedPath.current = pathname;
          console.log("成功记录页面访问:", pathname);
        })
        .catch((error) => {
          console.error("记录页面访问失败:", error);
        })
        .finally(() => {
          // 完成记录，重置状态
          isRecording.current = false;
        });
    }
  }, [pathname, searchParams, session]);

  return null; // 此组件不渲染任何UI
}

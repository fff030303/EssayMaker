"use client";

import { Button } from "@/components/ui/button";
import { getShinyWayAuthUrl, getCasAuthUrl } from "@/lib/auth";
import { useEffect, useState } from "react";
import { log } from "@/lib/logger";

interface LoginButtonProps {
  callbackUrl?: string;
}

export function LoginButton({ callbackUrl = "/console" }: LoginButtonProps) {
  const [isProduction, setIsProduction] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // 生成会话ID用于跟踪完整登录流程
    const newSessionId = `login_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);

    // 检测是否为生产环境
    const hostname = window.location.hostname;
    const isProd =
      !hostname.includes("localhost") &&
      !hostname.includes("127.0.0.1") &&
      !hostname.includes(".local");
    setIsProduction(isProd);

    log.info(`[登录${newSessionId}] 初始化登录按钮`, {
      hostname,
      isProd,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      cookies: document.cookie ? "有Cookie" : "无Cookie",
      cookieLength: document.cookie?.length || 0,
      localStorage:
        Object.keys(localStorage).length > 0
          ? "有localStorage"
          : "无localStorage",
      url: window.location.href,
      callbackUrl,
    });
  }, [callbackUrl]);

  const handleLogin = () => {
    try {
      // 根据环境选择登录方式
      let authUrl;

      if (isProduction) {
        // 生产环境使用CAS登录 - 传递当前主机名
        authUrl = getCasAuthUrl(window.location.hostname);
        log.info(`[登录${sessionId}] 生产环境使用CAS登录`, {
          authUrl,
          hostname: window.location.hostname,
          timestamp: new Date().toISOString(),
          cookies: document.cookie ? "有Cookie" : "无Cookie",
          cookieNames: document.cookie
            .split(";")
            .map((c) => c.trim().split("=")[0]),
          callbackUrl,
        });
      } else {
        // 开发环境使用原有的企微登录
        authUrl = getShinyWayAuthUrl();
        log.info(`[登录${sessionId}] 开发环境使用企微登录`, {
          authUrl,
          timestamp: new Date().toISOString(),
          cookies: document.cookie ? "有Cookie" : "无Cookie",
          cookieNames: document.cookie
            .split(";")
            .map((c) => c.trim().split("=")[0]),
          callbackUrl,
        });
      }

      // 将跟踪ID添加到URL中
      const authUrlObj = new URL(authUrl);
      authUrlObj.searchParams.append("_trace", sessionId);

      // 增加针对 CloudFlare 的参数
      // 检测是否通过CloudFlare访问
      const isCloudFlare =
        navigator.userAgent.includes("CloudFlare") ||
        document.cookie.includes("cf_") ||
        window.location.hostname === "deepflow.cloud";

      // 添加CloudFlare特定参数
      if (isCloudFlare) {
        authUrlObj.searchParams.append("cf", "1");
        log.info(`[登录${sessionId}] 检测到CloudFlare环境，添加cf参数`);
      }

      // 添加当前主机名，帮助服务端更精确构建回调URL
      authUrlObj.searchParams.append("host", window.location.hostname);

      // 添加当前时间戳和更多上下文信息
      authUrlObj.searchParams.append("t", Date.now().toString());
      authUrlObj.searchParams.append("sessid", sessionId);

      // 添加回调URL
      if (callbackUrl && callbackUrl !== "/console") {
        authUrlObj.searchParams.append("callbackUrl", callbackUrl);
      }

      // 添加源页面的信息，以便登录成功后可以正确返回
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath && currentPath !== "/") {
        authUrlObj.searchParams.append(
          "redirect_after",
          encodeURIComponent(currentPath)
        );
      }

      const finalAuthUrl = authUrlObj.toString();

      log.info(`[登录${sessionId}] 准备跳转到认证URL`, {
        originalUrl: authUrl,
        finalUrl: finalAuthUrl,
        timestamp: new Date().toISOString(),
        hostname: window.location.hostname,
        isCloudFlare: isCloudFlare ? "是" : "否",
        addedParams: {
          _trace: sessionId,
          t: Date.now().toString(),
          sessid: sessionId,
          host: window.location.hostname,
          cf: isCloudFlare ? "1" : "0",
          callbackUrl,
        },
      });

      // 存储登录会话ID和时间戳，以便跟踪
      try {
        localStorage.setItem("lastLoginAttempt", new Date().toISOString());
        localStorage.setItem("lastLoginSessionId", sessionId);
        localStorage.setItem("lastLoginUrlBase", authUrl);
        localStorage.setItem("lastLoginUrlFinal", finalAuthUrl);
        localStorage.setItem("lastLoginCallbackUrl", callbackUrl);
      } catch (storageError) {
        log.warn(`[登录${sessionId}] 无法存储登录会话信息`, {
          error:
            storageError instanceof Error
              ? storageError.message
              : String(storageError),
        });
      }

      // 跳转到认证URL
      window.location.href = finalAuthUrl;
    } catch (error) {
      log.error(`[登录${sessionId}] 生成认证URL时出错`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        isProduction,
        callbackUrl,
      });
      alert("生成登录链接时出错，请查看控制台日志");
    }
  };

  return (
    <Button
      className="w-full"
      onClick={handleLogin}
      size="lg"
      id={`login-btn-${sessionId}`}
    >
      企微登录
    </Button>
  );
}

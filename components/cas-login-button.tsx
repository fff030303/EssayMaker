"use client";

import { Button } from "@/components/ui/button";
import { getCasAuthUrl } from "@/lib/auth";
import { useState, useEffect } from "react";
import { log } from "@/lib/logger";

interface CasLoginButtonProps {
  showDebugOptions?: boolean;
  callbackUrl?: string;
}

export function CasLoginButton({
  showDebugOptions = false,
  callbackUrl = "/console",
}: CasLoginButtonProps) {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // 生成CAS会话ID
    const newSessionId = `cas_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);

    try {
      log.info(`[CAS登录${newSessionId}] 初始化CAS登录按钮`, {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        cookies: document.cookie ? "有Cookie" : "无Cookie",
        cookieLength: document.cookie?.length || 0,
        hostname: window.location.hostname,
        callbackUrl,
      });
    } catch (error) {
      console.error("记录CAS登录初始化错误:", error);
    }
  }, [callbackUrl]);

  const handleLogin = () => {
    try {
      const hostname = window.location.hostname;

      // 获取CAS认证URL
      const authUrl = getCasAuthUrl(hostname);

      // 修改认证URL，添加额外参数
      const authUrlObj = new URL(authUrl);

      // 添加会话跟踪ID和额外参数
      authUrlObj.searchParams.append("_trace", sessionId);
      authUrlObj.searchParams.append("sessid", sessionId);
      authUrlObj.searchParams.append("t", Date.now().toString());
      authUrlObj.searchParams.append("host", hostname);

      // 添加回调URL
      if (callbackUrl && callbackUrl !== "/console") {
        authUrlObj.searchParams.append("callbackUrl", callbackUrl);
      }

      // 检测CloudFlare
      const isCloudFlare =
        navigator.userAgent.includes("CloudFlare") ||
        document.cookie.includes("cf_") ||
        hostname === "deepflow.cloud";

      if (isCloudFlare) {
        authUrlObj.searchParams.append("cf", "1");
      }

      const finalAuthUrl = authUrlObj.toString();

      // 记录登录尝试
      log.info(`[CAS登录${sessionId}] 准备跳转到CAS认证URL`, {
        originalUrl: authUrl,
        finalUrl: finalAuthUrl,
        hostname,
        isCloudFlare: isCloudFlare ? "是" : "否",
        callbackUrl,
      });

      // 存储登录信息
      try {
        localStorage.setItem("lastCasLoginAttempt", new Date().toISOString());
        localStorage.setItem("lastCasLoginSessionId", sessionId);
        localStorage.setItem("lastCasLoginUrlBase", authUrl);
        localStorage.setItem("lastCasLoginUrlFinal", finalAuthUrl);
        localStorage.setItem("lastCasLoginCallbackUrl", callbackUrl);
      } catch (storageError) {
        console.warn("无法存储CAS登录信息:", storageError);
      }

      // 跳转到认证URL
      window.location.href = finalAuthUrl;
    } catch (error) {
      console.error("CAS登录错误:", error);
      alert("生成CAS登录链接时出错，请查看控制台日志");
    }
  };

  const clearCookies = () => {
    const cookiesToClear = [
      "cas_session",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
    ];

    let cleared = 0;
    cookiesToClear.forEach((cookieName) => {
      // 尝试不同的路径和域
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname};`;
      cleared++;
    });

    // 清理localStorage中的登录数据
    try {
      localStorage.removeItem("lastCasLoginAttempt");
      localStorage.removeItem("lastCasLoginSessionId");
      localStorage.removeItem("lastCasLoginUrlBase");
      localStorage.removeItem("lastCasLoginUrlFinal");
      localStorage.removeItem("lastCasLoginCallbackUrl");
    } catch (e) {
      console.warn("清理localStorage失败:", e);
    }

    alert(`已清理 ${cleared} 个Cookie和相关存储数据`);
  };

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        onClick={handleLogin}
        size="lg"
        id={`cas-login-btn-${sessionId}`}
      >
        CAS登录
      </Button>
      {showDebugOptions && (
        <Button
          variant="outline"
          className="w-full text-xs"
          onClick={clearCookies}
          type="button"
          size="sm"
        >
          清理CAS相关Cookie
        </Button>
      )}
    </div>
  );
}

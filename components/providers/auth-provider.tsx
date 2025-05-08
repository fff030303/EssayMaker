"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User } from "@/types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 公共页面白名单
const PUBLIC_PATHS = ["/", "/pricing", "/docs", "/about", "/workspace-entry"];

// 判断是否是公共页面的函数
function isPublicPath(path: string | null) {
  if (!path) return false;
  return (
    PUBLIC_PATHS.includes(path) || PUBLIC_PATHS.some((p) => path.startsWith(p))
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 判断当前页面是否是公共页面
  const isPublicPage = isPublicPath(pathname);

  useEffect(() => {
    // 此日志用于调试页面导航和认证状态的变化:
    //console.log("Navigation effect:", {
    //pathname,
    //status,
    //session: session?.user,
    //isPublicPage,
    //});

    // 如果正在加载，不做任何处理
    if (status === "loading") {
      return;
    }

    // 如果是控制台页面且未登录，跳转到登录页
    if (pathname?.startsWith("/console") && !session?.user) {
      router.push("/workspace-entry");
      return;
    }

    // 如果是其他非公共页面且未登录，也跳转到登录页
    if (!isPublicPage && !session?.user && status === "unauthenticated") {
      router.push("/workspace-entry");
      return;
    }

    // 如果是登录页面且已登录，跳转到控制台
    if (pathname === "/workspace-entry" && session?.user) {
      router.push("/console");
      return;
    }
  }, [pathname, status, session, router, isPublicPage]);

  const logout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      router.push("/workspace-entry");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user: session?.user as User | null,
    loading: status === "loading",
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

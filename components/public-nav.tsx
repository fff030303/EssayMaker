"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "./providers/auth-provider";

const navItems = [
  {
    title: "首页",
    href: "/",
  },
  {
    title: "定价",
    href: "/pricing",
  },
  {
    title: "文档",
    href: "/docs",
  },
  {
    title: "关于",
    href: "/about",
  },
];

export function PublicNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // 如果在控制台页面，不显示导航栏
  if (pathname?.startsWith("/console")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">留学顾问工作坊</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {user ? (
            <Button variant="ghost" asChild>
              <Link href="/console">进入控制台</Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href="/workspace-entry">登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

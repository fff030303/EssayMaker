"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, MessageSquare, Settings, LogOut, BookOpen } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "对话历史",
    href: "/dashboard/history",
    icon: MessageSquare,
  },
  {
    title: "使用指南",
    href: "/dashboard/guide",
    icon: BookOpen,
  },
  {
    title: "设置",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface DashboardNavProps {
  collapsed?: boolean
}

export default function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/workspace-entry" })
    } catch (error) {
      console.error("登出失败:", error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="ml-2">{item.title}</span>}
            </Link>
          </Button>
        ))}
      </div>
      <div className="flex-1" />
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100/50",
          collapsed && "justify-center px-2"
        )}
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="ml-2">退出登录</span>}
      </Button>
    </div>
  )
} 
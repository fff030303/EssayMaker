"use client";

import * as React from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Command,
  Home,
  MessageCircle,
  Users2,
  BookOpen,
  FileText,
  GraduationCap,
  UserPlus,
  Shield,
  ListTodo,
  Bot,
  FileCode,
  BookMarked,
  Files,
  CaseUpper,
  School,
  ScrollText,
  Award,
  BookCheck,
  PanelLeftClose,
  PanelLeft,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "./providers/auth-provider";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const data = {
  teams: [
    {
      name: "新通",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navGroups: [
    {
      id: "platform",
      label: "Platform",
      items: [
        {
          title: "应用地图",
          url: "/console",
          icon: LayoutDashboard,
          showInCollapsed: true,
        },
        {
          title: "案例库",
          url: "/console/student-hub",
          icon: Files,
          showInCollapsed: true,
        },
        {
          title: "面经库",
          url: "/console/interview-bank",
          icon: ScrollText,
          showInCollapsed: true,
        },
        {
          title: "AI 助理",
          icon: Bot,
          showInCollapsed: true,
          items: [
            {
              title: "脑暴助理",
              url: "/console/essaymaker",
              icon: MessageCircle,
              showInCollapsed: false,
            },
            {
              title: "提示词管理",
              url: "/console/prompts",
              icon: FileCode,
              showInCollapsed: false,
            },
          ],
        },

        {
          title: "Task Studio",
          icon: School,
          showInCollapsed: true,
          items: [
            {
              title: "文案顾问培训",
              url: "/console/training",
              icon: BookMarked,
              showInCollapsed: true,
            },
            {
              title: "咨询顾问培训",
              url: "/console/training-consultant",
              icon: Award,
              showInCollapsed: true,
            },
            {
              title: "卓越服务指南",
              url: "/console/guide",
              icon: BookCheck,
              showInCollapsed: true,
            },
          ],
        },
        {
          title: "系统管理",
          icon: Settings,
          showInCollapsed: false,
          items: [
            {
              title: "用户管理",
              url: "/console/users",
              icon: Users,
              showInCollapsed: false,
            },
            {
              title: "角色管理",
              url: "/console/roles",
              icon: Shield,
              showInCollapsed: false,
            },
            {
              title: "登录记录",
              url: "/console/logs/login-records",
              icon: FileText,
              showInCollapsed: false,
            },
            {
              title: "页面访问记录",
              url: "/console/logs/page-visits",
              icon: Files,
              showInCollapsed: false,
            },
          ],
        },
      ],
    },
  ],
};

// 定义需要对普通用户隐藏的菜单项标题
const hiddenForUserRole = ["AI 助手", "智能匹配", "系统管理"];

// 定义仅管理员可见的菜单项标题
const adminOnlyMenus = ["系统管理"];

const linkClass =
  "flex items-center gap-3 rounded-md hover:bg-accent/50 transition-colors [&:not(.sidebar-collapsed)]:px-3 [&:not(.sidebar-collapsed)]:py-2 [.sidebar-collapsed_&]:p-1 text-sm";
const activeClass = "bg-accent/50 text-foreground font-medium";

export function AppSidebar({
  collapsible,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { state, openMobile, effectiveState } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  if (!user) return null;

  // 根据用户角色过滤菜单项
  const filteredNavGroups = data.navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      // 如果是普通用户,隐藏指定的菜单项
      if (user.role === "user" && hiddenForUserRole.includes(item.title)) {
        return false;
      }

      // 系统管理菜单仅对admin角色显示
      if (user.role !== "admin" && adminOnlyMenus.includes(item.title)) {
        return false;
      }

      return true;
    }),
  }));

  return (
    <Sidebar
      collapsible={collapsible}
      className={cn(
        "bg-gray-50/95 border-r border-gray-200",
        isMobile && "z-50" // 在移动设备上增加z-index确保侧边栏在其他元素之上
      )}
      {...props}
    >
      <SidebarHeader className="px-4 py-3">
        {isCollapsed && !isMobile ? (
          // 折叠状态下的布局 (仅在非移动设备上)
          <div className="flex flex-col items-center gap-4">
            <SidebarTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <PanelLeft className="h-4 w-4" />
            </SidebarTrigger>
            <div className="flex justify-center">
              <TeamSwitcher teams={data.teams} />
            </div>
          </div>
        ) : (
          // 展开状态下的布局
          <div className="flex items-center justify-between">
            <TeamSwitcher teams={data.teams} />
            {!isMobile && (
              <SidebarTrigger className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <PanelLeftClose className="h-4 w-4" />
              </SidebarTrigger>
            )}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {filteredNavGroups.map((group) => (
          <NavMain key={group.id} group={group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

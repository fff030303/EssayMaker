"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

type RouteInfo = {
  label: string;
  parent: string | null;
};

type RouteMap = {
  [key: string]: RouteInfo;
};

const routeMap: RouteMap = {
  "/console": {
    label: "控制台",
    parent: null,
  },
  "/console/essaymaker": {
    label: "脑暴助理",
    parent: "控制台",
  },
  "/console/prompts": {
    label: "提示词管理",
    parent: "控制台",
  },
  "/console/chat": {
    label: "对话历史",
    parent: "控制台",
  },
  "/console/cases": {
    label: "文案匹配平台",
    parent: "控制台",
  },
  "/console/training": {
    label: "文案顾问培训图谱",
    parent: "控制台",
  },
  "/console/training/manage": {
    label: "培训管理",
    parent: "文案顾问培训图谱",
  },
  "/console/training/exam-manage": {
    label: "考试管理",
    parent: "培训管理",
  },
  "/console/training/question-bank": {
    label: "题库管理",
    parent: "培训管理",
  },
  "/console/training/question-bank/question-agent": {
    label: "出题助理",
    parent: "题库管理",
  },
  "/console/training-consultant": {
    label: "咨询顾问培训图谱",
    parent: "控制台",
  },
  "/console/guide": {
    label: "卓越服务指南",
    parent: "控制台",
  },
  "/console/users": {
    label: "用户管理",
    parent: "控制台",
  },
  "/console/users/add": {
    label: "添加用户",
    parent: "用户管理",
  },
  "/console/roles": {
    label: "角色管理",
    parent: "用户管理",
  },
  "/console/logs/login-records": {
    label: "登录记录",
    parent: "控制台",
  },
  "/console/logs/page-visits": {
    label: "页面访问记录",
    parent: "控制台",
  },
  "/console/settings": {
    label: "设置",
    parent: "控制台",
  },
  "/console/student-hub": {
    label: "案例库",
    parent: "控制台",
  },
  "/console/interview-bank": {
    label: "面经库",
    parent: "控制台",
  },
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const route = pathname ? routeMap[pathname] : null;

  if (!pathname || !route) return null;

  // 构建面包屑路径
  const breadcrumbs: { label: string; href: string; id: string }[] = [];

  // 在根目录后进行顶级分类显示
  if (pathname.startsWith("/console")) {
    // 添加顶级目录，但前提是当前路径不是控制台首页
    if (pathname !== "/console") {
      breadcrumbs.push({
        label: "控制台",
        href: "/console",
        id: "console-home",
      });

      // 处理子目录
      if (route.parent && route.parent !== "控制台") {
        // 查找父级路由
        let parentKey = "";
        for (const [key, info] of Object.entries(routeMap)) {
          if (info.label === route.parent) {
            parentKey = key;
            break;
          }
        }

        // 路径可能需要基于父级标签构建，而不是使用path属性
        const parentPath = parentKey || `/console/${route.parent}`;
        breadcrumbs.push({
          label: route.parent,
          href: parentPath,
          id: `parent-${parentPath}`,
        });
      }
    }
  }

  // 添加当前页面
  breadcrumbs.push({
    label: route.label,
    href: pathname,
    id: `current-${pathname}`,
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className="hidden md:block">
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

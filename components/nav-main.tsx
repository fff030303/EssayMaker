"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  items?: NavItem[];
  email?: string;
  showInCollapsed?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface NavMainProps {
  group: NavGroup;
}

export function NavMain({ group }: NavMainProps) {
  const { effectiveState } = useSidebar();
  const isCollapsed = effectiveState === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={cn("px-2 mb-2", isCollapsed && "hidden")}>
        {group.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu
          className={cn(
            "flex flex-col gap-1",
            isCollapsed && "px-2 items-center"
          )}
        >
          {group.items.map((item: NavItem, index: number) => (
            <React.Fragment key={item.title}>
              {!isCollapsed && (
                <Collapsible
                  asChild
                  defaultOpen={false}
                  className={cn(
                    "group/collapsible relative",
                    "before:absolute before:left-[1.5rem] before:top-[2.25rem] before:h-[calc(100%-2rem)] before:w-px",
                    "before:bg-gray-200 dark:before:bg-gray-800",
                    "before:transition-opacity before:duration-200",
                    "before:opacity-0 [&[data-state=open]]:before:opacity-100",
                    index === group.items.length - 1 && "before:hidden"
                  )}
                >
                  <SidebarMenuItem className="w-[calc(100%-1rem)] mx-2">
                    {item.items ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full rounded-md h-10 justify-between gap-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.icon && (
                                <item.icon className="h-4 w-4 shrink-0 text-gray-500 relative z-10" />
                              )}
                              <span className="text-sm font-semibold text-gray-900">
                                {item.title}
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 rotate-[-90deg] group-data-[state=open]/collapsible:rotate-0" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <SidebarMenuSub className="py-0.5">
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem
                                key={subItem.title}
                                className="py-0"
                              >
                                {subItem.url && (
                                  <Link href={subItem.url}>
                                    <SidebarMenuSubButton>
                                      <div className="w-full flex items-center gap-2 py-0.5 rounded-sm">
                                        {subItem.icon && (
                                          <subItem.icon className="h-3 w-3 shrink-0 text-gray-500" />
                                        )}
                                        <span className="text-[12px] font-medium text-gray-700 leading-none">
                                          {subItem.title}
                                        </span>
                                      </div>
                                    </SidebarMenuSubButton>
                                  </Link>
                                )}
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : item.url ? (
                      <Link href={item.url}>
                        <SidebarMenuButton className="rounded-md h-10 justify-start gap-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.icon && (
                              <item.icon className="h-4 w-4 shrink-0 text-gray-500" />
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {item.title}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </Link>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {isCollapsed &&
                (item.items
                  ? item.showInCollapsed &&
                    item.items.some((subItem) => subItem.showInCollapsed) && (
                      <SidebarMenuItem>
                        <div className="flex flex-wrap items-center justify-center">
                          {item.items.map(
                            (subItem) =>
                              subItem.showInCollapsed &&
                              subItem.url && (
                                <div key={subItem.title}>
                                  <Link href={subItem.url}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center justify-center h-10 w-10 hover:bg-gray-100/50 rounded-md">
                                          {subItem.icon && (
                                            <subItem.icon className="h-5 w-5 shrink-0 text-gray-500" />
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
                                        {subItem.title}
                                      </TooltipContent>
                                    </Tooltip>
                                  </Link>
                                </div>
                              )
                          )}
                        </div>
                      </SidebarMenuItem>
                    )
                  : item.showInCollapsed &&
                    item.url && (
                      <SidebarMenuItem>
                        <Link href={item.url}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center h-10 w-10 hover:bg-gray-100 rounded-md">
                                {item.icon && (
                                  <item.icon className="h-5 w-5 shrink-0 text-gray-500" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        </Link>
                      </SidebarMenuItem>
                    ))}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

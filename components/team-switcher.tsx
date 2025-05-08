"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface TeamSwitcherProps {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile, effectiveState } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const isCollapsed = effectiveState === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "w-full",
                isCollapsed
                  ? "h-10 justify-center px-2"
                  : "h-auto flex-col items-start gap-1 px-3 py-2"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-3",
                  isCollapsed ? "justify-center" : "w-full"
                )}
              >
                <div
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg bg-primary/10",
                    isCollapsed ? "h-6 w-6" : "h-8 w-8"
                  )}
                >
                  <activeTeam.logo
                    className={cn(
                      "text-primary",
                      isCollapsed ? "h-3 w-3" : "h-4 w-4"
                    )}
                  />
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-semibold">
                      {activeTeam.name}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </div>
              {!isCollapsed && (
                <span className="inline-flex h-5 items-center rounded-md bg-primary/10 px-2 text-xs font-medium text-primary">
                  {activeTeam.plan}
                </span>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-[12rem] rounded-lg p-1"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={8}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
              团队切换
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="flex items-center gap-3 px-2 py-1.5"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                  <team.logo className="h-3 w-3 text-primary" />
                </div>
                <div className="grid gap-1">
                  <span className="truncate text-sm font-medium">
                    {team.name}
                  </span>
                  <span className="inline-flex h-5 w-fit items-center rounded-md bg-primary/10 px-2 text-xs font-medium text-primary">
                    {team.plan}
                  </span>
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem className="flex items-center gap-3 px-2 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg border bg-background">
                <Plus className="h-3 w-3" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                添加团队
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

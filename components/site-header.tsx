"use client"

import { User } from "@/types/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavUser } from "@/components/nav-user"

interface SiteHeaderProps {
  user?: User
}

export function SiteHeader({ user }: SiteHeaderProps) {
  if (!user) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1" />
        <div className="flex items-center gap-4">
          <NavUser user={user} />
        </div>
      </div>
    </header>
  )
} 
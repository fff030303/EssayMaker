"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type BadgeType = "country" | "major" | "capability" | "quality" | "stability"

interface ColoredBadgeProps {
  type: BadgeType
  children: React.ReactNode
  className?: string
}

const badgeStyles: Record<BadgeType, string> = {
  country: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
  major: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
  capability: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
  quality: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200",
  stability: "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
}

export function ColoredBadge({ type, children, className }: ColoredBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "transition-colors",
        badgeStyles[type],
        className
      )}
    >
      {children}
    </Badge>
  )
} 
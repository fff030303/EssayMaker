"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Star, UserCheck } from "lucide-react"
import { ColoredBadge } from "@/components/colored-badge"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { CaseWriter } from "@/data/case-writers"

type CaseListProps = {
  data: CaseWriter[]
  loading?: boolean
  onCompare: (id: string) => void
}

export function CaseList({ data, loading = false, onCompare }: CaseListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium">暂无数据</p>
        <p className="text-sm text-muted-foreground">
          请尝试调整筛选条件
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item) => (
        <Card key={item.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300">
          {/* 照片区域 - 固定高度 140px */}
          <div className="relative h-[140px] w-full">
            <Image
              src={item.avatar}
              alt={item.writerName}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{item.writerName}</h3>
                  {item.stability.includes("专家Lv. 6+") ? (
                    <UserCheck className="h-4 w-4 text-green-400" />
                  ) : (
                    <Star className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onCompare(item.id)}
                  className="shrink-0"
                >
                  加入比较
                </Button>
              </div>
              <p className="text-sm text-gray-200 mt-1">{item.branchName}</p>
            </div>
          </div>

          {/* 个人介绍 - 固定高度 80px */}
          <div className="h-[80px] p-3 border-b">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {item.introduction || '暂无介绍'}
            </p>
          </div>

          {/* 标签区域 */}
          <div className="p-3 space-y-2">
            {/* 国家线 */}
            {item.countries.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">擅长国家</p>
                <div className="flex flex-wrap gap-1">
                  {item.countries.map((country: string) => (
                    <ColoredBadge key={country} type="country">
                      {country}
                    </ColoredBadge>
                  ))}
                </div>
              </div>
            )}

            {/* 专业 */}
            {item.majors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">擅长专业</p>
                <div className="flex flex-wrap gap-1">
                  {item.majors.map((major: string) => (
                    <ColoredBadge key={major} type="major">
                      {major}
                    </ColoredBadge>
                  ))}
                </div>
              </div>
            )}

            {/* 业务能力 */}
            {item.businessCapabilities.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">业务能力</p>
                <div className="flex flex-wrap gap-1">
                  {item.businessCapabilities.map((capability: string) => (
                    <ColoredBadge key={capability} type="capability">
                      {capability}
                    </ColoredBadge>
                  ))}
                </div>
              </div>
            )}

            {/* 服务质量 */}
            {item.serviceQualities.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">服务质量</p>
                <div className="flex flex-wrap gap-1">
                  {item.serviceQualities.map((quality: string) => (
                    <ColoredBadge key={quality} type="quality">
                      {quality}
                    </ColoredBadge>
                  ))}
                </div>
              </div>
            )}

            {/* 稳定性 */}
            {item.stability && item.stability.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">行业经验</p>
                <div className="flex flex-wrap gap-1">
                  {item.stability.map((tag: string) => (
                    <ColoredBadge key={tag} type="stability">
                      {tag}
                    </ColoredBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
} 
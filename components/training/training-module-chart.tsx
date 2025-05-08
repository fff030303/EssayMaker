"use client"

import * as React from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ROLE_STYLES } from "@/types/styles"

export interface TrainingModuleData {
  name: string
  value: number
  role: "writer" | "consultant"
}

export interface TrainingModuleChartProps {
  data?: TrainingModuleData[]
  title?: string
  description?: string
  footerText?: string
  loading?: boolean
  error?: string | null
}

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  const data = payload[0].payload as { name: string; size: number; role: keyof typeof ROLE_STYLES }
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-1">
        <div className="flex items-center">
          <div className="w-2.5 h-2.5 rounded-[2px] mr-2" style={{ 
            backgroundColor: ROLE_STYLES[data.role].color 
          }} />
          <span className="font-medium">{data.name}</span>
        </div>
        {data.size && (
          <div className="text-sm text-muted-foreground">
            培训场次：{data.size}
          </div>
        )}
      </div>
    </div>
  )
}

// 转换数据为树形结构
const transformData = (data: TrainingModuleData[]) => {
  // 按角色分组并计算总值
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.role]) {
      acc[item.role] = {
        name: item.role === 'writer' ? '文案顾问' : '咨询顾问',
        children: [] as any[],
        role: item.role,
      }
    }
    acc[item.role].children.push({
      name: item.name,
      size: item.value,
      role: item.role,
    })
    return acc
  }, {} as Record<string, any>)

  // 转换为数组格式
  return [{
    name: 'root',
    children: Object.values(groupedData)
  }]
}

// 文字截断函数
const truncateText = (text: string | undefined) => {
  if (!text) return '';
  if (text.length <= 2) return text;
  return text.slice(0, 2) + '...';
};

// 自定义内容渲染
const CustomContent = (props: any) => {
  const { depth, x, y, width, height, name, size, role } = props;
  
  // 设置间距
  const padding = 4;
  const adjustedX = x + padding;
  const adjustedY = y + padding;
  const adjustedWidth = width - padding * 2;
  const adjustedHeight = height - padding * 2;
  
  // 计算圆角大小 - 根据格子大小动态调整
  const radius = Math.min(
    8, // 最大圆角
    Math.max(4, Math.min(width, height) / 16) // 动态圆角，但不小于4px
  );
  
  // 获取颜色
  const fill = role ? 
    (depth === 1 ? `color-mix(in srgb, ${ROLE_STYLES[role as keyof typeof ROLE_STYLES].color} 80%, transparent)` 
                 : ROLE_STYLES[role as keyof typeof ROLE_STYLES].color)
    : props.fill;

  // 计算文字大小
  const baseFontSize = depth === 1 ? 20 : 16;
  const fontSize = Math.max(
    Math.min(
      baseFontSize,
      adjustedWidth / 5,
      adjustedHeight / 2.5
    ),
    11
  );

  // 处理文字内容
  let displayText;
  if (adjustedWidth < 45 || adjustedHeight < 30) {
    // 区域太小时只显示数字
    displayText = depth === 1 ? '' : size?.toString() ?? '0';
  } else {
    displayText = depth === 1 
      ? truncateText(name)
      : `${truncateText(name)}-${size ?? 0}`;
  }

  // 如果没有文字内容，不渲染text元素
  if (!displayText) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
        rx={radius}
        ry={radius}
      />
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#fff"
        strokeWidth={3}
        rx={radius}
        ry={radius}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: depth === 1 ? 600 : 400,
          pointerEvents: 'none',
          letterSpacing: '0.08em',
          paintOrder: 'stroke',
          stroke: 'rgba(0,0,0,0.4)',
          strokeWidth: 1,
        }}
      >
        {displayText}
      </text>
    </g>
  );
};

export function TrainingModuleChart({
  data = [],
  title = "业务模块",
  description = "培训业务领域分析",
  footerText = "显示各业务模块培训课程数量分布",
  loading = false,
  error = null
}: TrainingModuleChartProps) {
  // 转换数据
  const treeData = React.useMemo(() => transformData(data), [data])
  
  // 计算每个角色的模块数量
  const moduleCounts = React.useMemo(() => ({
    writer: data.filter(item => item.role === 'writer').length,
    consultant: data.filter(item => item.role === 'consultant').length,
  }), [data])

  if (loading) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>{title}</CardTitle>
            <CardDescription>加载中...</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="flex flex-col justify-center h-full space-y-3">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded animate-pulse w-11/12" />
            <div className="h-6 bg-muted rounded animate-pulse w-10/12" />
            <div className="h-6 bg-muted rounded animate-pulse w-9/12" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-red-500">{error}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>{title}</CardTitle>
            <CardDescription>暂无数据</CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[300px]">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex border-t sm:border-t-0">
          <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              {ROLE_STYLES.writer.label}
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {moduleCounts.writer}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              {ROLE_STYLES.consultant.label}
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {moduleCounts.consultant}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col min-h-0">
        <div className="w-full h-full p-2 pb-6">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treeData}
              dataKey="size"
              stroke="#fff"
              content={<CustomContent />}
              animationDuration={450}
              animationBegin={0}
              isAnimationActive={true}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
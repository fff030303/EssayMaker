"use client"

import { TrendingDown, TrendingUp } from "lucide-react"
import { Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ROLE_STYLES } from "@/types/styles"

export interface TrainingRoleData {
  month: string
  writer: number
  consultant: number
  growthRate: number
}

interface TrainingRoleChartProps {
  title?: string
  description?: string
  footerText?: string
  data?: TrainingRoleData
  loading?: boolean
  error?: string | null
}

const chartConfig = {
  writer: {
    label: "文案顾问",
    color: ROLE_STYLES.writer.color,
  },
  consultant: {
    label: "咨询顾问",
    color: ROLE_STYLES.consultant.color,
  },
} satisfies ChartConfig

export function TrainingRoleChart({
  title = "角色分布",
  description = "本月培训场次统计",
  footerText = "显示各角色培训覆盖比例",
  data,
  loading = false,
  error = null
}: TrainingRoleChartProps) {
  if (loading) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="items-center pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="flex items-center justify-center h-full">
            <div className="w-[160px] h-[160px] rounded-full bg-muted animate-pulse" />
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-3 flex-col items-center gap-2 text-sm">
          <div className="w-24 h-4 bg-muted rounded animate-pulse" />
          <div className="w-48 h-4 bg-muted rounded animate-pulse" />
        </CardFooter>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="items-center pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="items-center pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalCount = data.writer + data.consultant
  const growthRate = data.growthRate

  const chartData = [
    { name: "writer", value: data.writer, fill: chartConfig.writer.color },
    { name: "consultant", value: data.consultant, fill: chartConfig.consultant.color }
  ]

  return (
    <Card className="flex flex-col h-[300px]">
      <CardHeader className="items-center pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[160px]"
        >
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={70}
              strokeWidth={4}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCount.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          总场次
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="pt-2 pb-3 flex-col items-center gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          较上月{growthRate >= 0 ? '提升' : '下降'}{Math.abs(growthRate)}%
          {growthRate >= 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="text-center leading-none text-muted-foreground">
        </div>
      </CardFooter>
    </Card>
  )
} 
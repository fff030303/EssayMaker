"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"
import { ROLE_STYLES } from "@/types/styles"
import { ResponsiveContainer } from "recharts"

const chartConfig = {
  views: {
    label: "查看次数",
  },
  writer: {
    label: ROLE_STYLES.writer.label,
    color: ROLE_STYLES.writer.color,
  },
  consultant: {
    label: ROLE_STYLES.consultant.label,
    color: ROLE_STYLES.consultant.color,
  },
} satisfies ChartConfig

export function TrainingViewChart() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("writer")
  const [data, setData] = useState<Array<{
    date: string;
    writer: number;
    consultant: number;
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const total = React.useMemo(
    () => ({
      writer: data.reduce((acc, curr) => acc + curr.writer, 0),
      consultant: data.reduce((acc, curr) => acc + curr.consultant, 0),
    }),
    [data]
  )

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/training/stats/views")
        if (!response.ok) {
          throw new Error("获取数据失败")
        }
        const result = await response.json()
        if (result.code !== 0 || !Array.isArray(result.data)) {
          throw new Error(result.msg || "数据格式错误")
        }
        setData(result.data)
      } catch (err) {
        console.error("获取培训查看统计数据失败:", err)
        setError(err instanceof Error ? err.message : "获取数据失败")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>培训查看统计</CardTitle>
            <CardDescription>加载中...</CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>培训查看统计</CardTitle>
            <CardDescription className="text-red-500">
              {error}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col h-[300px] overflow-hidden">
      <CardHeader className="shrink-0 flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="shrink-0 flex flex-1 flex-col justify-center gap-1 px-4 py-3">
          <CardTitle className="text-base">培训查看统计</CardTitle>
          <CardDescription className="text-xs">
            培训查看次数
          </CardDescription>
        </div>
        <div className="flex shrink-0 border-t sm:border-t-0">
          {["writer", "consultant"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 px-3 py-2 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {chartConfig[chart].label}
                </span>
                <span className="text-base font-bold leading-none">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col min-h-0 overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="flex-1 min-h-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              accessibilityLayer
              data={data}
              margin={{
                left: 0,
                right: 10,
                top: 10,
                bottom: 10
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                tickFormatter={(value) => value.toString()}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })
                    }}
                  />
                }
              />
              <Line
                dataKey={activeChart}
                type="monotone"
                stroke={`var(--color-${activeChart})`}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
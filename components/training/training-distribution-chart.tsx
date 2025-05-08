"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

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
import { ROLE_STYLES } from "@/types/styles"

interface TrainingDistributionData {
  country: string        // 国家
  writer: number        // 文案顾问培训场次
  consultant: number    // 咨询顾问培训场次
}

interface TrainingDistributionChartProps {
  title?: string
  description?: string
  data: TrainingDistributionData[]
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

export function TrainingDistributionChart({
  title = "培训分布",
  description = "各国家培训场次统计",
  data
}: TrainingDistributionChartProps) {
  return (
    <Card className="flex flex-col h-[300px]">
      <CardHeader className="pb-2 items-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col min-h-0">
        <ChartContainer config={chartConfig} className="flex-1 min-h-0">
          <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data}
                accessibilityLayer
                margin={{
                  left: -10,
                  right: 20,
                  top: 20,
                  bottom: 20
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="country"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent nameKey="country" />}
                />
                <Bar 
                  dataKey="writer" 
                  name="文案顾问"
                  fill={ROLE_STYLES.writer.color}
                  radius={[4, 4, 4, 4]} 
                  barSize={24}
                />
                <Bar 
                  dataKey="consultant" 
                  name="咨询顾问"
                  fill={ROLE_STYLES.consultant.color}
                  radius={[4, 4, 4, 4]} 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  )
} 
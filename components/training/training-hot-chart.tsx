"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ROLE_STYLES } from "@/types/styles"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export interface HotTraining {
  id: string;
  title: string;
  role: "writer" | "consultant";
  views: number;
}

interface TrainingHotChartProps {
  title?: string;
  description?: string;
  data: HotTraining[];
  growth: number;
  loading?: boolean;
  error?: string | null;
}

const chartConfig = {
  views: {
    label: "查看次数",
  },
} satisfies ChartConfig

// 文字截断函数
const truncateText = (text: string) => {
  const len = [...text].length; // 使用扩展运算符正确处理中文字符
  return len > 5 ? [...text].slice(0, 5).join('') + '...' : text;
};

export function TrainingHotChart({
  title = "热门培训",
  description = "最受欢迎的培训课程",
  data = [],
  growth = 0,
  loading = false,
  error = null
}: TrainingHotChartProps) {
  if (loading) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <div className="flex flex-col justify-center h-full space-y-3">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded animate-pulse w-11/12" />
            <div className="h-6 bg-muted rounded animate-pulse w-10/12" />
            <div className="h-6 bg-muted rounded animate-pulse w-9/12" />
            <div className="h-6 bg-muted rounded animate-pulse w-8/12" />
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-3 flex-col items-start gap-2 text-sm">
          <div className="w-32 h-4 bg-muted rounded animate-pulse" />
          <div className="w-48 h-4 bg-muted rounded animate-pulse" />
        </CardFooter>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const chartData = data.map((item) => ({
    title: truncateText(item.title),
    fullTitle: item.title,
    views: item.views,
    role: item.role
  }))

  return (
    <Card className="flex flex-col h-[300px]">
      <CardHeader className="pb-2 items-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex flex-col min-h-0">
        <ChartContainer config={chartConfig} className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                left: 10,
                right: 20,
                top: 20,
                bottom: 20
              }}
            >
              <YAxis
                dataKey="title"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                width={80}
              />
              <XAxis dataKey="views" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as { fullTitle: string; views: number; role: keyof typeof ROLE_STYLES };
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-[2px] mr-2" style={{ 
                              backgroundColor: ROLE_STYLES[data.role].color 
                            }} />
                            <span className="font-medium">{data.fullTitle}</span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>查看次数：{data.views}</div>
                            <div>角色：{data.role === 'writer' ? '文案顾问' : '咨询顾问'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="views" 
                radius={[4, 4, 4, 4]}
                barSize={24}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ROLE_STYLES[entry.role].color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

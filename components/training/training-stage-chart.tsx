"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ROLE_STYLES, TRAINING_STAGE_STYLES } from "@/types/styles";
import { logger } from "@/lib/logger";

export interface TrainingStageData {
  stage: string;
  writer: number;
  consultant: number;
}

interface TrainingStageChartProps {
  title?: string;
  description?: string;
  footerText?: string;
  data?: TrainingStageData[];
  loading?: boolean;
  error?: string | null;
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
} satisfies ChartConfig;

const CustomBar = (props: any) => {
  const { fill, x, y, width, height, payload } = props;

  // 如果当前值为0，不渲染任何内容
  if (payload[props.dataKey] === 0) {
    return null;
  }

  // 判断是否是单独的柱子
  const isAlone =
    props.dataKey === "consultant" ? !payload.writer : !payload.consultant;

  // 设置圆角
  const radius =
    props.dataKey === "consultant"
      ? isAlone
        ? [4, 4, 4, 4]
        : [0, 0, 4, 4]
      : isAlone
        ? [4, 4, 4, 4]
        : [4, 4, 0, 0];

  return (
    <path
      d={`
        M ${x},${y + height}
        L ${x},${y + radius[0]}
        Q ${x},${y} ${x + radius[0]},${y}
        L ${x + width - radius[1]},${y}
        Q ${x + width},${y} ${x + width},${y + radius[1]}
        L ${x + width},${y + height - radius[2]}
        Q ${x + width},${y + height} ${x + width - radius[2]},${y + height}
        L ${x + radius[3]},${y + height}
        Q ${x},${y + height} ${x},${y + height - radius[3]}
        Z
      `}
      fill={fill}
    />
  );
};

export function TrainingStageChart({
  title = "培训阶段分布",
  description = "各阶段培训数量统计",
  footerText = "显示各阶段培训课程数量分布",
  data = [],
  loading = false,
  error = null,
}: TrainingStageChartProps) {
  // 记录图表渲染
  logger.debug("渲染培训阶段图表", {
    module: "TrainingStageChart",
    data: {
      title,
      hasData: !!data,
      dataLength: data?.length || 0,
      loading,
      error,
    },
  });

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
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-3 flex-col items-center gap-2 text-sm">
          <div className="w-48 h-4 bg-muted rounded animate-pulse" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data.length) {
    logger.debug("培训阶段图表无数据", {
      module: "TrainingStageChart",
    });
    return (
      <Card className="flex flex-col h-[300px]">
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  logger.debug("渲染图表数据", {
    module: "TrainingStageChart",
    data: {
      data,
    },
  });

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
                margin={{
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: 20,
                }}
              >
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                />
                <YAxis hide domain={[0, "dataMax"]} />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      labelKey="stage"
                      labelFormatter={(value, payload) => {
                        const stage = payload[0]?.payload?.stage;
                        return stage === "not_started"
                          ? "未开始"
                          : stage === "in_progress"
                            ? "进行中"
                            : stage === "completed"
                              ? "已完成"
                              : stage;
                      }}
                    />
                  }
                  cursor={false}
                />
                <Bar
                  dataKey="consultant"
                  stackId="a"
                  fill="var(--color-consultant)"
                  barSize={24}
                  shape={<CustomBar />}
                />
                <Bar
                  dataKey="writer"
                  stackId="a"
                  fill="var(--color-writer)"
                  barSize={24}
                  shape={<CustomBar />}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

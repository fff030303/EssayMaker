import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface AssessmentStatisticsProps {
  statistics: {
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    averageScore: number;
  };
  attempts: Array<{
    id: string;
    userId: string;
    name: string;
    startTime: string;
    endTime: string | null;
    totalScore: number | null;
    passed: boolean | null;
    duration: number | null;
  }>;
}

export function AssessmentStatistics({
  statistics,
  attempts,
}: AssessmentStatisticsProps) {
  // 添加分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 计算分页数据
  const totalAttempts = attempts.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttempts = attempts.slice(startIndex, endIndex);

  return (
    <div className="space-y-3">
      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">
            总考试次数
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {statistics.totalAttempts}
          </div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">
            通过次数
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {statistics.passedAttempts}
          </div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">
            通过率
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {statistics.passRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">
            平均分
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {statistics.averageScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* 答题记录 */}
      <h4 className="text-sm font-medium mb-2">答题记录</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户</TableHead>
            <TableHead>开始时间</TableHead>
            <TableHead>结束时间</TableHead>
            <TableHead>用时(分钟)</TableHead>
            <TableHead>得分</TableHead>
            <TableHead>是否通过</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentAttempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell>{attempt.name}</TableCell>
              <TableCell>
                {new Date(attempt.startTime).toLocaleString()}
              </TableCell>
              <TableCell>
                {attempt.endTime
                  ? new Date(attempt.endTime).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell>{attempt.duration || "-"}</TableCell>
              <TableCell>{attempt.totalScore || "-"}</TableCell>
              <TableCell>
                <Badge variant={attempt.passed ? "default" : "destructive"}>
                  {attempt.passed ? "通过" : "未通过"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataTablePagination
        totalItems={totalAttempts}
        pageSize={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

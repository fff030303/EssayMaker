import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface GenerationRecord {
  id: string;
  createdBy: string;
  createdAt: string;
  config: {
    questionCount: number;
    typeDistribution: {
      single: number;
      multiple: number;
      boolean: number;
      text: number;
    };
  };
  status: string;
}

export function GenerationHistory() {
  const [records, setRecords] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/questions/generation-history");
      if (!response.ok) {
        throw new Error("获取记录失败");
      }
      const data = await response.json();
      setRecords(data.records);
    } catch (error) {
      console.error("获取生成记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取主要题型
  const getMainQuestionType = (typeDistribution: Record<string, number>) => {
    try {
      // 如果是字符串，先解析JSON
      const distribution =
        typeof typeDistribution === "string"
          ? JSON.parse(typeDistribution)
          : typeDistribution;

      const mainType = Object.entries(distribution).find(
        ([_, value]) => value === 100
      )?.[0];

      const typeNameMap: Record<string, string> = {
        single: "单选题",
        multiple: "多选题",
        boolean: "判断题",
        text: "简答题",
      };

      return typeNameMap[mainType || "single"];
    } catch (error) {
      console.error("解析题型分布失败:", error);
      return "未知题型";
    }
  };

  // 获取状态标签样式
  const getStatusBadgeStyle = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800",
      processing: "bg-blue-100 text-blue-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  // 计算分页数据
  const totalRecords = records.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = records.slice(startIndex, endIndex);

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成历史</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">加载中...</div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>创建时间</TableHead>
                  <TableHead>创建者</TableHead>
                  <TableHead>题目数量</TableHead>
                  <TableHead>主要题型</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{record.createdBy}</TableCell>
                    <TableCell>{record.config.questionCount}</TableCell>
                    <TableCell>
                      {getMainQuestionType(record.config.typeDistribution)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeStyle(record.status)}>
                        {record.status === "completed" && "已完成"}
                        {record.status === "processing" && "生成中"}
                        {record.status === "failed" && "失败"}
                        {record.status === "pending" && "等待中"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <DataTablePagination
              totalItems={totalRecords}
              pageSize={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

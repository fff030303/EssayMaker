"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Upload, Download, Edit2, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import { z } from "zod";
import { interviewFormSchema } from "@/lib/validations/interview";
import type { StudyDegreeType } from "@/types/interview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

// Excel数据验证schema
const excelRowSchema = interviewFormSchema.extend({
  provider: z.string(),
  interviewDate: z.string(), // Excel中的日期是字符串
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

type ExcelRow = z.infer<typeof excelRowSchema>;

// 模板数据
const templateData = [
  {
    provider: "张三",
    country: "美国",
    university: "哈佛大学",
    program: "计算机科学硕士",
    majorCategory: "计算机",
    targetDegree: "MASTER",
    interviewDate: "2024-03-15",
    interviewContent: "面试内容...",
    status: "pending",
  },
];

// 列宽设置(单位:字符数)
const columnWidths = {
  provider: 10,
  country: 10,
  university: 15,
  program: 20,
  majorCategory: 10,
  targetDegree: 10,
  interviewDate: 12,
  interviewContent: 50,
  status: 10,
};

// 获取学历项目显示文本
const getDegreeText = (degree: StudyDegreeType) => {
  const degreeMap: Record<StudyDegreeType, string> = {
    UNDERGRADUATE: "本科",
    MASTER: "硕士",
    PHD: "博士",
    OTHER: "其他",
  };
  return degreeMap[degree];
};

export function InterviewImport() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<ExcelRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 检查是否是管理员
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin) {
    return null;
  }

  // 计算当前页的数据
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = previewData.slice(startIndex, endIndex);

  // 下载模板
  const handleDownloadTemplate = () => {
    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new();

      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(templateData);

      // 设置列宽
      ws["!cols"] = Object.values(columnWidths).map((width) => ({ width }));

      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, "面经模板");

      // 下载文件
      XLSX.writeFile(wb, "面经导入模板.xlsx");

      toast({
        title: "模板下载成功",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "模板下载失败",
        description: "请稍后重试",
      });
      console.error(error);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      // 阻止默认行为
      event.preventDefault();

      setIsUploading(true);
      console.log("开始上传文件...");

      const file = event.target.files?.[0];

      if (!file) {
        toast({
          variant: "destructive",
          title: "请选择文件",
        });
        return;
      }

      console.log("文件类型:", file.type);

      // 验证文件类型
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast({
          variant: "destructive",
          title: "请上传Excel文件(.xlsx或.xls)",
        });
        return;
      }

      // 读取Excel文件
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

      console.log("解析到的数据:", JSON.stringify(jsonData, null, 2));
      console.log("解析到的数据行数:", jsonData.length);

      // 验证数据
      const validatedData = [];
      const errors = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          console.log(`验证第 ${i + 1} 行数据:`, JSON.stringify(row, null, 2));

          // 处理日期格式
          let dateStr = row.interviewDate;
          if (typeof dateStr === "number" || /^\d{4}$/.test(dateStr)) {
            // 如果是年份数字或四位数年份字符串，转换为标准日期格式
            dateStr = `${dateStr}-01-01`;
          }

          // 验证日期格式
          const parsedDate = new Date(dateStr);
          if (isNaN(parsedDate.getTime())) {
            throw new Error("无效的日期格式");
          }

          // 转换为标准格式的日期字符串 YYYY-MM-DD
          const standardDateStr = parsedDate.toISOString().split("T")[0];

          // 验证数据
          const validatedRow = excelRowSchema.parse({
            ...row,
            interviewDate: standardDateStr,
          });

          validatedData.push(validatedRow);
        } catch (error) {
          console.error(`第 ${i + 2} 行验证错误:`, error);
          if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
              errors.push(
                `第 ${i + 2} 行 [${err.path.join(".")}]: ${err.message}`
              );
            });
          } else {
            errors.push(
              `第 ${i + 2} 行: ${error instanceof Error ? error.message : "数据无效"}`
            );
          }
        }
      }

      console.log("验证通过的数据行数:", validatedData.length);
      console.log("错误数:", errors.length);
      if (errors.length > 0) {
        console.log("验证错误详情:", errors);
      }

      // 如果有错误,显示错误信息
      if (errors.length > 0) {
        const errorList = errors.slice(0, 3).join("\n");
        const remaining = errors.length > 3 ? `\n等${errors.length}处错误` : "";

        toast({
          variant: "destructive",
          title: "数据格式有误",
          description: (
            <div className="flex flex-col gap-1.5">
              <div className="whitespace-pre-line text-sm">
                {errorList}
                {remaining}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                请下载模板查看所需字段格式
              </p>
            </div>
          ),
        });
        return;
      }

      if (jsonData.length === 0) {
        toast({
          variant: "destructive",
          title: "文件内容为空",
          description: "请确保Excel文件中包含数据",
        });
        return;
      }

      // 检查是否包含所需的所有字段
      const requiredFields = [
        "provider",
        "country",
        "university",
        "program",
        "majorCategory",
        "targetDegree",
        "interviewDate",
        "interviewContent",
      ];

      const missingFields = requiredFields.filter(
        (field) => !Object.keys(jsonData[0]).includes(field)
      );

      if (missingFields.length > 0) {
        toast({
          variant: "destructive",
          title: "缺少必填字段",
          description: (
            <div className="flex flex-col gap-1.5">
              <div className="whitespace-pre-line text-sm">
                {missingFields.join("\n")}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                请使用最新的Excel模板
              </p>
            </div>
          ),
        });
        return;
      }

      // 设置预览数据
      console.log("设置预览数据...");
      setPreviewData(validatedData);
      setShowUpload(false);
      setShowPreview(true);
      console.log("预览数据设置完成");

      // 重置文件输入
      event.target.value = "";
    } catch (error) {
      console.error("上传处理错误:", error);
      toast({
        variant: "destructive",
        title: "导入失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 处理确认导入
  const handleConfirmImport = async () => {
    try {
      setIsUploading(true);

      // 处理数据，确保格式正确
      const processedData = previewData.map((item) => {
        // 确保日期格式正确
        const date = new Date(item.interviewDate);
        if (isNaN(date.getTime())) {
          throw new Error(`无效的日期格式: ${item.interviewDate}`);
        }

        return {
          provider: item.provider,
          country: item.country,
          university: item.university,
          program: item.program,
          majorCategory: item.majorCategory,
          targetDegree: item.targetDegree,
          interviewDate: date,
          interviewContent: item.interviewContent,
          status: item.status || "pending",
        };
      });

      // 发送数据到API
      const response = await fetch("/api/interviews/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interviews: processedData }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("导入错误详情:", error);
        throw new Error(error.message || "导入失败");
      }

      const result = await response.json();
      toast({
        title: "导入成功",
        description: `成功导入 ${result.count} 条面经`,
      });

      // 重置状态
      setPreviewData([]);
      setShowPreview(false);
    } catch (error) {
      console.error("导入错误:", error);
      toast({
        variant: "destructive",
        title: "导入失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 处理编辑行
  const handleEditRow = (index: number) => {
    setEditingRow(index);
    setEditingData(previewData[index]);
  };

  // 处理删除行
  const handleDeleteRow = (index: number) => {
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
  };

  // 处理保存编辑
  const handleSaveEdit = (index: number) => {
    if (!editingData) return;

    try {
      // 验证编辑后的数据
      const validatedRow = excelRowSchema.parse(editingData);
      const newData = [...previewData];
      newData[index] = validatedRow;
      setPreviewData(newData);
      setEditingRow(null);
      setEditingData(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "数据验证失败",
      });
    }
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditingData(null);
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
        <Upload className="h-4 w-4 mr-2" />
        批量上传
      </Button>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>批量上传面经</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              请先下载模板，按照模板格式填写数据后上传。
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              下载Excel模板
            </Button>
            <div className="grid w-full items-center gap-1.5">
              <label
                htmlFor="excel-upload"
                className="w-full cursor-pointer rounded-md border border-dashed border-input bg-background px-6 py-8 text-center text-sm text-muted-foreground hover:bg-accent/50"
              >
                <Upload className="h-4 w-4 mx-auto mb-2" />
                <p>点击或拖拽文件到此处上传</p>
                <p className="text-xs mt-1">支持 .xlsx, .xls 格式</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  id="excel-upload"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>预览导入数据</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-hidden">
            <div
              className="overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full"
              style={{ maxHeight: "calc(90vh - 12rem)" }}
            >
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">基本信息</TableHead>
                      <TableHead className="w-[200px]">学校信息</TableHead>
                      <TableHead className="w-[400px]">面试内容</TableHead>
                      <TableHead className="w-[100px] text-right">
                        操作
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPageData.map((row, index) => (
                      <TableRow key={startIndex + index}>
                        {editingRow === startIndex + index ? (
                          <>
                            <TableCell className="align-top">
                              <div className="space-y-2">
                                <Input
                                  value={editingData?.provider}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      provider: e.target.value,
                                    })
                                  }
                                  placeholder="提供者"
                                  className="h-8"
                                />
                                <Input
                                  value={editingData?.country}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      country: e.target.value,
                                    })
                                  }
                                  placeholder="国家"
                                  className="h-8"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-2">
                                <Input
                                  value={editingData?.university}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      university: e.target.value,
                                    })
                                  }
                                  placeholder="学校"
                                  className="h-8"
                                />
                                <Input
                                  value={editingData?.program}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      program: e.target.value,
                                    })
                                  }
                                  placeholder="项目"
                                  className="h-8"
                                />
                                <Input
                                  value={editingData?.majorCategory}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      majorCategory: e.target.value,
                                    })
                                  }
                                  placeholder="专业类别"
                                  className="h-8"
                                />
                                <select
                                  value={editingData?.targetDegree}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      targetDegree: e.target
                                        .value as StudyDegreeType,
                                    })
                                  }
                                  className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="UNDERGRADUATE">本科</option>
                                  <option value="MASTER">硕士</option>
                                  <option value="PHD">博士</option>
                                  <option value="OTHER">其他</option>
                                </select>
                                <Input
                                  type="date"
                                  value={editingData?.interviewDate}
                                  onChange={(e) =>
                                    setEditingData({
                                      ...editingData!,
                                      interviewDate: e.target.value,
                                    })
                                  }
                                  className="h-8"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Input
                                value={editingData?.interviewContent}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    interviewContent: e.target.value,
                                  })
                                }
                                placeholder="面试内容"
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleSaveEdit(startIndex + index)
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="align-top py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {row.provider}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  · {row.country}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {row.university}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    · {row.program}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {row.majorCategory} ·{" "}
                                  {row.targetDegree === "UNDERGRADUATE"
                                    ? "本科"
                                    : row.targetDegree === "MASTER"
                                      ? "硕士"
                                      : row.targetDegree === "PHD"
                                        ? "博士"
                                        : "其他"}{" "}
                                  ·{" "}
                                  {new Date(
                                    row.interviewDate
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-2">
                              <div className="line-clamp-2 text-sm">
                                {row.interviewContent}
                              </div>
                            </TableCell>
                            <TableCell className="text-right align-top py-2">
                              <div className="space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditRow(startIndex + index)
                                  }
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteRow(startIndex + index)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <DataTablePagination
                totalItems={previewData.length}
                pageSize={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewData([]);
                    setShowPreview(false);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleConfirmImport} disabled={isUploading}>
                  {isUploading ? "导入中..." : "确认导入"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

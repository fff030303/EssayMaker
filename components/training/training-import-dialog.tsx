"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TrainingImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TrainingImportDialog({ open, onClose, onSuccess }: TrainingImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    rowCount: number;
    fileSize: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ row: number; field: string; message: string }>>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setValidationErrors([]);
    
    if (selectedFile) {
      // 检查文件类型
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        setError("请选择 Excel 文件 (.xlsx 或 .xls)");
        return;
      }

      try {
        // 读取文件内容预览
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);

        setFile(selectedFile);
        setPreviewData({
          rowCount: data.length,
          fileSize: (selectedFile.size / 1024).toFixed(2) + " KB",
        });
      } catch (err) {
        setError("无法读取文件内容，请检查文件格式是否正确");
        console.error(err);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch('/api/training/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setValidationErrors(result.details);
        } else {
          throw new Error(result.error || '导入失败');
        }
        return;
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入过程中出现错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`/api/training/template/training_template.xlsx`, '_blank');
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
    setValidationErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>批量导入培训</DialogTitle>
          <DialogDescription>
            请下载模板并按要求填写后上传
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              下载模板
            </Button>
          </div>

          <div className="space-y-2">
            <Label>选择 Excel 文件</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-bold mb-2">数据验证失败：</div>
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {previewData && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  文件大小: {previewData.fileSize}
                </div>
                <div>预计导入数据: {previewData.rowCount} 条</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "导入中..." : "开始导入"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
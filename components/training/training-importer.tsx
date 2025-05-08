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

interface TrainingImporterProps {
  type: "writer" | "consultant";
  onSuccess?: () => void;
}

export function TrainingImporter({ type, onSuccess }: TrainingImporterProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewData, setPreviewData] = useState<{
    rowCount: number;
    fileSize: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
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

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch('/api/training/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导入失败');
      }

      const result = await response.json();
      setShowConfirm(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入过程中出现错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // 根据不同角色类型下载对应的模板
    const templateName = type === 'writer' ? 'writer_template.xlsx' : 'consultant_template.xlsx';
    window.open(`/api/training/template/${templateName}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
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

      {previewData && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              文件大小: {previewData.fileSize}
            </div>
            <div>预计导入数据: {previewData.rowCount} 条</div>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowConfirm(true)}
            disabled={!file || loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            开始导入
          </Button>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入培训数据</DialogTitle>
            <DialogDescription>
              您正在导入{type === "writer" ? "文案顾问" : "咨询顾问"}培训数据，
              请确认以下信息：
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>文件: {file?.name}</span>
              </div>
              <div>文件大小: {previewData.fileSize}</div>
              <div>预计导入数据: {previewData.rowCount} 条</div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "导入中..." : "确认导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
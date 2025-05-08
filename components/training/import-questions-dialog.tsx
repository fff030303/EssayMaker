"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { QuestionInput, QuestionDifficulty } from "@/types/quiz";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

interface ImportQuestionsDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (questions: QuestionInput[]) => void;
  quizId?: string;
  trainingId?: string;
  isQuestionBank?: boolean;
}

export function ImportQuestionsDialog({
  open,
  onClose,
  onImport,
  quizId,
  trainingId,
  isQuestionBank,
}: ImportQuestionsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importType, setImportType] = useState<"word" | "excel">("word");
  const { toast } = useToast();

  // 解析文本为题目数组
  const parseText = (text: string): QuestionInput[] => {
    const questions: QuestionInput[] = [];
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let currentQuestion: Partial<QuestionInput> | null = null;
    let currentOptions: Array<{ value: string; label: string }> = [];
    let currentQuestionType: "single" | "multiple" | "boolean" = "single";
    let currentAnswer: string = ""; // 保存当前题目的答案

    // 添加计数器
    let singleCount = 0;
    let multipleCount = 0;
    let booleanCount = 0;

    for (let line of lines) {
      // 检查题型标记
      if (line.startsWith("##")) {
        if (line.includes("多选题")) {
          currentQuestionType = "multiple";
          console.log("切换到多选题");
        } else if (line.includes("判断题")) {
          currentQuestionType = "boolean";
          console.log("切换到判断题");
        } else {
          currentQuestionType = "single";
          console.log("切换到单选题");
        }
        continue;
      }

      // 检查是否是新题目的开始
      let questionMatch: RegExpMatchArray | null = null;

      if (currentQuestionType === "boolean") {
        // 判断题格式：#35 题目内容 {正确/错误}
        questionMatch = line.match(/^#(\d+)\s+(.+?)\s*\{(正确|错误)\}/);
      } else {
        // 选择题格式：#1 题目内容{A} 或 #21 题目内容{ABCD}
        questionMatch = line.match(/^#(\d+)\s+(.+?)\{([A-E]+)\}/);
      }

      if (questionMatch) {
        // 记录题号
        const questionNumber = parseInt(questionMatch[1]);
        console.log(`解析题目 #${questionNumber}`);

        // 如果有未完成的题目，先保存
        if (currentQuestion?.content && currentQuestion.type) {
          // 如果是选择题，将选项转换为正确的格式
          if (currentOptions.length > 0 && currentQuestion.type !== "boolean") {
            // 保存选项到 options 字段
            currentQuestion.options = JSON.stringify(currentOptions);

            if (currentQuestion.type === "single") {
              // 单选题只保存选中的值
              currentQuestion.answer = currentAnswer;
            } else if (currentQuestion.type === "multiple") {
              // 多选题保存选中的值数组
              currentQuestion.answer = currentAnswer;
            }
          }
          questions.push(currentQuestion as QuestionInput);

          // 更新计数
          if (currentQuestion.type === "single") singleCount++;
          else if (currentQuestion.type === "multiple") multipleCount++;
          else if (currentQuestion.type === "boolean") booleanCount++;

          currentOptions = []; // 重置选项
        }

        // 开始新题目
        currentAnswer =
          currentQuestionType === "boolean"
            ? questionMatch[3] === "正确"
              ? "true"
              : "false" // 判断题答案转换
            : questionMatch[3]; // 选择题答案

        currentQuestion = {
          content: questionMatch[2].trim(),
          type: currentQuestionType,
          answer: currentQuestionType === "boolean" ? currentAnswer : "", // 选择题答案先留空
          explanation: "",
          score: 10,
        };
        continue;
      }

      // 如果当前没有处理中的题目，跳过
      if (!currentQuestion) continue;

      // 只有选择题才需要处理选项
      if (currentQuestionType !== "boolean") {
        // 检查是否是选项
        const optionMatch = line.match(/^([A-E])\s+(.+)/);
        if (optionMatch) {
          currentOptions.push({
            value: optionMatch[1],
            label: optionMatch[2].trim(),
          });
          continue;
        }
      }
    }

    // 保存最后一个题目
    if (currentQuestion?.content && currentQuestion.type) {
      if (currentOptions.length > 0 && currentQuestion.type !== "boolean") {
        // 保存选项到 options 字段
        currentQuestion.options = JSON.stringify(currentOptions);

        if (currentQuestion.type === "single") {
          // 单选题只保存选中的值
          currentQuestion.answer = currentAnswer;
        } else if (currentQuestion.type === "multiple") {
          // 多选题保存选中的值数组
          currentQuestion.answer = currentAnswer;
        }
      }
      questions.push(currentQuestion as QuestionInput);

      // 更新最后一题的计数
      if (currentQuestion.type === "single") singleCount++;
      else if (currentQuestion.type === "multiple") multipleCount++;
      else if (currentQuestion.type === "boolean") booleanCount++;
    }

    console.log(
      `解析完成：单选题 ${singleCount} 道，多选题 ${multipleCount} 道，判断题 ${booleanCount} 道，总计 ${questions.length} 道题`
    );

    return questions;
  };

  // 添加 parseOptions 函数实现
  const parseOptions = (optionsStr: string) => {
    try {
      const options = optionsStr.split("\n").map((line, index) => ({
        value: String.fromCharCode(65 + index), // A, B, C, D...
        label: line.trim(),
      }));
      return options;
    } catch (error) {
      console.error("解析选项失败:", error);
      return [];
    }
  };

  // 解析Excel文件
  const parseExcel = async (file: File): Promise<QuestionInput[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log("Excel 原始数据:", data);

    const questions: QuestionInput[] = (data as Array<Record<string, any>>).map(
      (row) => {
        const type = row["题型(必填)"]?.toLowerCase();
        let questionType: "single" | "multiple" | "boolean" | "text";

        if (type?.includes("判断")) {
          questionType = "boolean";
        } else if (type?.includes("单选")) {
          questionType = "single";
        } else if (type?.includes("多选")) {
          questionType = "multiple";
        } else {
          throw new Error(
            `不支持的题目类型: ${type}，请使用"单选题"、"多选题"或"判断题"`
          );
        }

        console.log("当前题目类型:", type, "转换后的类型:", questionType);

        const question: QuestionInput = {
          id: crypto.randomUUID(),
          type: questionType,
          content: row["题目内容(必填)"] as string,
          options:
            questionType === "boolean"
              ? JSON.stringify([
                  { value: "true", label: "正确" },
                  { value: "false", label: "错误" },
                ])
              : JSON.stringify(
                  ["选项A", "选项B", "选项C", "选项D", "选项E"]
                    .map((key, index) => ({
                      value: String.fromCharCode(65 + index), // A, B, C, D, E
                      label: row[key]?.toString().trim(),
                    }))
                    .filter((option) => option.label) // 过滤掉空选项
                ),
          answer:
            questionType === "boolean"
              ? row["答案(必填)"] === "正确"
                ? "true"
                : "false"
              : (row["答案(必填)"] as string),
          explanation: row["解释(选填)"] || "",
          score: Number(row["分值(选填)"]) || 10,
          difficulty: (row["难度(必填)"]?.toLowerCase() === "简单"
            ? "easy"
            : row["难度(必填)"]?.toLowerCase() === "困难"
              ? "hard"
              : "medium") as QuestionDifficulty,
          trainingTitle: row["培训标题(必填)"] as string,
        };

        console.log("解析后的题目:", question);
        return question;
      }
    );

    return questions;
  };

  // 下载Excel模板
  const handleDownloadTemplate = () => {
    window.open("/api/quiz/template/questions.xlsx", "_blank");
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件类型
      const isWord = selectedFile.name.match(/\.(doc|docx)$/);
      const isExcel = selectedFile.name.match(/\.(xlsx|xls)$/);

      if (importType === "word" && !isWord) {
        toast({
          title: "文件格式错误",
          description: "请上传Word文档(.doc或.docx格式)",
          variant: "destructive",
        });
        return;
      }

      if (importType === "excel" && !isExcel) {
        toast({
          title: "文件格式错误",
          description: "请上传Excel文件(.xlsx或.xls格式)",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  // 处理确认导入
  const handleConfirmImport = async () => {
    if (!file) return;

    setParsing(true);
    try {
      let questions: QuestionInput[];

      if (importType === "word") {
        // 现有的Word文档解析逻辑
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        questions = parseText(result.value);
      } else {
        // 新增的Excel解析逻辑
        questions = await parseExcel(file);
      }

      if (questions.length === 0) {
        toast({
          title: "解析失败",
          description: "未能从文件中解析出任何题目，请检查文件格式是否正确",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "解析成功",
        description: `成功解析出 ${questions.length} 道题目`,
      });

      onImport(questions);
      onClose();
    } catch (error) {
      console.error("解析文件失败:", error);
      toast({
        title: "解析失败",
        description:
          error instanceof Error ? error.message : "请检查文件格式是否正确",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>批量导入题目</DialogTitle>
          <DialogDescription>支持Word文档或Excel文件导入题目</DialogDescription>
        </DialogHeader>

        {/* 导入方式选择 */}
        <div className="space-y-2">
          <Label>导入方式</Label>
          <RadioGroup
            value={importType}
            onValueChange={(value: "word" | "excel") => {
              setImportType(value as "word" | "excel");
              setFile(null);
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="word" id="word" />
              <Label htmlFor="word">Word文档</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label htmlFor="excel">Excel文件</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Excel模板下载 */}
        {importType === "excel" && (
          <div>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              下载Excel模板
            </Button>
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
          <Input
            type="file"
            accept={importType === "word" ? ".doc,.docx" : ".xlsx,.xls"}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-2 py-8 px-4 w-full"
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {parsing
                ? "解析中..."
                : file
                  ? file.name
                  : "点击或拖拽文件到此处"}
            </span>
            <span className="text-xs text-muted-foreground mt-2">
              支持
              {importType === "word"
                ? ".doc或.docx格式的Word文档"
                : ".xlsx或.xls格式的Excel文件"}
            </span>
          </Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button disabled={parsing || !file} onClick={handleConfirmImport}>
            {parsing ? "解析中..." : "确认导入"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

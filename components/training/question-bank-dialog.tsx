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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Question, QuestionInput } from "@/types/quiz";
import { QuestionList } from "@/components/question-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RandomQuestionForm } from "./random-question-form";

interface QuestionBankDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (questions: Question[]) => void;
  excludeQuestionIds?: string[];
}

export function QuestionBankDialog({
  open,
  onClose,
  onSelect,
  excludeQuestionIds = [],
}: QuestionBankDialogProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

  // 处理确认选择
  const handleConfirm = () => {
    onSelect(selectedQuestions);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>从题库抽取题目</DialogTitle>
          <DialogDescription>选择要添加到考试的题目</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="manual">
              <TabsList className="mb-4">
                <TabsTrigger value="manual">手动选题</TabsTrigger>
                <TabsTrigger value="random">随机抽题</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <QuestionList
                  mode="select"
                  excludeQuestionIds={excludeQuestionIds}
                  onSelectionChange={setSelectedQuestions}
                  open={open}
                />
              </TabsContent>

              <TabsContent value="random">
                <RandomQuestionForm
                  onSelect={onSelect}
                  excludeQuestionIds={excludeQuestionIds}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedQuestions.length === 0}
            >
              确认添加 ({selectedQuestions.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

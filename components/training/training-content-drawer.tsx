"use client";

import { TrainingNode } from "@/types/training";
import { Quiz } from "@/types/quiz";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Tag,
  FileText,
  BookOpenCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { QuizDrawer } from "@/components/quiz-drawer";

interface TrainingContentDrawerProps {
  node: TrainingNode;
  open: boolean;
  onClose: () => void;
}

export function TrainingContentDrawer({
  node,
  open,
  onClose,
}: TrainingContentDrawerProps) {
  const [showQuiz, setShowQuiz] = useState(false);

  const handleOpenContent = () => {
    if (node.url && node.url.length > 0) {
      window.open(node.url[0], "_blank");
    }
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className={cn("p-0", showQuiz && "!translate-x-[-100%] duration-300")}
        >
          {/* 顶部导航栏 */}
          <div className="sticky top-0 z-50 bg-background border-b">
            <div className="px-6 py-4">
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl font-semibold truncate flex items-center gap-3">
                      <span className="text-2xl">{node.emoji}</span>
                      {node.title}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>
            </div>
          </div>

          {/* 主要内容区域 */}
          <ScrollArea className="h-[calc(100vh-8rem)] px-6">
            <div className="py-6 space-y-6">
              {/* 标签组 */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {node.business_module}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {node.country}
                </Badge>
                {node.quizzes && node.quizzes.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {node.quizzes.length} 个考试
                  </Badge>
                )}
              </div>

              {/* 描述信息 */}
              {node.description && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>培训描述</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {node.description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 两个卡片并排显示 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 内容按钮 */}
                {node.url && node.url.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                        <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                        <span>培训内容</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="text-sm text-center text-muted-foreground">
                          点击下方按钮查看培训内容
                        </div>
                        <Button
                          onClick={handleOpenContent}
                          className="gap-2"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          查看培训内容
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 考试按钮 */}
                {node.quizzes && node.quizzes.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span>培训考试</span>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="text-sm text-center text-muted-foreground">
                          完成培训后，请参加考试检验学习效果，共{" "}
                          {node.quizzes.length} 个考试需要完成
                        </div>
                        <Button
                          onClick={() => setShowQuiz(true)}
                          className="gap-2"
                        >
                          <GraduationCap className="h-4 w-4" />
                          开始考试
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* 底部操作栏 */}
          <div className="h-4" />
        </SheetContent>
      </Sheet>

      {node.quizzes && node.quizzes.length > 0 && (
        <QuizDrawer
          node={{
            ...node,
            quizzes: node.quizzes.filter((quiz) => quiz.status === "active"),
          }}
          open={showQuiz}
          onClose={handleQuizClose}
        />
      )}
    </>
  );
}

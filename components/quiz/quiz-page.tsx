"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import { QuizForm } from "./quiz-form";
import { QuizList } from "./quiz-list";
import { Quiz } from "@/types/quiz";
import { Toaster } from "@/components/ui/toaster";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface QuizPageProps {
  trainingId?: string;
}

export function QuizPage({ trainingId }: QuizPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    // 如果用户是普通用户，重定向到首页
    if (session?.user?.role === "user") {
      router.push("/");
    }
  }, [session, router]);

  // 如果用户是普通用户，不渲染内容
  if (session?.user?.role === "user") {
    return null;
  }

  const handleQuizSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>测验管理</CardTitle>
              <CardDescription>创建和管理培训测验</CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建测验
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <QuizList
            key={refreshKey}
            trainingId={trainingId}
            onEdit={(quiz: Quiz) => {
              setEditingQuiz(quiz);
              setShowForm(true);
            }}
          />
        </CardContent>
      </Card>

      <QuizForm
        open={showForm}
        quiz={editingQuiz}
        trainingId={trainingId}
        onClose={() => {
          setShowForm(false);
          setEditingQuiz(undefined);
        }}
        onSaved={handleQuizSaved}
      />

      <Toaster />
    </div>
  );
}

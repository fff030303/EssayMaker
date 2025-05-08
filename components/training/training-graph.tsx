import { Button } from "@/components/ui/button";
import { BookOpen, PenSquare, GraduationCap } from "lucide-react";
import Link from "next/link";
import { TrainingNode } from "@/types/training";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QuizDrawer } from "@/components/quiz-drawer";

interface TrainingGraphProps {
  node: TrainingNode;
}

export function TrainingGraph({ node }: TrainingGraphProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showQuizDrawer, setShowQuizDrawer] = useState(false);

  // 确保只有管理员和内容管理员可以看到管理考试按钮
  const canManageQuiz =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  return (
    <>
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={
                Array.isArray(node.url) && node.url.length > 0
                  ? node.url[0]
                  : "#"
              }
              target="_blank"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              查看培训
            </Link>
          </Button>
          {node.quizzes && node.quizzes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuizDrawer(true)}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              开始考试
            </Button>
          )}
        </div>
        {canManageQuiz && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/console/training/${node.id}/quiz`)}
          >
            <PenSquare className="h-4 w-4 mr-2" />
            管理考试
          </Button>
        )}
      </div>

      <QuizDrawer
        node={{
          ...node,
          quizzes: node.quizzes?.filter((quiz) => quiz.status === "active"),
        }}
        open={showQuizDrawer}
        onClose={() => setShowQuizDrawer(false)}
      />
    </>
  );
}

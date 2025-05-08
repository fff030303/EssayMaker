import { Button } from "@/components/ui/button";
import { BookOpen, PenSquare } from "lucide-react";
import Link from "next/link";
import { TrainingNode } from "@/types/training";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface TrainingNodeActionsProps {
  node: TrainingNode;
}

export function TrainingNodeActions({ node }: TrainingNodeActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // 确保只有管理员和内容管理员可以看到管理考试按钮
  const canManageQuiz =
    session?.user?.role === "admin" ||
    session?.user?.role === "content_manager";

  return (
    <div className="flex justify-between items-center mt-4">
      <Button variant="ghost" size="sm" asChild>
        <Link
          href={
            Array.isArray(node.url) && node.url.length > 0 ? node.url[0] : "#"
          }
          target="_blank"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          查看培训
        </Link>
      </Button>
      {canManageQuiz && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/console/quiz?trainingId=${node.id}`)}
        >
          <PenSquare className="h-4 w-4 mr-2" />
          管理考试
        </Button>
      )}
    </div>
  );
}

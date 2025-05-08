"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  GraduationCap,
  MessageCircle,
  Share2,
  Bookmark,
  Link,
  Star,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { TrainingNode, TrainingData } from "@/types/training";
import {
  COUNTRY_STYLES,
  BUSINESS_MODULE_STYLES,
  SERVICE_TYPE_STYLES,
  TRAINING_STAGE_STYLES,
  getNewCountryStyle,
  CountryStylesType,
  TrainingStageStylesType,
  BusinessModuleStylesType,
  StyleConfig,
  ServiceTypeStylesType,
} from "@/types/styles";
import { QuizDrawer } from "@/components/quiz-drawer";
import { TrainingContentDrawer } from "./training-content-drawer";
import { logger } from "@/lib/logger";
import { Ribbon } from "@/components/ui/ribbon";
import { useQueryClient } from "@tanstack/react-query";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface TrainingMapProps {
  data: TrainingData;
  layout?: "horizontal" | "vertical";
  onNodeClick?: (node: TrainingNode) => void;
  levelNames: readonly string[];
  isLoading?: boolean;
}

export function TrainingMap({
  data,
  layout = "horizontal",
  onNodeClick,
  levelNames,
  isLoading = false,
}: TrainingMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TrainingNode | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const queryClient = useQueryClient();

  // 初始化 bookmarkedNodes,使用 data.nodes 中的 isBookmarked 状态
  const [bookmarkedNodes, setBookmarkedNodes] = useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    data.nodes.forEach((node) => {
      // 确保使用布尔值，并且明确检查 isBookmarked 字段
      initialState[node.id] = node.isBookmarked === true;
    });
    return initialState;
  });

  // 当 data 变化时更新 bookmarkedNodes
  useEffect(() => {
    const newState: Record<string, boolean> = {};
    data.nodes.forEach((node) => {
      // 确保使用布尔值，并且明确检查 isBookmarked 字段
      newState[node.id] = node.isBookmarked === true;
    });
    setBookmarkedNodes(newState);
  }, [data]);

  // 添加缓存更新处理
  useEffect(() => {
    // 监听缓存更新
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // 获取最新的训练数据
      const queryData = queryClient.getQueryData<any>(["trainings"]);
      if (queryData) {
        const pages = queryData.pages || [];
        const newState: Record<string, boolean> = { ...bookmarkedNodes };

        // 更新收藏状态
        pages.forEach((page: any) => {
          page.data.forEach((node: any) => {
            if (node.id && typeof node.isBookmarked === "boolean") {
              newState[node.id] = node.isBookmarked;
            }
          });
        });

        setBookmarkedNodes(newState);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // // 记录数据加载
  // logger.debug("加载培训图谱数据", {
  //   module: "TrainingMap",
  //   data: {
  //     nodesCount: data.nodes.length,
  //     linksCount: data.links.length,
  //     firstNode: data.nodes[0]
  //       ? {
  //           id: data.nodes[0].id,
  //           title: data.nodes[0].title,
  //           quizCount: data.nodes[0].quizzes?.length || 0,
  //         }
  //       : null,
  //   },
  // });

  // 获取国家的颜色样式
  const getCountryStyle = (country: string): StyleConfig => {
    const countryKey = country as keyof CountryStylesType;
    return COUNTRY_STYLES[countryKey] || COUNTRY_STYLES["通用"];
  };

  // 获取业务模块的颜色样式
  const getBusinessModuleStyle = (module: string): StyleConfig => {
    const moduleKey = module as keyof BusinessModuleStylesType;
    return (
      BUSINESS_MODULE_STYLES[moduleKey] || {
        color: "#64748b",
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        hover: "hover:bg-slate-100",
      }
    );
  };

  // 获取培训阶段的颜色样式
  const getTrainingStageStyle = (stage: number): StyleConfig => {
    const stageKey = stage as keyof TrainingStageStylesType;
    return TRAINING_STAGE_STYLES[stageKey] || TRAINING_STAGE_STYLES[0];
  };

  // 获取服务类型的颜色样式
  const getServiceTypeStyle = (serviceType: string): StyleConfig => {
    const serviceTypeKey = serviceType as keyof ServiceTypeStylesType;
    return (
      SERVICE_TYPE_STYLES[serviceTypeKey] || {
        color: "#64748b",
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        hover: "hover:bg-slate-100",
      }
    );
  };

  // 按培训阶段对节点进行分组
  const stageGroups = useMemo(() => {
    const groups = new Map<number, TrainingNode[]>();
    data.nodes.forEach((node) => {
      const stage = node.training_stage;
      if (!groups.has(stage)) {
        groups.set(stage, []);
      }
      groups.get(stage)!.push(node);
    });
    return groups;
  }, [data.nodes]);

  // 获取最大培训阶段
  const maxStage = useMemo(() => {
    return Math.max(...Array.from(stageGroups.keys()), 0);
  }, [stageGroups]);

  // 处理节点点击
  const handleNodeClick = async (node: TrainingNode) => {
    setSelectedNode(node);

    // 如果有URL，打开内容抽屉
    if (node.url) {
      setShowContent(true);
    }

    // 记录查看数据
    try {
      const response = await fetch("/api/training/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trainingId: node.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record view");
      }
    } catch (error) {
      console.error("Failed to record training view:", error);
    }
  };

  const renderNode = (node: TrainingNode) => {
    const hasQuiz = node.quizzes && node.quizzes.length > 0;

    return (
      <Card
        key={node.id}
        className={cn(
          "w-full max-w-2xl mx-auto",
          "bg-white dark:bg-zinc-900",
          "border border-zinc-200 dark:border-zinc-800",
          "rounded-3xl shadow-xl",
          "flex flex-col",
          hoveredNode === node.id && "ring-2 ring-primary/20"
        )}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <CardContent className="p-6 flex flex-col flex-1">
          {/* 头部区域 - 放大标题和标签区域（蓝色框） */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Emoji 头像 */}
              <div className="w-12 h-12 rounded-full ring-2 ring-white dark:ring-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <span className="text-2xl">{node.emoji}</span>
              </div>
              {/* 标题和标签 - 增大字体和间距 */}
              <div>
                <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {node.title}
                </h3>
                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  {node.country && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-2 h-6 leading-none flex items-center",
                        getCountryStyle(node.country).bg,
                        getCountryStyle(node.country).text,
                        getCountryStyle(node.country).border
                      )}
                    >
                      {node.country}
                    </Badge>
                  )}
                  {node.service_type && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs px-2 h-6 leading-none flex items-center",
                        getServiceTypeStyle(node.service_type).bg,
                        getServiceTypeStyle(node.service_type).text,
                        getServiceTypeStyle(node.service_type).border
                      )}
                    >
                      {node.service_type}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2 h-6 leading-none flex items-center",
                      getBusinessModuleStyle(node.business_module).bg,
                      getBusinessModuleStyle(node.business_module).text,
                      getBusinessModuleStyle(node.business_module).border
                    )}
                  >
                    {node.business_module}
                  </Badge>
                </div>
              </div>
            </div>
            {/* NEW/HOT 标签 */}
            <div className="flex gap-1">
              {(node.isNew || node.ribbonType === "new") && (
                <Ribbon variant="new" />
              )}
              {(node.isHot || node.ribbonType === "hot") && (
                <Ribbon variant="hot" />
              )}
              {node.ribbonType === "custom" && (
                <Ribbon variant="custom" text={node.ribbonText} />
              )}
            </div>
          </div>

          {/* 内容区域 - 添加flex-1使其自适应填充空间 */}
          <div className="flex-1">
            {/* 描述区域 - 减小描述文本字体 (绿色框部分) */}
            {node.description && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <p
                    className={cn(
                      "text-xs text-zinc-600 dark:text-zinc-300 mb-3",
                      "line-clamp-2",
                      "cursor-help"
                    )}
                  >
                    {node.description}
                  </p>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {node.description}
                  </p>
                </HoverCardContent>
              </HoverCard>
            )}

            {/* 培训内容链接 - 缩小课件链接区域 (绿色框部分) */}
            {Array.isArray(node.url) && node.url.length > 0 && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
                  {node.url.map((url: string, index: number) => (
                    <div
                      key={index}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetch("/api/training/view", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              trainingId: node.id,
                            }),
                          });
                        } catch (error) {
                          console.error(
                            "Failed to record training view:",
                            error
                          );
                        }
                        window.open(url, "_blank");
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700/50 cursor-pointer"
                    >
                      <div className="p-1 bg-white dark:bg-zinc-700 rounded-lg">
                        <Link className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300 hover:text-primary">
                        课件{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部互动区域 - 只保留上边距 */}
          <div className="flex items-center justify-between mt-4">
            {/* 考试按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-2 text-zinc-500 dark:text-zinc-400",
                hasQuiz
                  ? "hover:text-green-500 dark:hover:text-green-400"
                  : "pointer-events-none opacity-50"
              )}
              onClick={(e) => {
                if (!hasQuiz) return;
                e.stopPropagation();
                setSelectedNode(node);
                setShowQuiz(true);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">
                {node.quizzes?.length || 0} 个测验
              </span>
            </Button>

            {/* 收藏按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "p-2 rounded-full transition-all",
                Boolean(bookmarkedNodes[node.id])
                  ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10"
                  : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
              onClick={async (e) => {
                e.stopPropagation();

                // 立即更新本地状态
                const currentState = Boolean(bookmarkedNodes[node.id]);
                setBookmarkedNodes((prev) => ({
                  ...prev,
                  [node.id]: !currentState,
                }));

                try {
                  const response = await fetch("/api/training/bookmark", {
                    method: currentState ? "DELETE" : "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      trainingId: node.id,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("更新收藏状态失败");
                  }

                  const result = await response.json();
                  const isBookmarked = Boolean(result.data);

                  // 更新本地状态
                  setBookmarkedNodes((prev) => ({
                    ...prev,
                    [node.id]: isBookmarked,
                  }));

                  // 使相关查询失效
                  await queryClient.invalidateQueries({
                    queryKey: ["trainings", { bookmarked: true }],
                  });

                  // 显示成功提示
                  toast({
                    title: isBookmarked ? "已收藏" : "已取消收藏",
                    description: isBookmarked
                      ? "培训已添加到收藏夹"
                      : "培训已从收藏夹移除",
                  });
                } catch (error) {
                  // 发生错误时恢复本地状态
                  setBookmarkedNodes((prev) => ({
                    ...prev,
                    [node.id]: currentState,
                  }));

                  console.error("更新收藏状态失败:", error);
                  toast({
                    variant: "destructive",
                    title: "更新收藏状态失败",
                    description:
                      error instanceof Error ? error.message : "请重试",
                  });
                }
              }}
            >
              <Star
                className={cn(
                  "w-5 h-5 transition-transform",
                  Boolean(bookmarkedNodes[node.id]) && "fill-current scale-110"
                )}
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ScrollArea className="h-full w-full">
      <div
        className={cn(
          "p-6 min-w-0",
          layout === "horizontal" ? "space-y-8" : "flex gap-8"
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-32 flex items-center justify-center"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              {Array.from({ length: maxStage + 1 }).map((_, stage) => {
                const nodes = stageGroups.get(stage) || [];
                if (nodes.length === 0) return null;

                return (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: stage * 0.1 }}
                    className={cn(
                      "min-w-0",
                      layout === "horizontal"
                        ? "space-y-4 mb-16"
                        : "min-w-[300px]"
                    )}
                  >
                    {/* 阶段标题 */}
                    <div className="flex items-center gap-2 flex-wrap mt-8 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-medium shrink-0">
                        {stage + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-600">
                        {levelNames[stage] || `第 ${stage + 1} 阶段`}
                      </div>
                      <div className="text-xs text-gray-400">
                        ({nodes.length} 个课程)
                      </div>
                    </div>

                    {/* 节点卡片网格 */}
                    <div
                      className={cn(
                        "gap-4",
                        layout === "horizontal"
                          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
                          : "flex flex-col"
                      )}
                    >
                      {nodes.map((node) => (
                        <motion.div
                          key={node.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          {renderNode(node)}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 考试抽屉 */}
      {selectedNode && (
        <QuizDrawer
          node={{
            ...selectedNode,
            quizzes: selectedNode.quizzes?.filter(
              (quiz) => quiz.status === "active"
            ),
          }}
          open={showQuiz}
          onClose={() => {
            setShowQuiz(false);
            setSelectedNode(null);
          }}
        />
      )}

      {/* 培训内容抽屉 */}
      {selectedNode && (
        <TrainingContentDrawer
          node={{
            ...selectedNode,
            quizzes: selectedNode.quizzes?.filter(
              (quiz) => quiz.status === "active"
            ),
          }}
          open={showContent}
          onClose={() => {
            setShowContent(false);
            setSelectedNode(null);
          }}
        />
      )}
    </ScrollArea>
  );
}

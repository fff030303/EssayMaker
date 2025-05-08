"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Search,
  Trash2,
  Clock,
  Users,
  GraduationCap,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  COUNTRY_STYLES,
  ROLE_STYLES,
  TRAINING_STAGE_STYLES,
  BUSINESS_MODULE_STYLES,
} from "@/types/styles";

// 模拟数据
const MOCK_TRAININGS = [
  {
    id: "writer-1",
    title: "工具使用-OA",
    type: "writer",
    level: 0,
    quizzes: [
      {
        id: "1",
        title: "文案基础知识测试",
        description: "考察文案写作的基本概念和技巧",
        timeLimit: 30,
        passingScore: 80,
        questionsCount: 10,
        attemptsCount: 25,
        passRate: 85,
        status: "active",
      },
    ],
  },
  {
    id: "consultant-1",
    title: "咨询顾问入门培训",
    type: "consultant",
    level: 0,
    quizzes: [
      {
        id: "3",
        title: "咨询基础理论测试",
        description: "考察咨询行业的基础知识",
        timeLimit: 40,
        passingScore: 75,
        questionsCount: 15,
        attemptsCount: 32,
        passRate: 90,
        status: "active",
      },
    ],
  },
];

export function EnhancedQuizManager() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 切换行展开/收起
  const toggleRow = (trainingId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(trainingId)) {
      newExpandedRows.delete(trainingId);
    } else {
      newExpandedRows.add(trainingId);
    }
    setExpandedRows(newExpandedRows);
  };

  // 获取培训类型文本
  const getTrainingTypeText = (type: string) => {
    if (type === "writer") return "文案顾问";
    if (type === "consultant") return "咨询顾问";
    return "未知类型";
  };

  // 获取培训类型样式
  const getTrainingTypeBadgeStyle = (type: string) => {
    const style = ROLE_STYLES[type as keyof typeof ROLE_STYLES];
    if (!style) return "bg-slate-50 text-slate-700";
    return `${style.bg} ${style.text}`;
  };

  // 获取培训阶段样式
  const getLevelBadgeStyle = (level: number) => {
    const style =
      TRAINING_STAGE_STYLES[level as keyof typeof TRAINING_STAGE_STYLES];
    if (!style) return "bg-slate-50 text-slate-700";
    return `${style.bg} ${style.text}`;
  };

  // 获取培训阶段文本
  const getLevelText = (level: number) => {
    switch (level) {
      case 0:
        return "入门培训";
      case 1:
        return "中级培训";
      case 2:
        return "专业培训";
      case 3:
        return "进阶培训";
      default:
        return "未知阶段";
    }
  };

  return (
    <div className="h-full space-y-6">
      {/* 页面头部 */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">培训测验管理</h2>
        <p className="text-sm text-muted-foreground">
          管理培训相关的测验内容和配置
        </p>
      </div>

      {/* 主要内容区 */}
      <div className="flex flex-col space-y-6">
        {/* 筛选器 */}
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:space-x-4">
          <div className="flex-none w-[180px]">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="培训类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="writer">文案顾问</SelectItem>
                <SelectItem value="consultant">咨询顾问</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-none w-[180px]">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="培训阶段" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有阶段</SelectItem>
                <SelectItem value="0">入门培训</SelectItem>
                <SelectItem value="1">中级培训</SelectItem>
                <SelectItem value="2">专业培训</SelectItem>
                <SelectItem value="3">进阶培训</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索培训或测验..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </div>

        {/* 培训列表 */}
        <ScrollArea className="rounded-md border">
          <div className="divide-y">
            {MOCK_TRAININGS.map((training) => {
              console.log("Rendering training:", training);
              return (
                <div key={training.id} className="divide-y">
                  {/* 培训信息行 */}
                  <div
                    className="group relative p-4 hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => toggleRow(training.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                getTrainingTypeBadgeStyle(training.type)
                              )}
                            >
                              {getTrainingTypeText(training.type)}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn(getLevelBadgeStyle(training.level))}
                            >
                              {getLevelText(training.level)}
                            </Badge>
                          </div>
                          <h4 className="text-lg font-semibold">
                            {training.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span>{training.quizzes.length} 个测验</span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 处理新建测验
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          新建测验
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(training.id);
                          }}
                        >
                          {expandedRows.has(training.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 测验列表 */}
                  <AnimatePresence>
                    {expandedRows.has(training.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="divide-y bg-accent/50">
                          {training.quizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="p-4 hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h5 className="font-medium">{quiz.title}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {quiz.description}
                                  </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Switch
                                        checked={quiz.status === "active"}
                                        onCheckedChange={() => {}}
                                      />
                                    </HoverCardTrigger>
                                    <HoverCardContent
                                      side="left"
                                      className="w-40"
                                    >
                                      <div className="text-sm">
                                        {quiz.status === "active"
                                          ? "点击禁用测验"
                                          : "点击启用测验"}
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    时间限制
                                  </p>
                                  <p className="font-medium">
                                    {quiz.timeLimit} 分钟
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    通过分数
                                  </p>
                                  <p className="font-medium">
                                    {quiz.passingScore} 分
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <GraduationCap className="h-4 w-4" />
                                    题目数量
                                  </p>
                                  <p className="font-medium">
                                    {quiz.questionsCount} 题
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-muted-foreground flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    答题统计
                                  </p>
                                  <p className="font-medium">
                                    {quiz.attemptsCount} 次 / {quiz.passRate}%
                                    通过
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

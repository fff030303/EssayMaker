"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Edit,
  Search,
  Trash2,
  Clock,
  Users,
  GraduationCap,
  CheckCircle2,
  Plus,
  X,
  Upload,
  Target,
  ListChecks,
  Database,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuizFormDialog } from "./quiz-form-dialog";
import { TrainingFormDialog } from "./training-form-dialog";
import { TrainingImportDialog } from "./training-import-dialog";
import { Quiz, Training } from "@/types/quiz";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  COUNTRY_STYLES,
  ROLE_STYLES,
  TRAINING_STAGE_STYLES,
  BUSINESS_MODULE_STYLES,
  SERVICE_TYPE_STYLES,
  getNewCountryStyle,
} from "@/types/styles";
import { SERVICE_TYPE_NAMES } from "@/types/training";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRangePicker } from "@/components/date-range-picker";
import { Label } from "@/components/ui/label";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { AssessmentStatistics } from "@/components/shared/assessment-statistics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 在 interface 部分添加新的类型定义
interface QuizStatisticsData {
  statistics: {
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    averageScore: number;
  };
  attempts: Array<{
    id: string;
    userId: string;
    name: string;
    startTime: string;
    endTime: string | null;
    totalScore: number | null;
    passed: boolean | null;
    duration: number | null;
  }>;
}

export function QuizManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>();
  const [selectedTrainingId, setSelectedTrainingId] = useState<
    string | undefined
  >();
  const [refreshKey, setRefreshKey] = useState(0);

  // 筛选状态
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all"); // 新增服务类型筛选
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [countries, setCountries] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [allTrainings, setAllTrainings] = useState<Training[]>([]); // 存储所有数据
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 每页显示10条数据

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 删除确认对话框状态
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 删除培训相关状态
  const [trainingToDelete, setTrainingToDelete] = useState<string>();

  // 编辑培训相关状态
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<
    Training | undefined
  >();

  const [showImportDialog, setShowImportDialog] = useState(false);

  // 添加新的状态
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // 添加统计相关的状态
  const [quizStatistics, setQuizStatistics] = useState<
    Record<string, QuizStatisticsData>
  >({});
  const [loadingStatistics, setLoadingStatistics] = useState<
    Record<string, boolean>
  >({});
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  // 检查用户是否有编辑权限
  const canEdit = session?.user?.role && session.user.role !== "user";

  // 获取所有可选的专业
  const majors = useMemo(() => {
    const uniqueMajors = new Set(
      allTrainings.filter((t) => t.major).map((t) => t.major as string)
    );
    return ["all", ...Array.from(uniqueMajors)].sort();
  }, [allTrainings]);

  // 更新筛选逻辑
  const filteredTrainings = useMemo(() => {
    return allTrainings.filter((training) => {
      // 服务类型筛选
      if (
        selectedServiceType !== "all" &&
        training.service_type !== selectedServiceType
      ) {
        return false;
      }

      // 角色筛选
      if (selectedRole !== "all" && training.role !== selectedRole) {
        return false;
      }

      // 阶段筛选
      if (
        selectedStage !== "all" &&
        training.training_stage !== parseInt(selectedStage)
      ) {
        return false;
      }

      // 国家筛选
      if (selectedCountry !== "all" && training.country !== selectedCountry) {
        return false;
      }

      // 专业筛选
      if (selectedMajor !== "all" && training.major !== selectedMajor) {
        return false;
      }

      // 日期筛选
      if (dateRange?.from && training.trainingDate) {
        const trainingDate = new Date(training.trainingDate);
        if (trainingDate < dateRange.from) {
          return false;
        }
      }

      if (dateRange?.to && training.trainingDate) {
        const trainingDate = new Date(training.trainingDate);
        const endDate = dateRange.to;
        endDate.setHours(23, 59, 59, 999);
        if (trainingDate > endDate) {
          return false;
        }
      }

      // 关键词搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        return (
          training.title.toLowerCase().includes(keyword) ||
          training.business_module.toLowerCase().includes(keyword) ||
          training.quizzes.some((q) => q.title.toLowerCase().includes(keyword))
        );
      }

      return true;
    });
  }, [
    allTrainings,
    selectedServiceType,
    selectedRole,
    selectedStage,
    selectedCountry,
    selectedMajor,
    dateRange,
    searchKeyword,
  ]);

  // 更新清空筛选函数
  const clearAllFilters = () => {
    setSelectedServiceType("all");
    setSelectedRole("all");
    setSelectedStage("all");
    setSelectedCountry("all");
    setSelectedMajor("all");
    setDateRange(undefined);
    setSearchKeyword("");
  };

  // 更新是否有活动筛选条件的判断
  const hasActiveFilters = useMemo(() => {
    return (
      selectedServiceType !== "all" ||
      selectedRole !== "all" ||
      selectedStage !== "all" ||
      selectedCountry !== "all" ||
      selectedMajor !== "all" ||
      dateRange !== undefined ||
      searchKeyword !== ""
    );
  }, [
    selectedServiceType,
    selectedRole,
    selectedStage,
    selectedCountry,
    selectedMajor,
    dateRange,
    searchKeyword,
  ]);

  // 获取所有可用的国家选项
  const loadCountries = useCallback(async () => {
    try {
      const response = await fetch("/api/training/countries", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("加载国家选项失败");
      }

      const data = await response.json();
      setCountries(["all", ...data.sort()]);
    } catch (error) {
      console.error("加载国家选项失败:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "获取国家选项失败，请刷新页面重试",
      });
    }
  }, [toast]);

  // 初始化时加载国家选项
  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 修改API调用，添加includeInactive=true参数，以便包含非活跃测验
      const response = await fetch(
        "/api/training/list-with-quizzes?includeInactive=true",
        {
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "加载失败");
      }

      // 处理 API 响应格式
      const trainings = Array.isArray(result) ? result : result?.data;
      if (!Array.isArray(trainings)) {
        throw new Error("数据格式错误");
      }

      setAllTrainings(trainings);
    } catch (error) {
      console.error("加载数据失败:", error);
      setError(error instanceof Error ? error.message : "加载失败");
      setAllTrainings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载和刷新时获取所有数据
  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshKey]);

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

  // 获取角色文本
  const getRoleText = (role: string) => {
    switch (role) {
      case "writer":
        return "文案顾问";
      case "consultant":
        return "咨询顾问";
      default:
        return role || "未知角色";
    }
  };

  // 获取业务模块文本
  const getBusinessModuleText = (module: string) => {
    return module || "未知业务";
  };

  // 获取国家标签样式
  const getCountryBadgeStyle = (country: string) => {
    const style = getNewCountryStyle(country);
    return `${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow transition-all`;
  };

  // 获取角色样式
  const getRoleBadgeStyle = (role: string) => {
    const style = ROLE_STYLES[role as keyof typeof ROLE_STYLES];
    if (!style)
      return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow transition-all";
    return `${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow transition-all`;
  };

  // 获取培训阶段样式
  const getTrainingStageBadgeStyle = (stage: number) => {
    const style =
      TRAINING_STAGE_STYLES[stage as keyof typeof TRAINING_STAGE_STYLES];
    if (!style)
      return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow transition-all";
    return `${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow transition-all`;
  };

  // 获取业务模块样式
  const getBusinessModuleBadgeStyle = (module: string) => {
    const style =
      BUSINESS_MODULE_STYLES[module as keyof typeof BUSINESS_MODULE_STYLES];
    if (!style)
      return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow transition-all";
    return `${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow transition-all`;
  };

  // 获取培训阶段文本
  const getTrainingStageText = (stage: number) => {
    switch (stage) {
      case 0:
        return "入门培训";
      case 1:
        return "中级培训";
      case 2:
        return "专业培训";
      case 3:
        return "高级培训";
      default:
        return "未知阶段";
    }
  };

  // 获取国家文本
  const getCountryText = (country: string) => {
    return country || "未知国家";
  };

  // 获取服务类型样式
  const getServiceTypeBadgeStyle = (serviceType: string) => {
    const style =
      SERVICE_TYPE_STYLES[serviceType as keyof typeof SERVICE_TYPE_STYLES];
    if (!style)
      return "bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow transition-all";
    return `${style.bg} ${style.text} ${style.border} shadow-sm hover:shadow transition-all`;
  };

  // 创建新测试
  const handleCreateQuiz = (trainingId: string) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有创建测验的权限",
      });
      return;
    }
    setSelectedTrainingId(trainingId);
    setEditingQuiz(undefined);
    setShowForm(true);
  };

  // 编辑测验
  const handleEditQuiz = async (quiz: Quiz) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有编辑测验的权限",
      });
      return;
    }

    try {
      setIsLoading(true);
      // 获取完整的quiz数据，包括题目
      const response = await fetch(`/api/quiz/${quiz.id}`, {
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "获取测验详情失败");
      }

      // 处理API响应
      const completeQuiz = result.data;

      console.log("获取到完整的quiz数据:", completeQuiz);

      // 检查是否包含questions数据
      if (!completeQuiz.questions || completeQuiz.questions.length === 0) {
        console.warn("获取的quiz没有包含questions数据");
      }

      setSelectedTrainingId(completeQuiz.trainingId);
      setEditingQuiz(completeQuiz);
      setShowForm(true);
    } catch (error) {
      console.error("获取测验详情失败:", error);
      toast({
        variant: "destructive",
        title: "获取失败",
        description:
          error instanceof Error ? error.message : "获取测验详情失败",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理测验状态切换
  const handleToggleQuizStatus = async (quiz: Quiz) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有修改测验状态的权限",
      });
      return;
    }

    try {
      const response = await fetch(`/api/quiz/${quiz.id}/toggle-status`, {
        method: "PUT",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新状态失败");
      }

      const result = await response.json();
      const updatedQuiz = result.data; // 从response的data字段获取quiz数据
      setAllTrainings((prevTrainings) =>
        prevTrainings.map((training) => ({
          ...training,
          quizzes: training.quizzes.map((q) =>
            q.id === quiz.id ? { ...q, status: updatedQuiz.status } : q
          ),
        }))
      );

      toast({
        title: "状态已更新",
        description: `测验已${
          updatedQuiz.status === "active" ? "启用" : "禁用"
        }`,
      });
    } catch (error) {
      console.error("切换状态失败:", error);
      toast({
        variant: "destructive",
        title: "更新失败",
        description:
          error instanceof Error ? error.message : "切换状态失败，请重试",
      });
    }
  };

  // 处理删除考试
  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有删除测验的权限",
      });
      return;
    }

    if (!confirm("确定要删除这个测验吗？")) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/quiz?id=${quiz.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "删除失败");
      }

      toast({
        title: "删除成功",
        description: "测验已被删除",
      });

      // 刷新列表
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("删除测验失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description:
          error instanceof Error ? error.message : "删除测验时出现错误，请重试",
      });
    } finally {
      setIsDeleting(false);
      setDeleteQuizId(null);
    }
  };

  // 处理删除培训
  const handleDeleteTraining = async (id: string) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有删除培训的权限",
      });
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/training/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || result.code !== 0) {
        throw new Error(result.msg || "删除失败");
      }

      // 从列表中移除
      setAllTrainings(allTrainings.filter((t) => t.id !== id));
      setTrainingToDelete(undefined);

      toast({
        title: "删除成功",
        description: "培训已删除",
      });
    } catch (error) {
      console.error("删除培训失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description:
          error instanceof Error ? error.message : "删除培训时出现错误，请重试",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理编辑培训
  const handleEditTraining = (training: Training) => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有编辑培训的权限",
      });
      return;
    }
    setEditingTraining(training);
    setShowTrainingForm(true);
  };

  // 计算总页数
  const totalPages = Math.ceil(filteredTrainings.length / itemsPerPage);

  // 计算当前页的数据
  const paginatedTrainings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrainings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrainings, currentPage]);

  // 页码变更处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 处理新建培训
  const handleCreateTraining = () => {
    if (!canEdit) {
      toast({
        variant: "destructive",
        title: "权限不足",
        description: "您没有创建培训的权限",
      });
      return;
    }
    setEditingTraining(undefined);
    setShowTrainingForm(true);
  };

  // 处理导入成功
  const handleImportSuccess = () => {
    loadAllData();
    toast({
      title: "导入成功",
      description: "培训数据已成功导入",
    });
  };

  // 加载考试统计数据
  const loadQuizStatistics = async (quizId: string) => {
    if (loadingStatistics[quizId]) return;

    try {
      setLoadingStatistics((prev) => ({ ...prev, [quizId]: true }));
      const response = await fetch(`/api/quiz/statistics?quizId=${quizId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "获取测验统计失败");
      }

      setQuizStatistics((prev) => ({
        ...prev,
        [quizId]: data,
      }));
    } catch (error) {
      console.error("获取测验统计失败:", error);
      toast({
        variant: "destructive",
        title: "加载失败",
        description:
          error instanceof Error ? error.message : "获取测验统计数据失败",
      });
    } finally {
      setLoadingStatistics((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  // 处理查看统计
  const handleViewStatistics = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowStatistics(true);
    if (!quizStatistics[quiz.id]) {
      await loadQuizStatistics(quiz.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">加载中...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-destructive">{error}</div>;
  }

  return (
    <div className="h-full space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">培训测验管理</h2>
          <p className="text-sm text-muted-foreground">
            管理培训相关的测验内容和配置
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button onClick={handleCreateTraining} className="gap-2">
              <Plus className="h-4 w-4" />
              新建培训
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              批量导入
            </Button>
            {/* <Button
              variant="secondary"
              onClick={() => router.push("/console/training/question-bank")}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              题库管理
            </Button> */}
          </div>
        )}
      </div>

      {/* 主要内容区 */}
      <div className="flex flex-col space-y-6">
        {/* 筛选器 */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索培训..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                }}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">服务类型</Label>
              <Select
                value={selectedServiceType}
                onValueChange={setSelectedServiceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="服务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部服务类型</SelectItem>
                  {SERVICE_TYPE_NAMES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">顾问类型</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  {Object.entries(ROLE_STYLES).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">国家/地区</Label>
              <Select
                value={selectedCountry}
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择国家" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country === "all" ? "所有国家" : country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">培训阶段</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
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

            <div className="space-y-1.5">
              <Label className="text-xs">专业</Label>
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger>
                  <SelectValue placeholder="专业" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部专业</SelectItem>
                  {majors.map((major) => (
                    <SelectItem key={major} value={major}>
                      {major}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">培训日期</Label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="border-t px-4 py-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 gap-2"
              >
                <X className="h-4 w-4" />
                清空筛选
              </Button>
            </div>
          )}
        </div>

        {/* 培训列表 */}
        <div className="space-y-4">
          {paginatedTrainings.map((training) => (
            <Card key={training.id} className="overflow-hidden">
              {/* 培训信息 */}
              <div
                className="p-4 flex items-center justify-between gap-4 bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={() => toggleRow(training.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold truncate">
                      {training.title}
                    </h3>
                    {training.quizzes?.length > 0 && (
                      <Badge variant="outline" className="bg-background">
                        {training.quizzes.length} 个测验
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getRoleBadgeStyle(training.role)}
                    >
                      {getRoleText(training.role)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getCountryBadgeStyle(training.country)}
                    >
                      {getCountryText(training.country)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getTrainingStageBadgeStyle(
                        training.training_stage
                      )}
                    >
                      {getTrainingStageText(training.training_stage)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getServiceTypeBadgeStyle(
                        training.service_type
                      )}
                    >
                      {training.service_type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={getBusinessModuleBadgeStyle(
                        training.business_module
                      )}
                    >
                      {getBusinessModuleText(training.business_module)}
                    </Badge>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateQuiz(training.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    新建测验
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditTraining(training)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTrainingToDelete(training.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          您确定要删除这个培训吗？此操作无法撤销，相关的测验也会被删除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          onClick={() => setTrainingToDelete(undefined)}
                        >
                          取消
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (trainingToDelete) {
                              handleDeleteTraining(trainingToDelete);
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "删除中..." : "确认删除"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedRows.has(training.id) && "rotate-180"
                    )}
                  />
                </div>
              </div>

              {/* 测验列表 */}
              {expandedRows.has(training.id) && (
                <div className="p-4 space-y-2">
                  {training.quizzes && training.quizzes.length > 0 ? (
                    training.quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="flex items-center gap-8 p-3 rounded-lg border bg-card hover:bg-accent/5"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">
                                {quiz.title}
                              </h4>
                              <Badge
                                variant={
                                  quiz.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {quiz.status === "active" ? "已启用" : "未启用"}
                              </Badge>
                            </div>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.timeLimit}分钟
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {quiz.passingScore}分及格
                          </div>
                          <div className="flex items-center gap-1">
                            <Database className="h-4 w-4" />
                            {quiz.questions?.length || 0}题
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {quiz.attempts?.length || 0}人参与
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            {quiz.attempts?.filter((a) => a.passed)?.length ||
                              0}
                            人通过
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <Switch
                            checked={quiz.status === "active"}
                            onCheckedChange={() => handleToggleQuizStatus(quiz)}
                          />
                          {quiz.attempts && quiz.attempts.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewStatistics(quiz)}
                            >
                              <BarChart2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuiz(quiz)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteQuiz(quiz)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无测验
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}

          {filteredTrainings.length > 0 && (
            <DataTablePagination
              totalItems={filteredTrainings.length}
              pageSize={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* 测验表单对话框 */}
      <QuizFormDialog
        open={showForm}
        quiz={editingQuiz}
        trainingId={selectedTrainingId}
        onClose={() => {
          setShowForm(false);
          setEditingQuiz(undefined);
          setSelectedTrainingId(undefined);
        }}
        onSaved={() => {
          setShowForm(false);
          setEditingQuiz(undefined);
          setSelectedTrainingId(undefined);
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* 培训表单对话框 */}
      <TrainingFormDialog
        open={showTrainingForm}
        training={editingTraining}
        onClose={() => {
          setShowTrainingForm(false);
          setEditingTraining(undefined);
        }}
        onSaved={() => {
          setShowTrainingForm(false);
          setEditingTraining(undefined);
          setRefreshKey((prev) => prev + 1);
        }}
      />

      {/* 导入对话框 */}
      <TrainingImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={handleImportSuccess}
      />

      {/* 统计信息对话框 */}
      <Dialog open={showStatistics} onOpenChange={setShowStatistics}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title} - 测验统计</DialogTitle>
          </DialogHeader>
          {selectedQuiz && (
            <div
              className="mt-4 overflow-y-auto pr-6"
              style={{ maxHeight: "calc(90vh - 8rem)" }}
            >
              {loadingStatistics[selectedQuiz.id] ? (
                <div className="text-center py-4">加载统计数据中...</div>
              ) : quizStatistics[selectedQuiz.id] ? (
                <AssessmentStatistics
                  statistics={quizStatistics[selectedQuiz.id].statistics}
                  attempts={quizStatistics[selectedQuiz.id].attempts}
                />
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  暂无统计数据
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

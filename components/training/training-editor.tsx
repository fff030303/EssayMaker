"use client";

import * as React from "react";
import { Search, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import type { TrainingNode } from "@/types/training";

interface TrainingFormData {
  title: string;
  service_type: string;
  business_module: string;
  country: string;
  training_stage: number;
  description: string;
  url: string[];
  keywords: string[];
  order: number;
}

const defaultFormData: TrainingFormData = {
  title: "",
  service_type: "",
  business_module: "",
  country: "",
  training_stage: 0,
  description: "",
  url: [],
  keywords: [],
  order: 0,
};

interface TrainingEditorProps {
  type?: "writer" | "consultant";
}

// 预设选项
const businessModules = [
  { value: "入门101", label: "入门101" },
  { value: "工作方法", label: "工作方法" },
  { value: "文书培训", label: "文书培训" },
  { value: "申请培训", label: "申请培训" },
];

const countries = [
  { value: "通用", label: "通用" },
  { value: "美国", label: "美国" },
  { value: "英国", label: "英国" },
  { value: "加拿大", label: "加拿大" },
];

// 培训阶段选项
const trainingStages = [
  { value: "入门培训", label: "入门培训" },
  { value: "中级培训", label: "中级培训" },
  { value: "专业培训", label: "专业培训" },
  { value: "高级培训", label: "高级培训" },
];

const serviceTypes = [
  { value: "留学", label: "留学" },
  { value: "背提", label: "背提" },
  { value: "就业", label: "就业" },
  { value: "语培", label: "语培" },
];

export function TrainingEditor({ type = "writer" }: TrainingEditorProps) {
  const [selectedId, setSelectedId] = React.useState<string>();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trainingToDelete, setTrainingToDelete] = React.useState<string>();
  const [formData, setFormData] =
    React.useState<TrainingFormData>(defaultFormData);
  const [trainings, setTrainings] = useState<TrainingNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentType, setCurrentType] = useState(type);

  // 当选中培训时,更新表单数据
  React.useEffect(() => {
    if (selectedId) {
      const selectedTraining = trainings.find((t) => t.id === selectedId);
      if (selectedTraining) {
        setFormData({
          title: selectedTraining.title || "",
          service_type: selectedTraining.service_type || "",
          business_module: selectedTraining.business_module || "",
          country: selectedTraining.country || "",
          training_stage: selectedTraining.training_stage || 0,
          description: selectedTraining.description || "",
          url: selectedTraining.url || [],
          keywords: selectedTraining.keywords || [],
          order: selectedTraining.order || 0,
        });
      }
    } else {
      setFormData(defaultFormData);
    }
  }, [selectedId, trainings]);

  // 获取培训列表
  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const response = await fetch(
          `/api/training/list-with-quizzes?role=${type}&includeInactive=true`
        );
        if (!response.ok) {
          throw new Error("获取培训列表失败");
        }
        const result = await response.json();
        if (result.code === 0 && Array.isArray(result.data)) {
          setTrainings(result.data);
        } else {
          throw new Error("获取培训列表失败");
        }
      } catch (err) {
        console.error("获取培训列表失败:", err);
        toast({
          variant: "destructive",
          title: "错误",
          description: "获取培训列表失败，请刷新页面重试",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrainings();
  }, [type]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/training/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || result.code !== 0) {
        throw new Error(result.msg || "删除失败");
      }

      // 从列表中移除
      setTrainings(trainings.filter((t) => t.id !== id));
      setTrainingToDelete(undefined);

      toast({
        title: "成功",
        description: "培训已删除",
      });

      // 如果删除的是当前选中的培训，清空选择
      if (id === selectedId) {
        setSelectedId(undefined);
      }
    } catch (err) {
      console.error("删除失败:", err);
      toast({
        variant: "destructive",
        title: "错误",
        description: err instanceof Error ? err.message : "删除失败，请重试",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const trainingData = {
        ...formData,
        role: currentType,
        status: "active",
      };

      const url = selectedId ? `/api/training/${selectedId}` : "/api/training";

      const response = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trainingData),
      });

      const result = await response.json();

      if (!response.ok || result.code !== 0) {
        throw new Error(result.msg || (selectedId ? "更新失败" : "创建失败"));
      }

      // 更新列表
      if (selectedId) {
        setTrainings(
          trainings.map((t) => (t.id === selectedId ? result.data : t))
        );
      } else {
        setTrainings([...trainings, result.data]);
      }

      toast({
        title: "成功",
        description: selectedId ? "培训已更新" : "培训已创建",
      });

      // 清空选择和表单
      setSelectedId(undefined);
      setFormData(defaultFormData);
    } catch (err) {
      console.error("保存失败:", err);
      toast({
        variant: "destructive",
        title: "错误",
        description: err instanceof Error ? err.message : "保存失败，请重试",
      });
    }
  };

  // 在 formData 相关代码后添加关键词处理的函数
  const handleKeywordsChange = (value: string) => {
    // 处理空值的情况
    if (!value) {
      setFormData({ ...formData, keywords: [] });
      return;
    }

    // 将输入的文本分割成关键词数组
    const keywords = value
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0); // 过滤掉空字符串

    setFormData({ ...formData, keywords });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">培训编辑</h2>
          <p className="text-muted-foreground">管理和编辑培训内容</p>
        </div>
      </div>

      <Tabs
        defaultValue={type}
        value={currentType}
        onValueChange={(value) => {
          setCurrentType(value as "writer" | "consultant");
          setSelectedId(undefined);
          setFormData(defaultFormData);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="writer">文案顾问培训</TabsTrigger>
          <TabsTrigger value="consultant">咨询顾问培训</TabsTrigger>
        </TabsList>

        <TabsContent value="writer" className="space-y-4">
          <div className="flex gap-4">
            {/* 左侧培训列表 */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>培训列表</CardTitle>
                <CardDescription>选择要编辑的培训</CardDescription>
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索培训..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>培训名称</TableHead>
                        <TableHead>服务类型</TableHead>
                        <TableHead>业务模块</TableHead>
                        <TableHead>国家/地区</TableHead>
                        <TableHead>培训阶段</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainings.map((training) => (
                        <TableRow
                          key={training.id}
                          className={
                            selectedId === training.id
                              ? "bg-muted cursor-pointer"
                              : "cursor-pointer hover:bg-muted/50"
                          }
                        >
                          <TableCell onClick={() => setSelectedId(training.id)}>
                            {training.title}
                          </TableCell>
                          <TableCell onClick={() => setSelectedId(training.id)}>
                            {training.service_type}
                          </TableCell>
                          <TableCell onClick={() => setSelectedId(training.id)}>
                            {training.business_module}
                          </TableCell>
                          <TableCell onClick={() => setSelectedId(training.id)}>
                            {training.country}
                          </TableCell>
                          <TableCell onClick={() => setSelectedId(training.id)}>
                            第{training.training_stage + 1}阶段
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    确定要删除培训 "{training.title}"
                                    吗？此操作无法撤销。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleDelete(training.id)}
                                  >
                                    删除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 右侧编辑表单 */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>{selectedId ? "编辑培训" : "新建培训"}</CardTitle>
                <CardDescription>
                  {selectedId ? "修改培训内容和设置" : "创建新的培训"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>培训标题</Label>
                    <Input
                      placeholder="输入培训标题"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>服务类型</Label>
                    <Select
                      value={formData.service_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, service_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择服务类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 使用网格布局让筛选项更紧凑 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>业务模块</Label>
                      <Select
                        value={formData.business_module}
                        onValueChange={(value) =>
                          setFormData({ ...formData, business_module: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择业务模块" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessModules.map((module) => (
                            <SelectItem key={module.value} value={module.value}>
                              {module.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">自定义...</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.business_module === "custom" && (
                        <Input
                          placeholder="输入新的业务模块"
                          value={
                            formData.business_module === "custom"
                              ? ""
                              : formData.business_module
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              business_module: e.target.value,
                            })
                          }
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>国家/地区</Label>
                      <Select
                        value={formData.country}
                        onValueChange={(value) =>
                          setFormData({ ...formData, country: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择国家/地区" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem
                              key={country.value}
                              value={country.value}
                            >
                              {country.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">自定义...</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.country === "custom" && (
                        <Input
                          placeholder="输入新的国家/地区"
                          value={
                            formData.country === "custom"
                              ? ""
                              : formData.country
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              country: e.target.value,
                            })
                          }
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>培训阶段</Label>
                      <Select
                        value={formData.training_stage.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            training_stage: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择培训阶段" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>排序</Label>
                      <Input
                        type="number"
                        placeholder="输入排序数字"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>培训描述</Label>
                    <Textarea
                      placeholder="输入培训描述"
                      className="min-h-[100px]"
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>培训链接</Label>
                    <Input
                      placeholder="输入培训链接"
                      value={formData.url.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          url: e.target.value.split(", ").map((u) => u.trim()),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>关键词</Label>
                    <Input
                      placeholder="输入关键词,用逗号分隔"
                      value={
                        formData.keywords ? formData.keywords.join(", ") : ""
                      }
                      onChange={(e) => handleKeywordsChange(e.target.value)}
                    />
                    {formData.keywords && formData.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.keywords.map((keyword, index) => (
                          <div
                            key={index}
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                          >
                            {keyword}
                            <button
                              type="button"
                              className="hover:text-destructive"
                              onClick={() => {
                                const newKeywords = [...formData.keywords];
                                newKeywords.splice(index, 1);
                                setFormData({
                                  ...formData,
                                  keywords: newKeywords,
                                });
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      输入关键词后按回车或逗号添加，点击关键词可以删除
                    </p>
                  </div>

                  <div className="pt-4 space-x-2">
                    <Button type="submit">
                      {selectedId ? "保存修改" : "创建培训"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedId(undefined);
                        setFormData(defaultFormData);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consultant" className="space-y-4">
          {/* 咨询顾问培训的内容与文案顾问培训类似 */}
        </TabsContent>
      </Tabs>
    </div>
  );
}

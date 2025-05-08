"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { Training } from "@/types/training";
import { SERVICE_TYPE_NAMES } from "@/types/training";
import { SERVICE_TYPE_STYLES } from "@/types/styles";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatePicker } from "@/components/date-picker";
import { logger } from "@/lib/logger";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TrainingFormDialogProps {
  open: boolean;
  training?: Training;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  title: string;
  service_type: string;
  business_module: string;
  country: string;
  training_stage: number;
  description: string;
  url: string[];
  keywords: string[];
  order: number;
  role: string;
  major: string;
  trainingDate: string;
  ribbonType?: "new" | "hot" | "custom";
  ribbonText?: string;
}

const defaultFormData: FormData = {
  title: "",
  service_type: "",
  business_module: "",
  country: "",
  training_stage: 0,
  description: "",
  url: [],
  keywords: [],
  order: 0,
  role: "writer",
  major: "",
  trainingDate: "",
  ribbonType: undefined,
  ribbonText: "",
};

// 预设选项
const businessModules = [
  { value: "入门101", label: "入门101" },
  { value: "工作方法", label: "工作方法" },
  { value: "文书培训", label: "文书培训" },
  { value: "申请培训", label: "申请培训" },
  { value: "custom", label: "自定义" },
];

const countries = [
  { value: "通用", label: "通用" },
  { value: "美国", label: "美国" },
  { value: "英国", label: "英国" },
  { value: "加拿大", label: "加拿大" },
  { value: "custom", label: "自定义" },
];

const trainingStages = [
  { value: 0, label: "入门培训" },
  { value: 1, label: "中级培训" },
  { value: 2, label: "专业培训" },
  { value: 3, label: "高级培训" },
];

export function TrainingFormDialog({
  open,
  training,
  onClose,
  onSaved,
}: TrainingFormDialogProps) {
  const [formData, setFormData] = React.useState<FormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCustomBusinessModule, setShowCustomBusinessModule] =
    React.useState(false);
  const [showCustomCountry, setShowCustomCountry] = React.useState(false);
  const [customBusinessModule, setCustomBusinessModule] = React.useState("");
  const [customCountry, setCustomCountry] = React.useState("");
  const { toast } = useToast();

  // 当打开对话框时,初始化表单数据
  React.useEffect(() => {
    if (training) {
      setFormData({
        title: training.title || "",
        service_type: training.service_type || "",
        business_module: training.business_module || "",
        country: training.country || "",
        training_stage:
          typeof training.training_stage === "number"
            ? training.training_stage
            : 0,
        description: training.description || "",
        url: training.url || [],
        keywords: training.keywords || [],
        order: training.order || 0,
        role: training.role || "writer",
        major: training.major || "",
        trainingDate: training.trainingDate
          ? new Date(training.trainingDate).toISOString().split("T")[0]
          : "",
        ribbonType: training.ribbonType,
        ribbonText: training.ribbonText,
      });

      // 检查是否为自定义值
      const isCustomBusinessModule = !businessModules.some(
        (m) => m.value === training.business_module && m.value !== "custom"
      );
      const isCustomCountry = !countries.some(
        (c) => c.value === training.country && c.value !== "custom"
      );

      if (isCustomBusinessModule) {
        setShowCustomBusinessModule(true);
        setCustomBusinessModule(training.business_module || "");
      }

      if (isCustomCountry) {
        setShowCustomCountry(true);
        setCustomCountry(training.country || "");
      }
    } else {
      setFormData(defaultFormData);
      setShowCustomBusinessModule(false);
      setShowCustomCountry(false);
      setCustomBusinessModule("");
      setCustomCountry("");
    }
  }, [training]);

  // 处理业务模块选择
  const handleBusinessModuleChange = (value: string) => {
    if (value === "custom") {
      setShowCustomBusinessModule(true);
      setFormData({ ...formData, business_module: "" });
    } else {
      setShowCustomBusinessModule(false);
      setFormData({ ...formData, business_module: value });
    }
  };

  // 处理国家选择
  const handleCountryChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCountry(true);
      setFormData({ ...formData, country: "" });
    } else {
      setShowCustomCountry(false);
      setFormData({ ...formData, country: value });
    }
  };

  // 处理自定义业务模块输入
  const handleCustomBusinessModuleChange = (value: string) => {
    setCustomBusinessModule(value);
    setFormData({ ...formData, business_module: value });
  };

  // 处理自定义国家输入
  const handleCustomCountryChange = (value: string) => {
    setCustomCountry(value);
    setFormData({ ...formData, country: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 添加表单验证
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入培训标题",
      });
      return;
    }

    if (!formData.service_type) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请选择服务类型",
      });
      return;
    }

    if (!formData.business_module) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请选择或输入业务模块",
      });
      return;
    }

    if (!formData.country) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请选择或输入国家/地区",
      });
      return;
    }

    if (
      formData.training_stage === undefined ||
      formData.training_stage === null
    ) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请选择培训阶段",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const trainingData = {
        ...formData,
        status: "active",
        order: Number(formData.order) || 0,
        keywords: Array.isArray(formData.keywords) ? formData.keywords : [],
        training_stage:
          typeof formData.training_stage === "number"
            ? formData.training_stage
            : 0,
        trainingDate: formData.trainingDate
          ? new Date(formData.trainingDate).toISOString()
          : null,
      };

      logger.debug("提交培训表单", {
        module: "TrainingFormDialog",
        data: {
          isEdit: !!training,
          formData: trainingData,
        },
      });

      const url = training ? `/api/training/${training.id}` : "/api/training";

      const response = await fetch(url, {
        method: training ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trainingData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      logger.info(training ? "更新培训成功" : "创建培训成功", {
        module: "TrainingFormDialog",
        data: {
          id: result.id,
          title: result.title,
        },
      });

      toast({
        title: training ? "更新成功" : "创建成功",
        description: `培训「${trainingData.title}」已${training ? "更新" : "创建"}`,
      });

      onSaved();
    } catch (error) {
      logger.clientError(
        training ? "更新培训失败" : "创建培训失败",
        error instanceof Error ? error.message : "未知错误",
        {
          method: training ? "PUT" : "POST",
          formData,
          error: error instanceof Error ? error.message : String(error),
        }
      );

      toast({
        variant: "destructive",
        title: training ? "更新失败" : "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{training ? "编辑培训" : "新建培训"}</DialogTitle>
          <DialogDescription>
            {training ? "修改培训信息" : "创建新的培训"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="h-[calc(100vh-16rem)]">
            <ScrollArea className="h-full">
              <div className="space-y-8 py-4 px-1 pr-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">基本信息</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="title" className="mb-2 block">
                        标题
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="mb-2 block">
                        描述
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* 分类信息 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">分类信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role" className="mb-2 block">
                        顾问类型
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) =>
                          setFormData({ ...formData, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择顾问类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="writer">文案顾问</SelectItem>
                          <SelectItem value="consultant">咨询顾问</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="service_type" className="mb-2 block">
                        服务类型
                      </Label>
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
                          {SERVICE_TYPE_NAMES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {SERVICE_TYPE_STYLES[type].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="country" className="mb-2 block">
                        国家/地区
                      </Label>
                      <div>
                        <Select
                          value={
                            showCustomCountry ? "custom" : formData.country
                          }
                          onValueChange={handleCountryChange}
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
                          </SelectContent>
                        </Select>
                        {showCustomCountry && (
                          <Input
                            className="mt-2"
                            placeholder="请输入自定义国家/地区"
                            value={customCountry}
                            onChange={(e) =>
                              handleCustomCountryChange(e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="training_stage" className="mb-2 block">
                        培训阶段
                      </Label>
                      <Select
                        value={formData.training_stage.toString()}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            training_stage: parseInt(value),
                          })
                        }
                        required
                      >
                        <SelectTrigger id="training_stage">
                          <SelectValue placeholder="选择培训阶段" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingStages.map((stage) => (
                            <SelectItem
                              key={stage.value}
                              value={stage.value.toString()}
                            >
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="business_module" className="mb-2 block">
                        业务模块
                      </Label>
                      <div>
                        <Select
                          value={
                            showCustomBusinessModule
                              ? "custom"
                              : formData.business_module
                          }
                          onValueChange={handleBusinessModuleChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择业务模块" />
                          </SelectTrigger>
                          <SelectContent>
                            {businessModules.map((module) => (
                              <SelectItem
                                key={module.value}
                                value={module.value}
                              >
                                {module.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {showCustomBusinessModule && (
                          <Input
                            className="mt-2"
                            placeholder="请输入自定义业务模块"
                            value={customBusinessModule}
                            onChange={(e) =>
                              handleCustomBusinessModuleChange(e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="major" className="mb-2 block">
                        专业
                      </Label>
                      <Input
                        id="major"
                        value={formData.major}
                        onChange={(e) =>
                          setFormData({ ...formData, major: e.target.value })
                        }
                        placeholder="请输入专业"
                      />
                    </div>

                    <div>
                      <Label htmlFor="trainingDate" className="mb-2 block">
                        培训日期
                      </Label>
                      <DatePicker
                        date={
                          formData.trainingDate
                            ? new Date(formData.trainingDate)
                            : undefined
                        }
                        onDateChange={(date) =>
                          setFormData({
                            ...formData,
                            trainingDate: date
                              ? format(date, "yyyy-MM-dd")
                              : "",
                          })
                        }
                        placeholder="选择培训日期"
                      />
                    </div>
                  </div>
                </div>

                {/* 其他信息 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">其他信息</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="url" className="mb-2 block">
                        链接
                      </Label>
                      <Input
                        id="url"
                        value={formData.url.join(", ")}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            url: e.target.value
                              .split(", ")
                              .map((u) => u.trim()),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="order" className="mb-2 block">
                        排序
                      </Label>
                      <Input
                        id="order"
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            order: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ribbonType" className="mb-2 block">
                        标签类型
                      </Label>
                      <Select
                        value={formData.ribbonType || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            ribbonType:
                              value === "none"
                                ? undefined
                                : (value as "new" | "hot" | "custom"),
                            ribbonText:
                              value === "custom" ? formData.ribbonText : "",
                          })
                        }
                      >
                        <SelectTrigger id="ribbonType">
                          <SelectValue placeholder="选择标签类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无标签</SelectItem>
                          <SelectItem value="new">新课程 🆕</SelectItem>
                          <SelectItem value="hot">热门 🔥</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.ribbonType === "custom" && (
                      <div>
                        <Label htmlFor="ribbonText" className="mb-2 block">
                          自定义标签文本
                        </Label>
                        <Input
                          id="ribbonText"
                          value={formData.ribbonText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ribbonText: e.target.value,
                            })
                          }
                          placeholder="输入标签文本"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : training ? "更新" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

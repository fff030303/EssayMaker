"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { interviewFormSchema } from "@/lib/validations/interview";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { Interview } from "@/types/interview";
import {
  Dialog,
  DialogContent,
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

type InterviewFormValues = z.infer<typeof interviewFormSchema>;

// 创建面经的mutation
async function createInterview(data: InterviewFormValues): Promise<Interview> {
  const response = await fetch("/api/interviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // 如果是验证错误，显示具体的错误信息
    if (response.status === 422) {
      const errors = responseData;
      const errorMessage = errors
        .map((err: { message: string }) => err.message)
        .join("\n");
      throw new Error(errorMessage);
    }
    throw new Error(responseData.message || "提交失败");
  }

  return responseData;
}

interface InterviewSubmitDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InterviewSubmitDialog({
  open,
  onClose,
}: InterviewSubmitDialogProps) {
  const router = useRouter();
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      country: "",
      university: "",
      program: "",
      majorCategory: "",
      targetDegree: "MASTER",
      interviewContent: "",
    },
  });

  const { mutate: submitInterview, isPending } = useMutation({
    mutationFn: createInterview,
    onSuccess: () => {
      toast.success("提交成功");
      form.reset();
      onClose();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "提交失败，请重试");
    },
  });

  function onSubmit(data: InterviewFormValues) {
    submitInterview(data);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 flex-none">
          <DialogTitle>提供面经</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-6 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>国家/地区</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：美国" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>学校</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：哈佛大学" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="program"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>申请项目</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="例如：计算机科学硕士"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="majorCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>专业类别</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：计算机" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetDegree"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>学历项目</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="选择学历项目" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNDERGRADUATE">
                                本科
                              </SelectItem>
                              <SelectItem value="MASTER">硕士</SelectItem>
                              <SelectItem value="PHD">博士</SelectItem>
                              <SelectItem value="OTHER">其他</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interviewDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>面试日期</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-10 justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP", { locale: zhCN })
                                ) : (
                                  <span>选择日期</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("2000-01-01")
                                }
                                initialFocus
                                locale={zhCN}
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="interviewContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>面试内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="请详细描述你的面试经历，包括：面试形式、面试时长、面试官人数、具体问题等"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-4 px-6 py-4 border-t flex-none">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isPending ? "提交中..." : "提交"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

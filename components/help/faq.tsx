"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HelpCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// FAQ数据结构
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

// FAQ分类
const FAQ_ITEMS: FAQItem[] = [
  {
    category: "基础概念",
    question: "什么是Question Bank（题库）？",
    answer:
      "题库是系统中所有题目的统一管理中心。支持多种方式添加题目：AI生成、手动创建、批量导入。所有题目可以被用于组建Quiz或Exam。",
  },
  {
    category: "基础概念",
    question: "Quiz和Exam有什么区别？",
    answer:
      "Quiz是针对特定Training的测验，而Exam是综合性考试，可以跨多个Training主题。Exam通常难度更高，时间更长。",
  },
  {
    category: "使用流程",
    question: "如何创建新题目？",
    answer:
      "有三种方式：1. 使用AI Question Agent智能出题；2. 在题库中手动创建单个题目；3. 通过Excel模板批量导入题目。",
  },
  {
    category: "使用流程",
    question: "如何组织考试？",
    answer:
      "Quiz：在Training中选择相关题目组成Quiz；Exam：从题库中选择题目组成综合性考试；可以设置考试时间、及格分数等参数。",
  },
  {
    category: "使用流程",
    question: "如何参加考试？",
    answer:
      "Quiz：在Training页面中完成对应的Quiz；Exam：在考试中心页面参加综合性考试；系统会自动记录成绩和答题历史。",
  },
  {
    category: "权限说明",
    question: "谁可以管理题库？",
    answer:
      "管理员可以使用AI生成题目；管理员可以编辑和删除题目；管理员可以导入导出题目。",
  },
  {
    category: "权限说明",
    question: "谁可以组织考试？",
    answer:
      "管理员可以创建和管理Quiz；管理员可以创建和管理Exam；可以查看考试统计数据。",
  },
];

export function FAQ({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // 按分类组织FAQ
  const groupedFAQ = FAQ_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, FAQItem[]>
  );

  // 搜索过滤
  const filteredFAQ = searchQuery
    ? FAQ_ITEMS.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQ_ITEMS;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed bottom-4 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110",
            className
          )}
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>帮助中心</SheetTitle>
        </SheetHeader>

        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索问题..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-4">
          {searchQuery ? (
            // 搜索结果视图
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQ.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            // 分类视图
            Object.entries(groupedFAQ).map(([category, items]) => (
              <div key={category} className="mb-6">
                <h3 className="font-medium text-lg mb-2">{category}</h3>
                <Accordion type="single" collapsible className="w-full">
                  {items.map((item, index) => (
                    <AccordionItem key={index} value={`${category}-${index}`}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

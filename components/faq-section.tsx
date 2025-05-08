import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "留学顾问工作坊 是什么？",
    answer:
      "留学顾问工作坊 是一个专注于留学顾问培训和发展的智能平台。我们融合了AI助理、专业数据库与进阶知识库，为留学顾问提供全方位的成长支持。",
  },
  {
    question: "如何开始使用 留学顾问工作坊？",
    answer:
      "注册账号后，您可以立即访问我们的核心功能，包括智能助理对话、案例分析、数据查询等。我们还提供详细的使用指南，帮助您快速上手。",
  },
  {
    question: "留学顾问工作坊 提供哪些核心功能？",
    answer:
      "我们提供多个核心功能模块：AI智能助理帮助解答问题，专业数据库提供留学信息查询，进阶知识库助力专业提升，以及案例分析工具辅助实战演练。",
  },
  {
    question: "如何联系客服支持？",
    answer:
      "您可以通过平台内的消息系统，或发送邮件至 support@nova-academy.com 联系我们的客服团队。我们会在24小时内回复您的询问。",
  },
  {
    question: "是否提供免费试用？",
    answer:
      "是的，我们提供7天的免费试用期，让您可以体验平台的全部功能。试用期结束后，您可以选择适合自己的会员方案继续使用。",
  },
];

export function FaqSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="border-b border-gray-200 dark:border-gray-700 py-4"
        >
          <AccordionTrigger className="text-left text-lg font-medium text-gray-900 dark:text-white hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

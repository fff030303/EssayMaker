"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/types/chat";
import { sendChatMessage } from "@/lib/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    console.log("用户消息:", userMessage);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setCurrentResponse("");
    setIsThinking(true);

    try {
      let thinkingContent = "";
      let finalContent = "";
      let isInThinking = false;

      await sendChatMessage([...messages, userMessage], (content) => {
        console.log("收到原始响应:", content);

        // 检查是否是错误消息
        if (content.includes("Invalid prompt:")) {
          console.error("API错误:", content);
          toast({
            variant: "destructive",
            title: "错误",
            description: "请求格式无效,请重试",
          });
          return;
        }

        if (content.includes("Account balance not enough")) {
          console.error("API错误: 账户余额不足");
          toast({
            variant: "destructive",
            title: "API调用失败",
            description: "账户余额不足,请充值后重试",
          });
          return;
        }

        if (content.includes("<think>")) {
          console.log("检测到think开始标记");
          isInThinking = true;
          thinkingContent = content.replace("<think>", "").trim();
          console.log("提取的think内容:", thinkingContent);
        } else if (content.includes("</think>")) {
          console.log("检测到think结束标记");
          isInThinking = false;
          thinkingContent += content.replace("</think>", "").trim();

          // 提取思考内容和最终答案
          const parts = thinkingContent.split("\n\n");
          const thinking = parts[0].trim();
          const final = parts.slice(1).join("\n\n").trim();

          console.log("分离后的思考内容:", thinking);
          console.log("分离后的最终答案:", final);

          // 只在有内容时添加消息
          if (thinking) {
            setMessages((prev) => {
              const newMessages = [
                ...prev,
                { role: "thinking" as const, content: thinking },
              ];
              if (final) {
                newMessages.push({ role: "final" as const, content: final });
              }
              console.log("添加消息后的消息列表:", newMessages);
              return newMessages;
            });
          }

          thinkingContent = "";
          finalContent = final || "";
        } else if (isInThinking) {
          thinkingContent += content;
          console.log("累积的think内容:", thinkingContent);
          if (thinkingContent.trim()) {
            setCurrentResponse(thinkingContent);
          }
        } else {
          finalContent += content;
          console.log("累积的final内容:", finalContent);
          if (finalContent.trim()) {
            setCurrentResponse(finalContent);
          }
        }
      });

      // 只在有非错误的final内容时添加消息
      if (
        finalContent &&
        !finalContent.includes("</think>") &&
        !finalContent.includes("Invalid prompt:")
      ) {
        console.log("追加最终答案内容:", finalContent);
        setMessages((prev) => {
          const newMessages = [
            ...prev,
            { role: "final" as const, content: finalContent.trim() },
          ];
          console.log("添加final消息后的完整消息列表:", newMessages);
          return newMessages;
        });
      }
    } catch (error) {
      console.error("聊天错误:", error);
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "发生未知错误",
      });
    } finally {
      setIsLoading(false);
      setCurrentResponse("");
      setIsThinking(false);
      console.log("消息处理完成");
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";
    const isThinking = message.role === "thinking";
    const isFinal = message.role === "final";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex items-start gap-2 max-w-[85%] ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isUser && (
            <div className="mt-1">
              <Brain
                className={`w-5 h-5 ${
                  isThinking ? "text-yellow-500 animate-pulse" : "text-primary"
                }`}
              />
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-2 shadow-sm ${
              isUser
                ? "bg-primary text-primary-foreground"
                : isThinking
                  ? "bg-yellow-500/10 border border-yellow-500/20 prose-sm dark:prose-invert"
                  : isFinal
                    ? "bg-muted prose prose-sm dark:prose-invert"
                    : "bg-muted prose prose-sm dark:prose-invert"
            }`}
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      {/* 消息列表区域 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 space-y-6"
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {currentResponse &&
          renderMessage(
            { role: "assistant", content: currentResponse },
            messages.length
          )}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="mt-1">
                <Brain className="w-5 h-5 text-yellow-500 animate-pulse" />
              </div>
              <div className="rounded-2xl px-4 py-2 shadow-sm bg-yellow-500/10 border border-yellow-500/20 prose-sm dark:prose-invert">
                思考中...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="w-full bg-gradient-to-t from-background/80 to-background/30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form
          onSubmit={handleSubmit}
          className="w-full px-4 py-4 flex gap-4 items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "发送中..." : "发送"}
          </Button>
        </form>
      </div>
    </div>
  );
}

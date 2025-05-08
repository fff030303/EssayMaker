"use client";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, Check, Info } from "lucide-react";
import { ToastAction } from "@/components/ui/toast";

export default function Blog() {
  // 测试基本toast函数
  const triggerToast = () => {
    console.log("测试toast按钮被点击");
    toast({
      title: "测试通知",
      description: "这是一条普通测试通知消息",
      duration: 5000,
    });
  };

  // 测试带操作的toast
  const triggerToastWithAction = () => {
    console.log("测试带操作的toast");
    toast({
      title: "需要操作",
      description: "这条通知需要你确认或取消",
      duration: 8000,
      action: (
        <ToastAction altText="确认">确认</ToastAction>
      ),
    });
  };

  // 测试错误toast
  const triggerErrorToast = () => {
    console.log("测试错误toast");
    toast({
      variant: "destructive",
      title: "发生错误",
      description: "操作过程中出现了问题，请重试",
      duration: 8000,
    });
  };

  // 测试成功toast
  const triggerSuccessToast = () => {
    console.log("测试成功toast");
    toast({
      title: "操作成功",
      description: "你的操作已成功完成",
      duration: 5000,
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>我的博客</h1>
      <p>这里是我的博客内容，分享我的想法和经验。</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>最新文章</h2>
        <ul>
          <li>如何使用 Next.js 构建现代网站</li>
          <li>React 19 新特性解析</li>
          <li>TypeScript 入门指南</li>
        </ul>
      </div>

      {/* 测试Toast按钮区域 */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Toast测试区域</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem' }}>
          <Button 
            onClick={triggerToast}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Bell className="h-4 w-4 mr-2" />
            基本通知
          </Button>
          
          <Button 
            onClick={triggerToastWithAction}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Info className="h-4 w-4 mr-2" />
            带操作通知
          </Button>
          
          <Button 
            onClick={triggerErrorToast}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            错误通知
          </Button>
          
          <Button 
            onClick={triggerSuccessToast}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            成功通知
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";  // 导入 Link 组件
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 自动重定向到 /console/essaymaker
    router.replace("/console/essaymaker");
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      正在跳转到AI助手...
    </div>
  );
}

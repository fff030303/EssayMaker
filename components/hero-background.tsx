"use client"

import { motion } from "framer-motion"

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#fafafa] dark:bg-[#1a1a1a]">
      {/* 基础渐变层 - 使用更柔和的颜色 */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
        aria-hidden="true"
      />
      
      {/* 柔和的网格背景 */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(0, 0, 0, 0.2) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* 装饰性图形 - Notion风格 */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-64 h-64 rounded-2xl bg-blue-100/30 dark:bg-blue-900/20 backdrop-blur-3xl"
        animate={{
          y: [-10, 10, -10],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-purple-100/30 dark:bg-purple-900/20 backdrop-blur-3xl"
        animate={{
          y: [10, -10, 10],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        aria-hidden="true"
      />

      {/* 极简装饰线条 */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-px h-32 bg-gray-200 dark:bg-gray-800 rotate-45" />
        <div className="absolute top-1/3 right-1/4 w-px h-48 bg-gray-200 dark:bg-gray-800 -rotate-45" />
        <div className="absolute bottom-1/4 left-1/2 w-px h-24 bg-gray-200 dark:bg-gray-800 rotate-12" />
      </div>
    </div>
  )
} 
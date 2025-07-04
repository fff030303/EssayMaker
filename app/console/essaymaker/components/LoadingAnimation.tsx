/**
 * LoadingAnimation 组件集合
 * 
 * 功能：提供多种加载动画效果，增强用户体验
 * 
 * 组件列表：
 * 1. LoadingAnimation - 主要加载动画组件
 * 2. FullScreenLoadingAnimation - 全屏加载动画
 * 3. InlineLoadingAnimation - 内联加载动画
 * 
 * LoadingAnimation 变体：
 * - dots：默认的跳动圆点效果
 * - sparkles：闪烁星星效果
 * - typing：打字机效果
 * 
 * 特性：
 * - 基于 Framer Motion 的流畅动画
 * - 多种视觉效果可选
 * - 自定义文本和样式
 * - 响应式设计
 * - 性能优化的动画循环
 * 
 * 使用场景：
 * - 数据加载等待
 * - 内容生成过程
 * - 文件上传进度
 * - 页面切换过渡
 * 
 * 动画效果：
 * - 淡入淡出
 * - 缩放变换
 * - 位移动画
 * - 透明度变化
 * - 延迟交错动画
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingAnimationProps {
  text?: string;
  className?: string;
  variant?: "dots" | "sparkles" | "typing";
}

export function LoadingAnimation({
  text = "正在创作中...",
  className = "",
  variant = "dots",
}: LoadingAnimationProps) {
  // 打字机效果
  const typingVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  // 闪烁效果
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "mirror" as "mirror" | "reverse" | "loop",
      },
    },
  };

  if (variant === "typing") {
    return (
      <motion.div
        className={`flex items-center gap-2 ${className}`}
        initial="hidden"
        animate="visible"
        variants={typingVariants}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="inline-block h-2 w-2 bg-blue-500 rounded-full"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.2,
                  },
                },
              }}
            />
          ))}
        </div>
        <motion.span
          className="text-sm text-gray-500"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { duration: 0.3 },
            },
          }}
        >
          {text}
        </motion.span>
      </motion.div>
    );
  }

  if (variant === "sparkles") {
    return (
      <motion.div
        className={`flex items-center gap-2 ${className}`}
        initial="hidden"
        animate="visible"
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={sparkleVariants}
              transition={{ delay: i * 0.2 }}
            >
              <Sparkles className="h-4 w-4 text-blue-500" />
            </motion.div>
          ))}
        </div>
        <motion.span
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {text}
        </motion.span>
      </motion.div>
    );
  }

  // 默认的dots效果
  return (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-2 w-2 bg-blue-500 rounded-full"
            animate={{
              y: [0, -5, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">{text}</span>
    </motion.div>
  );
}

// 全屏加载动画
export function FullScreenLoadingAnimation({
  text = "正在准备生成内容...",
}: {
  text?: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-[5]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <motion.p
          className="text-sm text-gray-500"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          {text}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// 内联加载动画
export function InlineLoadingAnimation({
  text = "正在处理...",
}: {
  text?: string;
}) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-md"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Loader2 className="h-4 w-4" />
      </motion.div>
      <motion.span
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        {text}
      </motion.span>
    </motion.div>
  );
}

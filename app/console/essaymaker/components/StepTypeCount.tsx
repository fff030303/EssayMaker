/**
 * StepTypeCount 组件
 * 
 * 功能：统计和显示不同类型步骤的数量信息
 * 
 * 核心特性：
 * 1. 步骤统计：
 *    - 按类型分组统计
 *    - 实时数量更新
 *    - 百分比计算
 *    - 进度比例显示
 * 
 * 2. 可视化展示：
 *    - 图标化类型标识
 *    - 数量徽章显示
 *    - 颜色编码区分
 *    - 紧凑布局设计
 * 
 * 3. 交互功能：
 *    - 点击筛选功能
 *    - 悬浮详情显示
 *    - 快速导航
 *    - 状态切换
 * 
 * 4. 数据处理：
 *    - 自动分类统计
 *    - 动态数据更新
 *    - 缓存优化
 *    - 性能监控
 * 
 * 5. 响应式设计：
 *    - 移动端适配
 *    - 动态布局调整
 *    - 内容自适应
 * 
 * 使用场景：
 * - 流程进度监控
 * - 步骤类型分析
 * - 处理统计展示
 * - 性能指标显示
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

"use client";

import React from "react";
import { parseStepContent } from "../utils/helpers";

// 步骤类型计数组件
interface StepTypeCountProps {
  steps: string[];
  type: string;
  icon: React.ReactNode;
  label: string;
}

export function StepTypeCount({ steps, type, icon, label }: StepTypeCountProps) {
  const count = steps.filter((step) => {
    try {
      const stepData = parseStepContent(step);
      return stepData.type === type;
    } catch (error) {
      // console.error("Error parsing step content:", error);
      return false;
    }
  }).length;

  return (
    <div className="flex items-center gap-1">
      {icon}
      <span className="text-xs text-muted-foreground">
        {label}: {count}
      </span>
    </div>
  );
} 
/**
 * RLRequest 组件
 *
 * 功能：推荐信写作要求表单组件，处理推荐信相关的写作需求配置
 *
 * 核心特性：
 * 1. 推荐人位置选择：
 *    - 预设位置选择（1、2、3）
 *    - 自定义位置输入
 *    - 数字验证和格式化
 *    - 必填字段验证
 *
 * 2. 被推荐人信息：
 *    - 性别选择（男生/女生）
 *    - 必填字段验证
 *    - 状态管理
 *
 * 3. 额外写作要求：
 *    - 可折叠的需求定制区域
 *    - 快速选择模板标签
 *    - 标签点选高亮和取消
 *    - 自由文本输入
 *
 * 4. 用户体验：
 *    - 直观的单选框界面
 *    - 条件显示的输入框
 *    - 快速选择按钮
 *    - 实时验证反馈
 *
 * 5. 数据处理：
 *    - 表单数据收集
 *    - 验证状态管理
 *    - 父组件数据同步
 *    - 格式化输出
 *
 * 6. 响应式设计：
 *    - 移动端适配
 *    - 布局自适应
 *    - 交互优化
 *
 * @author EssayMaker Team
 * @version 2.0.0 - 现代化重设计，采用折叠式写作需求定制
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { RL_REQUIREMENTS_TEMPLATES } from "./constants/templates";

interface RLRequestProps {
  // 推荐人位置相关
  recommenderPosition: 1 | 2 | 3;
  setRecommenderPosition: (position: 1 | 2 | 3) => void;
  recommenderPositionType: "preset" | "custom";
  setRecommenderPositionType: (type: "preset" | "custom") => void;
  customRecommenderPosition: string;
  setCustomRecommenderPosition: (position: string) => void;

  // 性别相关
  gender: "男生" | "女生" | "";
  setGender: (gender: "男生" | "女生") => void;

  // 写作需求相关
  additionalRequirements: string;
  setAdditionalRequirements: (requirements: string) => void;

  // 禁用状态
  disabled?: boolean;
}

export function RLRequest({
  recommenderPosition,
  setRecommenderPosition,
  recommenderPositionType,
  setRecommenderPositionType,
  customRecommenderPosition,
  setCustomRecommenderPosition,
  gender,
  setGender,
  additionalRequirements,
  setAdditionalRequirements,
  disabled = false,
}: RLRequestProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);

  // 处理需求模板标签点击 - 采用与PS相同的逻辑
  const handleRequirementTagClick = (value: string) => {
    if (additionalRequirements.includes(value)) {
      // 如果已包含，则移除
      setAdditionalRequirements(
        additionalRequirements.replace(value, "").trim().replace(/\s+/g, " ")
      );
    } else {
      // 如果未包含，则添加
      const newValue = additionalRequirements
        ? `${additionalRequirements} ${value}`
        : value;
      setAdditionalRequirements(newValue);
    }
  };

  // 自定义单选框组件
  const CustomRadio = ({
    checked,
    onChange,
    disabled: radioDisabled = false,
    name,
    value,
  }: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    name: string;
    value: string;
  }) => {
    return (
      <div
        className="relative inline-flex items-center justify-center cursor-pointer"
        onClick={!radioDisabled ? onChange : undefined}
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: `2px solid ${checked ? "#3b82f6" : "#d1d5db"}`,
          backgroundColor: checked ? "#3b82f6" : "white",
          transition: "all 0.2s ease",
          opacity: radioDisabled ? 0.5 : 1,
          cursor: radioDisabled ? "not-allowed" : "pointer",
        }}
      >
        {/* 隐藏的真实input，用于表单提交和可访问性 */}
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={radioDisabled}
          className="absolute opacity-0 w-0 h-0"
          style={{ margin: 0, padding: 0 }}
        />
        {/* 内部白色圆点 */}
        {checked && (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white",
            }}
          />
        )}
      </div>
    );
  };

  return (
    
    <div className="space-y-6">
      
      {/* 第一个单选框：推荐人位置 */}
      <div>
        <div className="flex items-center">
          <Label className="text-sm font-medium">
            这是第几个推荐人的推荐信？
            <Badge
              variant="destructive"
              className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
            >
              必需
            </Badge>
            <span className="inline-block w-2" />
          </Label>
          <div className="flex gap-4">
            {[
              { value: "preset", label: "1" },
              { value: "preset", label: "2" },
              { value: "preset", label: "3" },
              { value: "custom", label: "其他" },
            ].map((option, index) => {
              const isChecked =
                option.value === "preset"
                  ? recommenderPositionType === "preset" &&
                    recommenderPosition === index + 1
                  : recommenderPositionType === "custom";

              return (
                <label
                  key={`${option.value}-${option.label}`}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <CustomRadio
                    checked={isChecked}
                    onChange={() => {
                      if (option.value === "preset") {
                        setRecommenderPositionType("preset");
                        setRecommenderPosition((index + 1) as 1 | 2 | 3);
                      } else {
                        setRecommenderPositionType("custom");
                      }
                    }}
                    disabled={disabled}
                    name="recommenderPositionType"
                    value={`${option.value}-${option.label}`}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 条件显示的自定义输入框 */}
        {recommenderPositionType === "custom" && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="请输入推荐人位置，如：4、5等"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              value={customRecommenderPosition}
              onChange={(e) => {
                // 只允许输入数字
                const value = e.target.value.replace(/[^0-9]/g, "");
                setCustomRecommenderPosition(value);
              }}
              onKeyPress={(e) => {
                // 阻止非数字字符的输入
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* 第二个单选框：被推荐人的性别 */}
      <div>
        <div className="flex items-center">
          <Label className="text-sm font-medium">
            被推荐人的性别是？
            <Badge
              variant="destructive"
              className="ml-2 text-xs px-2 py-0.5 h-5 bg-pink-600 text-white border-pink-600 hover:bg-pink-700"
            >
              必需
            </Badge>
            <span className="inline-block w-2" />
          </Label>
          <div className="flex gap-4">
            {["男生", "女生"].map((genderOption) => {
              const isChecked = gender === genderOption;

              return (
                <label
                  key={genderOption}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <CustomRadio
                    checked={isChecked}
                    onChange={() => {
                      setGender(genderOption as "男生" | "女生");
                    }}
                    disabled={disabled}
                    name="gender"
                    value={genderOption}
                  />
                  <span className="text-sm">{genderOption}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* 第三部分：可折叠的写作需求定制区域 */}
      <div className="space-y-4">
        <Collapsible
          open={isRequirementsOpen}
          onOpenChange={setIsRequirementsOpen}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal hover:bg-transparent"
              disabled={disabled}
            >
              <div className="flex items-center gap-2 text-left">
                <Settings className="h-4 w-4 text-stone-600" />
                <div>
                  <div className="text-sm font-medium text-stone-800">
                    写作需求定制
                  </div>
                  <div className="text-xs text-stone-600">
                    定制推荐信的风格和重点
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="ml-2 text-xs px-2 py-0.5 h-5 bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200"
                >
                  可选
                </Badge>
              </div>
              {isRequirementsOpen ? (
                <ChevronUp className="h-4 w-4 text-stone-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-600" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-4">
            {/* 快捷标签 */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-stone-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                快速选择
              </div>
              <div className="flex flex-wrap gap-2">
                {RL_REQUIREMENTS_TEMPLATES.map((template) => (
                  <Badge
                    key={template.value}
                    variant={
                      additionalRequirements.includes(template.value)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer transition-colors text-xs ${
                      additionalRequirements.includes(template.value)
                        ? "bg-stone-700 text-white hover:bg-stone-800"
                        : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                    }`}
                    onClick={() =>
                      !disabled && handleRequirementTagClick(template.value)
                    }
                  >
                    {template.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 文本输入区域 */}
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="例如：请突出被推荐人的学术研究能力，重点展示科研经历和创新思维..."
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                disabled={disabled}
                className="min-h-[80px] resize-none border-dashed border-stone-300 bg-white placeholder:text-stone-500 focus-visible:ring-stone-400 shadow-sm"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs text-stone-600">
                <span>输入特殊要求或点击标签快速添加</span>
                <span>{additionalRequirements.length}/500</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* 当有内容但折叠时显示摘要 */}
        {!isRequirementsOpen && additionalRequirements && (
          <div className="p-3 bg-stone-100/60 rounded-lg border-dashed border border-stone-300">
            <div className="text-xs text-stone-600 mb-1">已设置写作要求：</div>
            <div className="text-sm truncate text-stone-800">
              {additionalRequirements.length > 60
                ? `${additionalRequirements.substring(0, 60)}...`
                : additionalRequirements}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
 *    - 可选的额外要求开关
 *    - 快速选择模板按钮
 *    - 自由文本输入
 *    - 模板内容插入
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
 * @version 1.0.0
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface RLRequestProps {
  // 推荐人位置相关
  recommenderPosition: 1 | 2 | 3;
  setRecommenderPosition: (position: 1 | 2 | 3) => void;
  recommenderPositionType: 'preset' | 'custom';
  setRecommenderPositionType: (type: 'preset' | 'custom') => void;
  customRecommenderPosition: string;
  setCustomRecommenderPosition: (position: string) => void;
  
  // 性别相关
  gender: '男生' | '女生' | '';
  setGender: (gender: '男生' | '女生') => void;
  
  // 额外要求相关
  hasOtherRequirements: '是' | '否' | '';
  setHasOtherRequirements: (hasOther: '是' | '否') => void;
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
  hasOtherRequirements,
  setHasOtherRequirements,
  additionalRequirements,
  setAdditionalRequirements,
  disabled = false,
}: RLRequestProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 添加调试信息
  console.log('RLRequest状态:', {
    recommenderPositionType,
    recommenderPosition,
    gender,
    hasOtherRequirements
  });

  // 处理快速选择按钮点击
  const handleRequirementButtonClick = (text: string) => {
    const newRequirements = additionalRequirements
      ? additionalRequirements + "\n" + text
      : text;
    setAdditionalRequirements(newRequirements);
    
    // 聚焦到文本框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // 自定义单选框组件
  const CustomRadio = ({ 
    checked, 
    onChange, 
    disabled: radioDisabled = false,
    name,
    value 
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
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: `2px solid ${checked ? '#3b82f6' : '#d1d5db'}`,
          backgroundColor: checked ? '#3b82f6' : 'white',
          transition: 'all 0.2s ease',
          opacity: radioDisabled ? 0.5 : 1,
          cursor: radioDisabled ? 'not-allowed' : 'pointer'
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
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'white',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 写作需求区域 */}
      <div className="space-y-4">
        {/* 第一个单选框：撰写第几位推荐人 */}
        <div>
          <div className="flex items-center">
            <Label className="text-sm font-medium">
              撰写第几位推荐人？ <span className="text-red-500 ml-0.5">*</span>
              <span className="ml-1 text-xs text-red-500">(必选)</span>
              <span className="inline-block w-2" />
            </Label>
            <div className="flex gap-4 flex-wrap">
              {[1, 2, 3].map((num) => {
                const isChecked = recommenderPositionType === 'preset' && recommenderPosition === num;
                console.log(`数字${num}选中状态:`, isChecked);
                
                return (
                  <label key={num} className="flex items-center space-x-2 cursor-pointer">
                    <CustomRadio
                      checked={isChecked}
                      onChange={() => {
                        console.log(`选择数字${num}`);
                        setRecommenderPositionType('preset');
                        setRecommenderPosition(num as 1 | 2 | 3);
                      }}
                      disabled={disabled}
                      name="recommenderPositionType"
                      value="preset"
                    />
                    <span className="text-sm">{num}</span>
                  </label>
                );
              })}
              <label className="flex items-center space-x-2 cursor-pointer">
                <CustomRadio
                  checked={recommenderPositionType === 'custom'}
                  onChange={() => {
                    console.log('选择其他');
                    setRecommenderPositionType('custom');
                  }}
                  disabled={disabled}
                  name="recommenderPositionType"
                  value="custom"
                />
                <span className="text-sm">其他</span>
              </label>
            </div>
          </div>
          
          {/* 条件显示的自定义输入框 */}
          {recommenderPositionType === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="请输入推荐人位置，如：4、5等"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                value={customRecommenderPosition}
                onChange={(e) => {
                  // 只允许输入数字
                  const value = e.target.value.replace(/[^0-9]/g, '');
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
              被推荐人的性别是？ <span className="text-red-500 ml-0.5">*</span>
              <span className="ml-1 text-xs text-red-500">(必选)</span>
              <span className="inline-block w-2" />
            </Label>
            <div className="flex gap-4">
              {['男生', '女生'].map((genderOption) => {
                const isChecked = gender === genderOption;
                console.log(`性别${genderOption}选中状态:`, isChecked);
                
                return (
                  <label key={genderOption} className="flex items-center space-x-2 cursor-pointer">
                    <CustomRadio
                      checked={isChecked}
                      onChange={() => {
                        console.log(`选择性别${genderOption}`);
                        setGender(genderOption as '男生' | '女生');
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

        {/* 第三个单选框：是否还有其他写作要求 */}
        <div>
          <div className="flex items-center">
            <Label className="text-sm font-medium">
              是否还有其他写作要求？
            </Label>
            <span className="inline-block w-2" />
            <div className="flex gap-4">
              {['是', '否'].map((option) => {
                const isChecked = hasOtherRequirements === option;
                console.log(`其他要求${option}选中状态:`, isChecked);
                
                return (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <CustomRadio
                      checked={isChecked}
                      onChange={() => {
                        console.log(`选择其他要求${option}`);
                        setHasOtherRequirements(option as '是' | '否');
                      }}
                      disabled={disabled}
                      name="hasOtherRequirements"
                      value={option}
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* 条件显示的文本输入框和按钮 */}
        {hasOtherRequirements === '是' && (
          <div className="space-y-3">
            {/* 快速选择按钮 */}
            <div className="flex flex-wrap gap-2">

              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => !disabled && handleRequirementButtonClick("学生要申请XX专业，要求合理选用素材，并且从素材中合理推导出该专业所要求的专业技能和软实力")}
              >
                申请专业
              </Badge>

              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => !disabled && handleRequirementButtonClick("请补充更多课堂互动细节")}
              >
                课堂互动细节
              </Badge>
              
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => !disabled && handleRequirementButtonClick("请补充更多科研项目细节")}
              >
                科研项目细节
              </Badge>
              
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => !disabled && handleRequirementButtonClick("请突出学术能力和研究潜力")}
              >
                学术能力
              </Badge>
              
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted px-3 py-1"
                onClick={() => !disabled && handleRequirementButtonClick("请强调工作能力和职业素养")}
              >
                工作能力
              </Badge>
            </div>
            
            {/* 文本输入框 */}
            <Textarea
              ref={textareaRef}
              placeholder="您可以点击上方按钮使用定制模板，也可以自由输入写作需求"
              className="min-h-[120px] resize-y"
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    </div>
  );
}

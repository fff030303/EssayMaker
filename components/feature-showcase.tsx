"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Search, Wand2, BarChart3, MessageCircle } from "lucide-react"

const features = [
  {
    title: "查课程信息",
    description: "快速了解课程设置、学分要求、专业方向等信息",
    icon: Search,
    image: "/course-info.gif"
  },
  {
    title: "查申请要求",
    description: "获取GPA、语言成绩、推荐信等申请条件及截止日期",
    icon: Wand2,
    image: "/requirements.gif"
  },
  {
    title: "查项目特色",
    description: "了解项目优势、实习机会、就业前景和校友反馈",
    icon: BarChart3,
    image: "/program-features.gif"
  },
  {
    title: "查教授信息",
    description: "浏览教授研究方向、发表论文和实验室项目",
    icon: MessageCircle,
    image: "/professor-info.gif"
  }
]

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState<number>(0)

  return (
    <>
      {/* 功能卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              "group relative rounded-lg cursor-pointer",
              "bg-[#F6F6F4] dark:bg-gray-900",
              "transition-all duration-300 ease-in-out",
              "overflow-hidden",
              "border border-transparent",
              "hover:bg-white dark:hover:bg-gray-800",
              "hover:border-[#00000015] dark:hover:border-[#ffffff15]",
              "hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.05)]",
              "hover:translate-y-[-2px]",
              activeFeature === index && [
                "bg-white dark:bg-gray-800",
                "border-[#00000015] dark:border-[#ffffff15]",
                "shadow-[0_8px_16px_-4px_rgba(0,0,0,0.05)]",
                "translate-y-[-2px]"
              ]
            )}
            onMouseEnter={() => setActiveFeature(index)}
          >
            <div className="relative h-full w-full p-4">
              <div className="space-y-2">
                <feature.icon 
                  className={cn(
                    "w-[26px] h-[26px]",
                    "text-[#0B8BFF] dark:text-blue-400",
                    "transition-transform duration-300 ease-in-out",
                    "group-hover:scale-110"
                  )}
                  strokeWidth={2.5}
                />
                <h3 className="text-[20px] font-medium text-black dark:text-white leading-none font-system">
                  {feature.title}
                </h3>
                <p className="text-[14px] leading-[1.4] text-[#666666] dark:text-gray-400 font-system">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 功能展示区域 */}
      <div className="relative w-full aspect-[16/9] bg-[#F6F6F4] dark:bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-200">
          <img
            src={features[activeFeature].image}
            alt={features[activeFeature].title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </>
  )
} 
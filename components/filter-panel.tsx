"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FilterOptions = {
  systemRecommend: boolean
  countries: string[]
  majors: string[]
  businessCapabilities: string[]
  serviceQualities: string[]
  stability: string[]
  branch: string[]
}

export interface FilterPanelProps {
  filters: FilterOptions
  filterOptions: {
    countries: string[]
    majors: string[]
    businessCapabilities: string[]
    serviceQualities: string[]
    stability: string[]
    branch: string[]
  }
  onChange: (filters: FilterOptions) => void
}

// 定义可以多选的字段类型
type MultiSelectKeys = keyof Omit<FilterOptions, "systemRecommend" | "stability">

export function FilterPanel({
  filters,
  filterOptions,
  onChange,
}: FilterPanelProps) {
  const [currentValues, setCurrentValues] = useState({
    countries: "",
    majors: "",
    businessCapabilities: "",
    serviceQualities: "",
    stability: "",
    branch: ""
  })

  // 监听 filters 变化，更新 currentValues
  useEffect(() => {
    if (filters) {
      // 清空 currentValues，因为它只用于新的选择
      setCurrentValues({
        countries: "",
        majors: "",
        businessCapabilities: "",
        serviceQualities: "",
        stability: "",
        branch: ""
      })
    }
  }, [filters])

  // 计算已选择的筛选条件数量
  const activeFiltersCount = 
    filters.countries.length +
    filters.majors.length +
    filters.businessCapabilities.length +
    filters.serviceQualities.length +
    filters.stability.length +
    filters.branch.length

  // 清空所有筛选条件
  const handleClearAll = () => {
    setCurrentValues({
      countries: "",
      majors: "",
      businessCapabilities: "",
      serviceQualities: "",
      stability: "",
      branch: ""
    })
    onChange({
      systemRecommend: false,
      countries: [],
      majors: [],
      businessCapabilities: [],
      serviceQualities: [],
      stability: [],
      branch: []
    })
  }

  // 更新多选项
  const handleMultiSelectChange = (
    key: MultiSelectKeys,
    value: string
  ) => {
    setCurrentValues(prev => ({ ...prev, [key]: value }))
    if (!filters[key].includes(value)) {
      onChange({ ...filters, [key]: [...filters[key], value] })
    }
  }

  // 移除选中项
  const handleRemoveItem = (
    key: MultiSelectKeys,
    value: string
  ) => {
    if (currentValues[key] === value) {
      setCurrentValues(prev => ({ ...prev, [key]: "" }))
    }
    onChange({
      ...filters,
      [key]: filters[key].filter((item) => item !== value),
    })
  }

  // 更新稳定性
  const handleStabilityChange = (value: string) => {
    setCurrentValues(prev => ({ ...prev, stability: value }))
    if (!filters.stability.includes(value)) {
      onChange({ ...filters, stability: [...filters.stability, value] })
    }
  }

  // 移除稳定性标签
  const handleRemoveStability = (value: string) => {
    if (currentValues.stability === value) {
      setCurrentValues(prev => ({ ...prev, stability: "" }))
    }
    onChange({
      ...filters,
      stability: filters.stability.filter((item) => item !== value)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 筛选选项 */}
      <div className="flex flex-col gap-4">
        {/* 业务单位 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">🏢</div>
          <Select
            value={currentValues.branch}
            onValueChange={(value) => handleMultiSelectChange("branch", value)}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择业务单位" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.branch.map((branch) => (
                <SelectItem key={branch} value={branch} className="text-xs">
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 国家线 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">🌏</div>
          <Select
            value={currentValues.countries}
            onValueChange={(value) => handleMultiSelectChange("countries", value)}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择国家" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.countries.map((country) => (
                <SelectItem key={country} value={country} className="text-xs">
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 专业 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">📚</div>
          <Select
            value={currentValues.majors}
            onValueChange={(value) => handleMultiSelectChange("majors", value)}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择专业" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.majors.map((major) => (
                <SelectItem key={major} value={major} className="text-xs">
                  {major}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 业务能力 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">💪</div>
          <Select
            value={currentValues.businessCapabilities}
            onValueChange={(value) => handleMultiSelectChange("businessCapabilities", value)}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择业务能力" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.businessCapabilities.map((capability) => (
                <SelectItem key={capability} value={capability} className="text-xs">
                  {capability}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 服务质量 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">⭐</div>
          <Select
            value={currentValues.serviceQualities}
            onValueChange={(value) => handleMultiSelectChange("serviceQualities", value)}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择服务质量" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.serviceQualities.map((quality) => (
                <SelectItem key={quality} value={quality} className="text-xs">
                  {quality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 稳定性 */}
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 flex items-center justify-center text-xs">🔒</div>
          <Select
            value={currentValues.stability}
            onValueChange={handleStabilityChange}
          >
            <SelectTrigger className="h-7 text-xs min-w-[180px]">
              <SelectValue placeholder="选择顾问资历" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {filterOptions.stability.map((item) => (
                <SelectItem key={item} value={item} className="text-xs">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 清空按钮 */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 px-2 text-xs"
          >
            清空
          </Button>
        )}
      </div>

      {/* 已选筛选条件 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {/* 业务单位标签 */}
          {filters.branch.map((branch) => (
            <Badge key={branch} variant="secondary" className="h-5 text-xs">
              {branch}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveItem("branch", branch)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {filters.countries.map((country) => (
            <Badge key={country} variant="secondary" className="h-5 text-xs">
              {country}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveItem("countries", country)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.majors.map((major) => (
            <Badge key={major} variant="secondary" className="h-5 text-xs">
              {major}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveItem("majors", major)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.businessCapabilities.map((capability) => (
            <Badge key={capability} variant="secondary" className="h-5 text-xs">
              {capability}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveItem("businessCapabilities", capability)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.serviceQualities.map((quality) => (
            <Badge key={quality} variant="secondary" className="h-5 text-xs">
              {quality}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveItem("serviceQualities", quality)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.stability.map((item) => (
            <Badge key={item} variant="secondary" className="h-5 text-xs">
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-0.5"
                onClick={() => handleRemoveStability(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 
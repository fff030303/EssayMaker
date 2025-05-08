"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format, isValid, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  // 用于存储输入框的值
  const [fromInput, setFromInput] = React.useState(
    date?.from ? format(date.from, "yyyy-MM-dd") : ""
  );
  const [toInput, setToInput] = React.useState(
    date?.to ? format(date.to, "yyyy-MM-dd") : ""
  );

  // 当日期范围变化时更新输入框
  React.useEffect(() => {
    setFromInput(date?.from ? format(date.from, "yyyy-MM-dd") : "");
    setToInput(date?.to ? format(date.to, "yyyy-MM-dd") : "");
  }, [date]);

  // 处理输入框变化
  const handleInputChange = (value: string, isFrom: boolean) => {
    if (isFrom) {
      setFromInput(value);
    } else {
      setToInput(value);
    }

    // 尝试解析日期
    const parsedDate = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsedDate)) {
      onDateChange({
        from: isFrom ? parsedDate : date?.from,
        to: isFrom ? date?.to : parsedDate,
      });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal h-9 whitespace-nowrap overflow-hidden",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "yyyy-MM-dd")} -{" "}
                    {format(date.to, "yyyy-MM-dd")}
                  </>
                ) : (
                  format(date.from, "yyyy-MM-dd")
                )
              ) : (
                <span>选择培训日期范围</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">开始日期</Label>
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={fromInput}
                  onChange={(e) => handleInputChange(e.target.value, true)}
                  className="h-8"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">结束日期</Label>
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={toInput}
                  onChange={(e) => handleInputChange(e.target.value, false)}
                  className="h-8"
                />
              </div>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  timeLimit: number; // 分钟
  onTimeUp: () => void;
}

export function ExamTimer({ timeLimit, onTimeUp }: ExamTimerProps) {
  const [remainingTime, setRemainingTime] = useState(timeLimit * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeUp]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  const getTimeColor = () => {
    if (remainingTime <= 300) return "text-destructive"; // 剩余5分钟显示红色
    if (remainingTime <= 600) return "text-warning"; // 剩余10分钟显示警告色
    return "text-muted-foreground";
  };

  return (
    <div className={`flex items-center gap-2 ${getTimeColor()}`}>
      <Clock className="h-4 w-4" />
      <span className="font-mono">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

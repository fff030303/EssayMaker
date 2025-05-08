"use client";

import { useState } from "react";
import { DisplayResult } from "../../types";

export function useResultState() {
  // 存储三个步骤的结果
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [secondStepResult, setSecondStepResult] =
    useState<DisplayResult | null>(null);
  const [finalResult, setFinalResult] = useState<DisplayResult | null>(null);

  return {
    result,
    setResult,
    secondStepResult,
    setSecondStepResult,
    finalResult,
    setFinalResult,
  };
}

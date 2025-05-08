"use client";

import { Question } from "@/types/quiz";
import { BooleanQuestionEditor } from "./BooleanQuestionEditor";
import { TextQuestionEditor } from "./TextQuestionEditor";
import { SingleQuestionEditor } from "./SingleQuestionEditor";
import { MultipleQuestionEditor } from "./MultipleQuestionEditor";

interface QuestionEditorFactoryProps {
  value: Question;
  onChange: (value: Question) => void;
  hideScore?: boolean;
}

export function QuestionEditorFactory({
  value,
  onChange,
  hideScore = false,
}: QuestionEditorFactoryProps) {
  // 转换answer为string类型
  const convertToStringAnswer = (
    question: Question
  ): Question & { answer: string } => {
    return {
      ...question,
      answer: Array.isArray(question.answer)
        ? question.answer.join(",")
        : question.answer,
    };
  };

  switch (value.type) {
    case "boolean":
      return (
        <BooleanQuestionEditor
          value={convertToStringAnswer(value)}
          onChange={onChange}
          hideScore={hideScore}
        />
      );
    case "text":
      return (
        <TextQuestionEditor
          value={convertToStringAnswer(value)}
          onChange={onChange}
          hideScore={hideScore}
        />
      );
    case "single":
      return (
        <SingleQuestionEditor
          value={convertToStringAnswer(value)}
          onChange={onChange}
          hideScore={hideScore}
        />
      );
    case "multiple":
      return (
        <MultipleQuestionEditor
          value={convertToStringAnswer(value)}
          onChange={onChange}
          hideScore={hideScore}
        />
      );
    default:
      return (
        <TextQuestionEditor
          value={convertToStringAnswer(value)}
          onChange={onChange}
          hideScore={hideScore}
        />
      );
  }
}

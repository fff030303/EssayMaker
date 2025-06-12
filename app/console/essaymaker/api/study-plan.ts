import { SearchRequest, SearchResponse } from "./common/types";

interface PromptTemplate {
  description: string;
  expected_output: string;
  backstory: string;
}

interface PromptConfig {
  [key: string]: PromptTemplate;
}

export const STUDY_PLAN_PROMPTS: PromptConfig = {
  default: {
    description: `作为一名专业的留学顾问，请根据学生的背景信息进行分析并提供合适的学校推荐。
分析内容应包括：
1. 学生的学术背景评估
2. 语言成绩评估
3. 软实力分析
4. 申请优势和劣势
5. 根据背景推荐合适的学校，并按reach/target/safety分类`,
    expected_output: `{\n  "analysis": "详细的背景分析...",\n  "strengths": ["优势1", "优势2", ...],\n  "weaknesses": ["劣势1", "劣势2", ...],\n  "reach": [{"school": "学校名称", "program": "专业名称"}],\n  "target": [{"school": "学校名称", "program": "专业名称"}],\n  "safety": [{"school": "学校名称", "program": "专业名称"}]\n}`,
    backstory: `你是一位拥有10年留学咨询经验的顾问，曾帮助数百名学生成功申请世界名校。
你熟悉各个国家的教育体系，了解不同学校的录取标准和特点。
你的建议总是基于学生的实际情况，既不会过分乐观也不会过分保守。
你会考虑学生的学术背景、语言成绩、课外活动、未来发展等多个维度来提供合理的建议。`,
  },

  comprehensive: {
    description: `请对学生背景进行全面深入的分析，并提供详细的申请策略建议。
分析维度包括：
1. 学术表现详细分析（GPA走势、重要课程成绩、专业排名等）
2. 标准化考试成绩评估（语言考试、GRE/GMAT等）
3. 科研/实习/竞赛经历评估
4. 软实力分析（领导力、创新能力、团队合作等）
5. 申请优劣势分析
6. 目标院校分析和推荐
7. 申请策略和时间规划`,
    expected_output: `{\n  "academic_analysis": {\n    "gpa_evaluation": "...",\n    "test_scores_evaluation": "...",\n    "research_experience": "...",\n    "internship_analysis": "..."\n  },\n  "strengths_weaknesses": {\n    "strengths": ["...", "..."],\n    "weaknesses": ["...", "..."],\n    "opportunities": ["...", "..."],\n    "threats": ["...", "..."]\n  },\n  "school_recommendations": {\n    "reach": [{"school": "...", "program": "...", "reason": "..."}],\n    "target": [{"school": "...", "program": "...", "reason": "..."}],\n    "safety": [{"school": "...", "program": "...", "reason": "..."}]\n  },\n  "application_strategy": {\n    "timeline": "...",\n    "focus_areas": ["...", "..."],\n    "recommendations": ["...", "..."]\n  }\n}`,
    backstory: `你是一位资深的留学咨询专家，拥有15年以上的咨询经验和丰富的成功案例。
你曾在多所顶尖大学的招生办公室工作，深入了解招生流程和决策标准。
你擅长帮助学生发掘自身特点和潜力，制定个性化的申请策略。
你的建议总是建立在详实的数据分析和丰富的行业经验之上。
你会考虑学生的长期发展和职业规划，而不仅仅关注录取概率。`,
  },
};

export function getPromptTemplate(
  type: keyof typeof STUDY_PLAN_PROMPTS = "default"
): PromptTemplate {
  return STUDY_PLAN_PROMPTS[type];
}

export async function analyzePlan(
  background: string,
  promptType: "default" | "comprehensive" = "default"
): Promise<SearchResponse> {
  const template = getPromptTemplate(promptType);

  const response = await fetch("/api/study-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      background,
      ...template,
    } as SearchRequest),
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}

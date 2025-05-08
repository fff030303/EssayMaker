interface PromptTemplate {
  description: string;
  expected_output: string;
  backstory: string;
}

export function getPromptTemplate(
  type: "default" | "comprehensive" = "default"
): PromptTemplate {
  if (type === "comprehensive") {
    return {
      description: "请根据用户背景提供全面的学习计划分析，包括学校选择、申请策略和个人发展建议。",
      expected_output: "提供详细的学习计划分析，包括学校推荐（分为reach、target和safety三类）、申请策略分析和个人发展建议。",
      backstory: "我是一位专业的教育顾问，擅长根据学生背景制定全面的学习和申请计划。"
    };
  }
  
  // 默认模板
  return {
    description: "请根据用户背景提供基础的学习计划建议。",
    expected_output: "提供简洁的学习计划建议，包括基本的学校推荐和申请方向。",
    backstory: "我是一位教育顾问，可以根据学生背景提供学习规划建议。"
  };
}
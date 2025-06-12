// 导入所有拆分的方法
import { query, streamQuery } from "./query";
import {
  streamPSRevision,
  streamFinalPS,
  streamFinalDraftWithFiles,
} from "./personal-statement";
import { generateResume, formatResume } from "./resume";
import {
  generateRecommendationLetter,
  formatRecommendationLetter,
} from "./recommendation-letter";
import {
  streamSectionalQuery,
  streamEssayRewriteSearchAndAnalyze,
  streamEssayRewriteGenerateStrategy,
  streamEssayRewriteRewriteEssay,
  generateEssayRewriteStrategy,
} from "./essay-rewrite";
import { streamNetworkingQuery } from "./networking";
import { streamGeneralQuery } from "./general";

// 重新组装成原始的apiService结构
export const apiService = {
  // 基础查询方法
  query,
  streamQuery,

  // 个人陈述相关方法
  streamPSRevision,
  streamFinalPS,
  streamFinalDraftWithFiles,

  // 简历相关方法
  generateResume,
  formatResume,

  // 推荐信相关方法
  generateRecommendationLetter,
  formatRecommendationLetter,

  // Essay重写相关方法
  streamSectionalQuery,
  streamEssayRewriteSearchAndAnalyze,
  streamEssayRewriteGenerateStrategy,
  streamEssayRewriteRewriteEssay,
  generateEssayRewriteStrategy,

  // 套瓷助理方法
  streamNetworkingQuery,

  // 通用咨询方法
  streamGeneralQuery,
};

// 重新导出独立的analyzePlan方法（原始代码中在apiService外部）
export { analyzePlan } from "./study-plan";

// 重新导出类型定义
export type {
  SchoolInfo,
  Schools,
  AnalysisData,
  SearchRequest,
  SearchResponse,
} from "./common/types";
export type { AxiosResponse, AxiosError } from "axios";

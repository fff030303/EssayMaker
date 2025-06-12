export interface SchoolInfo {
  school: string;
  program: string;
}

export interface Schools {
  reach: SchoolInfo[];
  target: SchoolInfo[];
  safety: SchoolInfo[];
}

export interface AnalysisData {
  application_analysis: string | Record<string, any>;
  label_analysis?: string;
  schools?: Schools;
}

export interface SearchRequest {
  background: string;
  description: string;
  expected_output: string;
  backstory: string;
}

export interface SearchResponse {
  status: string;
  data?: AnalysisData;
  message: string;
}

export type { AxiosResponse, AxiosError } from "axios";

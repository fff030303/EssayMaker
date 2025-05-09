import { getPromptTemplate } from "./prompts/study-plan";
import axios from "axios";

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

// 创建axios实例
const getApiKey = () => {
  // 尝试从不同的环境变量获取API Key
  const key = process.env.NEXT_PUBLIC_AGENT_FORGE_KEY || process.env.NEXT_PUBLIC_NEWKB_API_KEY;
  if (!key) {
    console.warn("API Key not found in environment variables");
    return "";
  }
  // 清理和获取第一个有效的key
  const cleanKey = key.split(",")[0].trim();
  // console.log("Using API Key:", cleanKey); // 添加调试信息
  return cleanKey;
};

const getApiUrl = () => {
  if (process.env.NODE_ENV === "production") {
    // 生产环境使用线上域名
    const url = process.env.NEXT_PUBLIC_AGENT_FORGE_URL;
    if (!url) {
      console.error("NEXT_PUBLIC_AGENT_FORGE_URL 环境变量未设置!");
      return "https://agentforge-production.up.railway.app"; // 使用实际的生产环境域名
    }
    return url;
  } else {
    // 开发环境使用本地域名
    const url = process.env.NEXT_PUBLIC_AGENT_FORGE_URL;
    if (!url) {
      console.error("NEXT_PUBLIC_AGENT_FORGE_URL 环境变量未设置!");
      return "http://localhost:8000";
    }
    return url;
  }
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": getApiKey(),
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error("No API key available for request");
    } else {
      config.headers = config.headers || {};
      config.headers["X-API-Key"] = apiKey;
      // 调试信息
      // const requestUrl = [config.baseURL, config.url].filter(Boolean).join("");
      // console.log("Request URL:", requestUrl);
      // console.log("Request headers:", config.headers); // 添加完整的headers调试
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// API方法封装
export const apiService = {
  // 普通查询
  async query(queryText: string, metadata?: any) {
    try {
      const response = await api.post("/api/query", {
        query: queryText,
        metadata,
      });
      return response.data;
    } catch (error) {
      console.error("Query API error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Response:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
      }
      throw error;
    }
  },

  // 流式查询
  async streamQuery(queryText: string, metadata?: any, files?: File[], transcriptFiles?: File[]) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("尝试连接API:", apiUrl);
      console.log("API密钥存在:", !!apiKey);
      console.log("初稿文件数量:", files?.length || 0);
      console.log("成绩单文件数量:", transcriptFiles?.length || 0);

      // 设置请求超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

      // 添加本地模拟数据支持
      if (process.env.NODE_ENV === "development" && (apiUrl.includes("localhost") || !apiKey)) {
        console.warn("使用本地模拟数据进行开发测试");
        clearTimeout(timeoutId);
        
        return new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            let mockData = "这是模拟数据。在开发环境中，API服务器不可用或API密钥无效时会显示此消息。\n\n" +
                           "您的查询是: " + queryText + "\n\n";
            
            // 添加文件信息到模拟数据
            if (files && files.length > 0) {
              mockData += `上传的初稿文件: ${files.map(f => f.name).join(', ')}\n\n`;
            }
            
            if (transcriptFiles && transcriptFiles.length > 0) {
              mockData += `上传的成绩单文件: ${transcriptFiles.map(f => f.name).join(', ')}\n\n`;
            }
            
            mockData += "请确保:\n" +
                        "1. 您的网络连接正常\n" +
                        "2. API服务器地址正确\n" +
                        "3. API密钥有效";
            
            // 模拟流式响应
            const sendChunk = (text: string, index: number) => {
              if (index < text.length) {
                const chunk = text.slice(index, index + 10);
                controller.enqueue(encoder.encode(chunk));
                setTimeout(() => sendChunk(text, index + 10), 50);
              } else {
                controller.close();
              }
            };
            
            sendChunk(mockData, 0);
          }
        });
      }

      // 检查是否有文件需要上传
      const hasFiles = (files && files.length > 0) || (transcriptFiles && transcriptFiles.length > 0);
      
      // 根据是否有文件选择不同的请求方式
      let response;
      
      if (hasFiles) {
        try {
          // 准备文件上传所需的FormData
          const formData = new FormData();
          
          // 添加元数据（需要转换为JSON字符串）
          if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
          }
          
          // 添加查询文本
          formData.append('query', queryText);
          
          // 添加初稿文件 - 只添加第一个文件作为material_file
          if (files && files.length > 0) {
            formData.append('material_file', files[0], files[0].name);
            console.log(`添加初稿文件: ${files[0].name} (${files[0].size} bytes)`);
          }
          
          // 添加成绩单文件 - 可以有多个
          if (transcriptFiles && transcriptFiles.length > 0) {
            transcriptFiles.forEach((file) => {
              formData.append('transcript_files', file, file.name);
              console.log(`添加成绩单文件: ${file.name} (${file.size} bytes)`);
            });
          }
          
          // 尝试使用文件上传专用端点
          console.log("正在使用文件上传端点:", `${apiUrl}/api/ps-initial-draft/simplify-material`);
          
          // 打印上传的表单数据
          for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
              console.log(`FormData: ${key}: File - ${value.name} (${value.size} bytes)`);
            } else {
              console.log(`FormData: ${key}: ${value}`);
            }
          }
          
          response = await fetch(`${apiUrl}/api/ps-initial-draft/simplify-material`, {
            method: "POST",
            headers: {
              // 不需要设置Content-Type，浏览器会自动添加正确的Content-Type和boundary
              "X-API-Key": apiKey,
            },
            body: formData,
            signal: controller.signal,
          });
        } catch (error) {
          console.error("文件上传端点请求失败，尝试使用标准端点...", error);
          
          // 如果文件上传端点请求失败，添加警告日志
          const fileNamesInfo = [];
          if (files && files.length > 0) {
            fileNamesInfo.push(`初稿文件: ${files.map(f => f.name).join(', ')}`);
          }
          if (transcriptFiles && transcriptFiles.length > 0) {
            fileNamesInfo.push(`成绩单文件: ${transcriptFiles.map(f => f.name).join(', ')}`);
          }
          
          console.warn(`⚠️ 服务器可能不支持文件上传，将忽略以下文件: ${fileNamesInfo.join('; ')}`);
          
          // 退回到标准JSON请求
          response = await fetch(`${apiUrl}/api/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey,
            },
            body: JSON.stringify({
              query: `${queryText} [上传文件失败，服务器不支持文件上传。${fileNamesInfo.join('; ')}]`,
              metadata,
            }),
            signal: controller.signal,
          });
        }
      } else {
        // 没有文件，使用标准JSON请求
        response = await fetch(`${apiUrl}/api/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify({
            query: queryText,
            metadata,
          }),
          signal: controller.signal,
        });
      }

      // 清除超时计时器
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("Stream response status:", response.status);
        console.error("Stream response status text:", response.statusText);
        console.error(
          "Stream response headers:",
          Object.fromEntries(response.headers)
        );

        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("Stream error details:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      // 确保响应体存在
      if (!response.body) {
        throw new Error("Response body is null");
      }

      return response.body;
    } catch (error: unknown) {
      // 区分不同类型的错误
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Stream API request timed out");
        throw new Error("请求超时，请稍后重试");
      } else if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        console.error("Network error:", error);
        throw new Error("网络连接错误，请检查您的网络连接");
      } else {
        console.error("Stream API error:", error);
        throw error;
      }
    }
  },

  // 个人陈述修改流式API
  async streamPSRevision(data: { original_ps: string; program_info: string }) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("PS Revision request configuration:", {
        url: `${apiUrl}/api/ps-revision`,
        apiKeyPresent: !!apiKey,
        dataLength: {
          original_ps: data.original_ps.length,
          program_info: data.program_info.length,
        },
      });

      const response = await fetch(`${apiUrl}/api/ps-revision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error("PS Revision response status:", response.status);
        console.error("PS Revision response status text:", response.statusText);
        console.error(
          "PS Revision response headers:",
          Object.fromEntries(response.headers)
        );

        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("PS Revision error details:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      return response.body;
    } catch (error) {
      console.error("PS Revision API error:", error);
      throw error;
    }
  },

  // 最终文章生成流式API
  async streamFinalPS(data: {
    program_info: string;
    original_ps: string;
    rewrite_strategy: string;
  }) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("Final PS request configuration:", {
        url: `${apiUrl}/api/ps-final`,
        apiKeyPresent: !!apiKey,
        dataLength: {
          program_info: data.program_info.length,
          original_ps: data.original_ps.length,
          rewrite_strategy: data.rewrite_strategy.length,
        },
      });

      const response = await fetch(`${apiUrl}/api/ps-final`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error("Final PS response status:", response.status);
        console.error("Final PS response status text:", response.statusText);
        console.error(
          "Final PS response headers:",
          Object.fromEntries(response.headers)
        );

        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("Final PS error details:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      return response.body;
    } catch (error) {
      console.error("Final PS API error:", error);
      throw error;
    }
  },

  // 添加一个新的最终初稿生成流式API，适应新的API格式
  async streamFinalDraftWithFiles(params: {
    simplified_material: string;
    transcript_files: File[];
    combined_requirements: string;
  }) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("Final Draft request configuration:", {
        url: `${apiUrl}/api/ps-initial-draft/generate-content`,
        apiKeyPresent: !!apiKey,
        simplified_material_length: params.simplified_material.length,
        transcript_files_count: params.transcript_files.length,
        combined_requirements_length: params.combined_requirements.length,
      });
      
      // 使用FormData格式提交
      const formData = new FormData();
      
      // 添加简化的素材
      formData.append('simplified_material', params.simplified_material);
      
      // 添加申请方向+定制需求
      formData.append('combined_requirements', params.combined_requirements);
      
      // 添加成绩单文件
      if (params.transcript_files.length > 0) {
        params.transcript_files.forEach((file) => {
          formData.append('transcript_files', file);
        });
        
        // 打印上传的文件信息，便于调试
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
          }
        }
      }
      
      const response = await fetch(`${apiUrl}/api/ps-initial-draft/generate-content`, {
        method: "POST",
        headers: {
          // 不设置Content-Type，由浏览器自动处理FormData边界
          "X-API-Key": apiKey,
        },
        body: formData,
      });
      
      if (!response.ok) {
        console.error("Final Draft response status:", response.status);
        console.error("Final Draft response status text:", response.statusText);
        console.error(
          "Final Draft response headers:",
          Object.fromEntries(response.headers)
        );
        
        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("Final Draft error details:", errorText);
        
        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }
      
      return response.body;
    } catch (error) {
      console.error("Final Draft API error:", error);
      throw error;
    }
  },
};

export type { AxiosResponse, AxiosError } from "axios";

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

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
  const key =
    process.env.NEXT_PUBLIC_AGENT_FORGE_KEY ||
    process.env.NEXT_PUBLIC_NEWKB_API_KEY;
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
  async streamQuery(
    queryText: string,
    metadata?: any,
    files?: File[],
    transcriptFiles?: File[]
  ) {
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

      // 检查是否有文件需要上传
      const hasFiles =
        (files && files.length > 0) ||
        (transcriptFiles && transcriptFiles.length > 0);

      // 根据是否有文件选择不同的请求方式
      let response;

      if (hasFiles) {
        try {
          // 准备文件上传所需的FormData
          const formData = new FormData();

          // 添加元数据（需要转换为JSON字符串）
          if (metadata) {
            formData.append("metadata", JSON.stringify(metadata));
          }

          // 添加查询文本
          formData.append("query", queryText);

          // 添加初稿文件 - 只添加第一个文件作为material_file
          if (files && files.length > 0) {
            formData.append("material_file", files[0], files[0].name);
            console.log(
              `添加初稿文件: ${files[0].name} (${files[0].size} bytes)`
            );
          }

          // 添加成绩单文件 - 可以有多个
          if (transcriptFiles && transcriptFiles.length > 0) {
            transcriptFiles.forEach((file) => {
              formData.append("transcript_files", file, file.name);
              console.log(`添加成绩单文件: ${file.name} (${file.size} bytes)`);
            });
          }

          // 尝试使用文件上传专用端点
          console.log(
            "正在使用文件上传端点:",
            `${apiUrl}/api/ps-initial-draft/simplify-material`
          );

          // 打印上传的表单数据
          for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
              console.log(
                `FormData: ${key}: File - ${value.name} (${value.size} bytes)`
              );
            } else {
              console.log(`FormData: ${key}: ${value}`);
            }
          }

          response = await fetch(
            `${apiUrl}/api/ps-initial-draft/simplify-material`,
            {
              method: "POST",
              headers: {
                // 不需要设置Content-Type，浏览器会自动添加正确的Content-Type和boundary
                "X-API-Key": apiKey,
              },
              body: formData,
              signal: controller.signal,
            }
          );
        } catch (error) {
          console.error("文件上传端点请求失败，尝试使用标准端点...", error);

          // 如果文件上传端点请求失败，添加警告日志
          const fileNamesInfo = [];
          if (files && files.length > 0) {
            fileNamesInfo.push(
              `初稿文件: ${files.map((f) => f.name).join(", ")}`
            );
          }
          if (transcriptFiles && transcriptFiles.length > 0) {
            fileNamesInfo.push(
              `成绩单文件: ${transcriptFiles.map((f) => f.name).join(", ")}`
            );
          }

          console.warn(
            `⚠️ 服务器可能不支持文件上传，将忽略以下文件: ${fileNamesInfo.join(
              "; "
            )}`
          );

          // 退回到标准JSON请求
          response = await fetch(`${apiUrl}/api/stream`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey,
            },
            body: JSON.stringify({
              query: `${queryText} [上传文件失败，服务器不支持文件上传。${fileNamesInfo.join(
                "; "
              )}]`,
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
    transcript_analysis?: string; // 修改为成绩单解析文本而不是文件
    combined_requirements: string;
  }) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("=============初稿生成请求配置=============");
      console.log(
        "API URL:",
        `${apiUrl}/api/ps-initial-draft/generate-content`
      );
      console.log("API Key存在:", !!apiKey);
      console.log("简化素材长度:", params.simplified_material.length);
      console.log("成绩单解析长度:", params.transcript_analysis?.length || 0);
      console.log("需求信息长度:", params.combined_requirements.length);

      // 使用FormData格式提交
      const formData = new FormData();

      // 添加简化的素材
      formData.append("simplified_material", params.simplified_material);
      console.log(
        "【素材内容前200字符】:",
        params.simplified_material.substring(0, 200) + "..."
      );

      // 添加申请方向+定制需求
      formData.append("combined_requirements", params.combined_requirements);
      console.log("【申请需求完整内容】:", params.combined_requirements);

      // 添加成绩单解析结果（如果有）
      if (params.transcript_analysis) {
        formData.append("transcript_analysis", params.transcript_analysis);
        console.log(
          "【成绩单解析前200字符】:",
          params.transcript_analysis.substring(0, 200) + "..."
        );
      } else {
        console.log("【未提供成绩单解析】");
      }

      console.log("=============FormData内容=============");
      // 打印上传的表单数据
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === "string" && value.length > 500) {
          console.log(
            `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
              0,
              50
            )}...)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log("======================================");

      const response = await fetch(
        `${apiUrl}/api/ps-initial-draft/generate-content`,
        {
          method: "POST",
          headers: {
            // 不设置Content-Type，由浏览器自动处理FormData边界
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

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

  // 简历生成API
  async generateResume(
    resumeMaterial: File, 
    supportFiles: File[] = [],
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("准备生成简历, API地址:", apiUrl);
      console.log("简历材料文件:", resumeMaterial.name);
      console.log("支持文件数量:", supportFiles.length);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt,
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append("resume_material", resumeMaterial);

      // 添加支持文件
      supportFiles.forEach((file, index) => {
        formData.append(`support_files`, file);
        console.log(`支持文件 ${index + 1}:`, file.name);
      });

      // 添加自定义提示词参数
      formData.append("custom_role_prompt", customRolePrompt);
      formData.append("custom_task_prompt", customTaskPrompt);
      formData.append("custom_output_format_prompt", customOutputFormatPrompt);

      const response = await fetch(
        `${apiUrl}/api/resume-writer/generate-resume`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("请求失败详情:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(
          `CV生成失败: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // 判断响应类型
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        console.log("接收到流式响应");
        return response.body;
      } else {
        console.log("接收到普通响应");
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("生成简历时出错:", error);
      throw error;
    }
  },

  // 生成推荐信
  async generateRecommendationLetter(
    resumeMaterial: File,
    writing_requirements: string,
    recommenderNumber: string,
    supportFiles: File[] = [],
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("准备生成推荐信, API地址:", apiUrl);
      console.log("推荐信素材文件:", resumeMaterial.name);
      console.log("推荐人数量:", recommenderNumber);
      console.log("支持文件数量:", supportFiles.length);
      console.log("写作需求:", writing_requirements);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt,
      });

      // 创建FormData对象用于上传文件
      const formData = new FormData();
      // 使用recommendation_material作为推荐信素材文件字段名
      formData.append(
        "recommendation_material",
        resumeMaterial,
        resumeMaterial.name
      );

      // 添加支持文件，使用support_files作为字段名
      if (supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append("support_files", file, file.name);
          console.log(`添加支持文件${index + 1}: ${file.name}`);
        });
      }

      // 使用writing_requirements作为写作需求字段名
      formData.append("writing_requirements", writing_requirements);
      
      // 添加推荐人数量
      formData.append("recommender_number", recommenderNumber);

      // 添加自定义提示词
      formData.append("custom_role_prompt", customRolePrompt);
      formData.append("custom_task_prompt", customTaskPrompt);
      formData.append("custom_output_format_prompt", customOutputFormatPrompt);

      // 使用正确的API端点路径
      const response = await fetch(
        `${apiUrl}/api/recommendation-letter/generate-letter`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // 对422错误提供更具体的提示
        if (response.status === 422) {
          try {
            const errorDetail = JSON.parse(errorText);
            const missingFields = errorDetail.detail
              .filter((err: any) => err.type === "missing")
              .map((err: any) => err.loc[err.loc.length - 1])
              .join(", ");

            if (missingFields) {
              throw new Error(
                `推荐信生成失败: 请求缺少必要字段 - ${missingFields}`
              );
            }
          } catch (parseError) {
            // JSON解析失败，使用原始错误信息
            console.error("解析错误响应失败:", parseError);
          }
        }
        throw new Error(
          `推荐信生成失败: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      // 判断响应类型
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        console.log("接收到流式响应");
        return response.body;
      } else {
        console.log("接收到普通响应");
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("生成推荐信时出错:", error);
      throw error;
    }
  },

  // 简历格式化API
  async formatResume(
    rawResume: string,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("准备格式化简历, API地址:", apiUrl);
      console.log("原始简历内容长度:", rawResume.length);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt,
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append("raw_resume", rawResume);
      formData.append("custom_role_prompt", customRolePrompt);
      formData.append("custom_task_prompt", customTaskPrompt);
      formData.append("custom_output_format_prompt", customOutputFormatPrompt);

      // 打印上传的表单数据
      for (let [key, value] of formData.entries()) {
        if (typeof value === "string" && value.length > 500) {
          console.log(
            `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
              0,
              50
            )}...)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(
        `${apiUrl}/api/resume-writer/format-resume`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        console.error("Format Resume response status:", response.status);
        console.error(
          "Format Resume response status text:",
          response.statusText
        );
        console.error(
          "Format Resume response headers:",
          Object.fromEntries(response.headers)
        );

        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("Format Resume error details:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      // 判断响应类型
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        console.log("接收到流式响应");
        return response.body;
      } else {
        console.log("接收到普通响应");
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("Format Resume API error:", error);
      throw error;
    }
  },

  // 推荐信格式化API
  async formatRecommendationLetter(
    rawLetter: string,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = "",
    writing_requirements: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("准备格式化推荐信, API地址:", apiUrl);
      console.log("原始推荐信内容长度:", rawLetter.length);
      console.log("写作需求:", writing_requirements);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt,
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append("raw_letter", rawLetter);
      formData.append("custom_role_prompt", customRolePrompt);
      formData.append("custom_task_prompt", customTaskPrompt);
      formData.append("custom_output_format_prompt", customOutputFormatPrompt);
      formData.append("writing_requirements", writing_requirements);

      // 打印上传的表单数据
      for (let [key, value] of formData.entries()) {
        if (typeof value === "string" && value.length > 500) {
          console.log(
            `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
              0,
              50
            )}...)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(
        `${apiUrl}/api/recommendation-letter/format-letter`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        console.error("Format Letter response status:", response.status);
        console.error(
          "Format Letter response status text:",
          response.statusText
        );
        console.error(
          "Format Letter response headers:",
          Object.fromEntries(response.headers)
        );

        const errorText = await response
          .text()
          .catch(() => "No error text available");
        console.error("Format Letter error details:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status}, details: ${errorText}`
        );
      }

      // 判断响应类型
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        console.log("接收到流式响应");
        return response.body;
      } else {
        console.log("接收到普通响应");
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("Format Letter API error:", error);
      throw error;
    }
  },

  // PS分稿助理专用API - 只调用搜索分析（第一步）
  async streamSectionalQuery(
    queryText: string,
    files?: File[],
    courseInfo?: string
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("PS分稿助理API调用 - 第一步搜索分析:", {
        url: `${apiUrl}/api/ps-final-draft/search-and-analyze`,
        queryLength: queryText.length,
        filesCount: files?.length || 0,
        hasCourseInfo: !!courseInfo,
      });

      // 准备搜索分析的用户输入
      let searchUserInput = queryText;
      if (courseInfo) {
        searchUserInput = `${queryText}\n\n课程信息：${courseInfo}`;
      }

      // 第一个文件作为原始初稿文件，其余作为支持文件
      const supportFiles = files ? files.slice(1) : [];

      // 调用第一步：搜索分析API
      return await this.streamEssayRewriteSearchAndAnalyze(
        searchUserInput,
        supportFiles
      );
    } catch (error) {
      console.error("PS分稿助理API调用失败:", error);
      throw error;
    }
  },

  // 第一步：Essay重写搜索分析API
  async streamEssayRewriteSearchAndAnalyze(
    userInput: string,
    supportFiles: File[] = [],
    customWebSearcherRole: string = "",
    customWebSearcherTask: string = "",
    customWebSearcherOutputFormat: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("Essay重写搜索分析API调用:", {
        url: `${apiUrl}/api/ps-final-draft/search-and-analyze`,
        userInputLength: userInput.length,
        supportFilesCount: supportFiles.length,
        hasCustomPrompts: !!(customWebSearcherRole || customWebSearcherTask || customWebSearcherOutputFormat)
      });

      // 创建FormData对象
      const formData = new FormData();

      // 添加必需参数
      formData.append("user_input", userInput);

      // 添加支持文件（如果有）
      if (supportFiles && supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append("support_files", file, file.name);
          console.log(`添加支持文件${index + 1}: ${file.name}`);
        });
      }

      // 添加自定义提示词参数
      formData.append("custom_web_searcher_role", customWebSearcherRole);
      formData.append("custom_web_searcher_task", customWebSearcherTask);
      formData.append("custom_web_searcher_output_format", customWebSearcherOutputFormat);

      // 打印FormData内容用于调试
      console.log("Essay重写搜索分析FormData内容:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === "string" && value.length > 100) {
          console.log(
            `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
              0,
              50
            )}...)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(
        `${apiUrl}/api/ps-final-draft/search-and-analyze`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Essay重写搜索分析API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `Essay重写搜索分析失败: ${response.status} - ${errorText}`
        );
      }

      return response.body;
    } catch (error) {
      console.error("Essay重写搜索分析API调用失败:", error);
      throw error;
    }
  },

  // 第二步：Essay重写策略生成API
  async streamEssayRewriteGenerateStrategy(
    searchResult: string,
    originalEssayFile: File,
    analysisResult: string = "",
    customStrategyGeneratorRole: string = "",
    customStrategyGeneratorTask: string = "",
    customStrategyGeneratorOutputFormat: string = "",
    personalizationRequirements: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("Essay重写策略生成API调用:", {
        url: `${apiUrl}/api/ps-final-draft/generate-strategy`,
        searchResultLength: searchResult.length,
        originalEssayFile: originalEssayFile.name,
        analysisResultLength: analysisResult.length,
        hasCustomPrompts: !!(customStrategyGeneratorRole || customStrategyGeneratorTask || customStrategyGeneratorOutputFormat),
        personalizationRequirements: personalizationRequirements,
        personalizationRequirementsLength: personalizationRequirements.length,
      });

      // 创建FormData对象
      const formData = new FormData();
      
      // 添加必需参数
      formData.append("search_result", searchResult);
      formData.append("original_essay_file", originalEssayFile, originalEssayFile.name);

      // 添加可选参数
      formData.append("analysis_result", analysisResult);

      // 添加自定义提示词参数
      formData.append("custom_strategy_generator_role", customStrategyGeneratorRole);
      formData.append("custom_strategy_generator_task", customStrategyGeneratorTask);
      formData.append("custom_strategy_generator_output_format", customStrategyGeneratorOutputFormat);

      // 🆕 新增：添加个性化需求参数
      formData.append("personalization_requirements", personalizationRequirements);

      // 打印FormData内容用于调试
      console.log("Essay重写策略生成FormData内容:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === "string" && value.length > 100) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(`${apiUrl}/api/ps-final-draft/generate-strategy`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Essay重写策略生成API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Essay重写策略生成失败: ${response.status} - ${errorText}`);
      }

      return response.body;
    } catch (error) {
      console.error("Essay重写策略生成API调用失败:", error);
      throw error;
    }
  },

  // 第三步：Essay重写API
  async streamEssayRewriteRewriteEssay(
    rewriteStrategy: string,
    originalEssayFile: File,
    customEssayRewriterRole: string = "",
    customEssayRewriterTask: string = "",
    customEssayRewriterOutputFormat: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("Essay重写API调用:", {
        url: `${apiUrl}/api/ps-final-draft/rewrite-essay`,
        rewriteStrategyLength: rewriteStrategy.length,
        originalEssayFile: originalEssayFile.name,
        hasCustomPrompts: !!(customEssayRewriterRole || customEssayRewriterTask || customEssayRewriterOutputFormat)
      });

      // 创建FormData对象
      const formData = new FormData();
      
      // 添加必需参数
      formData.append("rewrite_strategy", rewriteStrategy);
      formData.append("original_essay_file", originalEssayFile, originalEssayFile.name);

      // 添加自定义提示词参数
      formData.append("custom_essay_rewriter_role", customEssayRewriterRole);
      formData.append("custom_essay_rewriter_task", customEssayRewriterTask);
      formData.append("custom_essay_rewriter_output_format", customEssayRewriterOutputFormat);

      // 打印FormData内容用于调试
      console.log("Essay重写FormData内容:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === "string" && value.length > 100) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(`${apiUrl}/api/ps-final-draft/rewrite-essay`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Essay重写API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Essay重写失败: ${response.status} - ${errorText}`);
      }

      return response.body;
    } catch (error) {
      console.error("Essay重写API调用失败:", error);
      throw error;
    }
  },

  // 套瓷助理专用API - 用于学术套瓷和教授联系
  async streamNetworkingQuery(queryText: string, files?: File[]) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("套瓷助理API调用:", {
        url: `${apiUrl}/api/stream`,
        queryLength: queryText.length,
        filesCount: files?.length || 0,
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append("query", queryText);

      // 添加文件（如果有）
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append("support_files", file, file.name);
          console.log(`添加支持文件${index + 1}: ${file.name}`);
        });
      }

      const response = await fetch(`${apiUrl}/api/academic-networking`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("套瓷助理API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`套瓷助理请求失败: ${response.status} - ${errorText}`);
      }

      return response.body;
    } catch (error) {
      console.error("套瓷助理API调用失败:", error);
      throw error;
    }
  },

  // 随便问问专用API - 用于通用问题咨询
  async streamGeneralQuery(queryText: string, files?: File[]) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("随便问问API调用:", {
        url: `${apiUrl}/api/general-consultation`,
        queryLength: queryText.length,
        filesCount: files?.length || 0,
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append("query", queryText);

      // 添加文件（如果有）
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append("support_files", file, file.name);
          console.log(`添加支持文件${index + 1}: ${file.name}`);
        });
      }

      const response = await fetch(`${apiUrl}/api/general-consultation`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("随便问问API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(`随便问问请求失败: ${response.status} - ${errorText}`);
      }

      return response.body;
    } catch (error) {
      console.error("随便问问API调用失败:", error);
      throw error;
    }
  },

  // Essay重写策略生成API
  async generateEssayRewriteStrategy(
    userInput: string,
    originalEssayFile: File,
    supportFiles: File[] = [],
    customWebSearcherRole: string = "",
    customWebSearcherTask: string = "",
    customStrategyGeneratorRole: string = "",
    customStrategyGeneratorTask: string = "",
    customStrategyGeneratorOutputFormat: string = ""
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("Essay重写策略生成API调用:", {
        url: `${apiUrl}/api/ps-final-draft/generate-strategy`,
        userInputLength: userInput.length,
        originalEssayFile: originalEssayFile.name,
        supportFilesCount: supportFiles.length,
        hasCustomPrompts: !!(
          customWebSearcherRole ||
          customWebSearcherTask ||
          customStrategyGeneratorRole ||
          customStrategyGeneratorTask ||
          customStrategyGeneratorOutputFormat
        ),
      });

      // 创建FormData对象
      const formData = new FormData();

      // 添加必需参数
      formData.append("user_input", userInput);
      formData.append(
        "original_essay_file",
        originalEssayFile,
        originalEssayFile.name
      );

      // 添加支持文件（如果有）
      if (supportFiles && supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append("support_files", file, file.name);
          console.log(`添加支持文件${index + 1}: ${file.name}`);
        });
      }

      // 添加自定义提示词参数
      formData.append("custom_web_searcher_role", customWebSearcherRole);
      formData.append("custom_web_searcher_task", customWebSearcherTask);
      formData.append(
        "custom_strategy_generator_role",
        customStrategyGeneratorRole
      );
      formData.append(
        "custom_strategy_generator_task",
        customStrategyGeneratorTask
      );
      formData.append(
        "custom_strategy_generator_output_format",
        customStrategyGeneratorOutputFormat
      );

      // 打印FormData内容用于调试
      console.log("Essay重写策略FormData内容:");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === "string" && value.length > 100) {
          console.log(
            `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
              0,
              50
            )}...)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(
        `${apiUrl}/api/ps-final-draft/generate-strategy`,
        {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Essay重写策略API错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `Essay重写策略生成失败: ${response.status} - ${errorText}`
        );
      }

      // 判断响应类型
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("text/event-stream")) {
        console.log("接收到流式响应");
        return response.body;
      } else {
        console.log("接收到普通响应");
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error("Essay重写策略API调用失败:", error);
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

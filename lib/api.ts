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
  /**
   * 通用查询API - 用于基础的文本查询功能
   * 适用场景：简单的问答查询
   */
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

  /**
   * 流式查询API - 用于需要实时响应的查询功能
   * 适用场景：长文本生成、实时对话等需要流式输出的场景
   * 支持文件上传功能
   */
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

  /**
   * 个人陈述修改流式API - PS助理第二步
   * 功能：基于原始个人陈述和项目信息，生成修改建议和策略
   * 输入：原始个人陈述文本 + 项目信息
   * 输出：修改建议和重写策略
   */
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

  /**
   * 最终个人陈述生成流式API - PS助理第三步
   * 功能：基于项目信息、原始个人陈述和重写策略，生成最终的个人陈述
   * 输入：项目信息 + 原始个人陈述 + 重写策略
   * 输出：最终优化后的个人陈述
   */
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

  /**
   * 初稿生成流式API - PS助理第一步的最终生成
   * 功能：基于简化的素材、成绩单解析和申请需求，生成个人陈述初稿
   * 输入：简化素材 + 成绩单解析（可选）+ 申请需求
   * 输出：个人陈述初稿
   */
  async streamFinalDraftWithFiles(params: {
    simplified_material: string;
    transcript_analysis?: string; // 修改为成绩单解析文本而不是文件
    combined_requirements: string;
  }) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("=============初稿生成请求配置=============");
      console.log("API URL:", `${apiUrl}/api/ps-initial-draft/generate-content`);
      console.log("API Key存在:", !!apiKey);
      console.log("简化素材长度:", params.simplified_material.length);
      console.log("成绩单解析长度:", params.transcript_analysis?.length || 0);
      console.log("需求信息长度:", params.combined_requirements.length);
      
      // 使用FormData格式提交
      const formData = new FormData();
      
      // 添加简化的素材
      formData.append('simplified_material', params.simplified_material);
      console.log("【素材内容前200字符】:", params.simplified_material.substring(0, 200) + "...");
      
      // 添加申请方向+定制需求
      formData.append('combined_requirements', params.combined_requirements);
      console.log("【申请需求完整内容】:", params.combined_requirements);
      
      // 添加成绩单解析结果（如果有）
      if (params.transcript_analysis) {
        formData.append('transcript_analysis', params.transcript_analysis);
        console.log("【成绩单解析前200字符】:", params.transcript_analysis.substring(0, 200) + "...");
      } else {
        console.log("【未提供成绩单解析】");
      }
      
      console.log("=============FormData内容=============");
      // 打印上传的表单数据
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else if (typeof value === 'string' && value.length > 500) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log("======================================");
      
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

  /**
   * 简历生成API - CV助理第一步
   * 功能：基于简历素材文件和支持文件，生成优化的简历内容
   * 输入：简历素材文件 + 支持文件（可选）+ 自定义提示词（可选）
   * 输出：优化后的简历内容和建议
   */
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
      console.log("简历素材文件:", resumeMaterial.name);
      console.log("支持文件数量:", supportFiles.length);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt
      });

      // 创建FormData对象用于上传文件
      const formData = new FormData();
      formData.append('resume_material', resumeMaterial, resumeMaterial.name);
      
      // 添加支持文件
      if (supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append('support_files', file, file.name);
          console.log(`添加支持文件${index+1}: ${file.name}`);
        });
      }

      // 添加自定义提示词
      formData.append('custom_role_prompt', customRolePrompt);
      formData.append('custom_task_prompt', customTaskPrompt);
      formData.append('custom_output_format_prompt', customOutputFormatPrompt);

      const response = await fetch(`${apiUrl}/api/resume-writer/generate-resume`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });
      // 发送请求到服务端
      console.log('准备发送的FormData内容:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.log('FormData keys:', Array.from(formData.keys()));
      

      if (!response.ok) {
        const errorText = await response.text();
        console.error('请求失败详情:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(`CV生成失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 判断响应类型
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        console.log('接收到流式响应');
        return response.body;
      } else {
        console.log('接收到普通响应');
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error('生成简历时出错:', error);
      throw error;
    }
  },

  /**
   * 推荐信生成API - 推荐信助理第一步
   * 功能：基于推荐信素材文件、写作需求和支持文件，生成推荐信内容
   * 输入：推荐信素材文件 + 写作需求 + 支持文件（可选）+ 自定义提示词（可选）
   * 输出：生成的推荐信内容（中英文版本）
   */
  async generateRecommendationLetter(
    resumeMaterial: File, 
    writingRequirements: string,
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
      console.log("支持文件数量:", supportFiles.length);
      console.log("写作需求:", writingRequirements);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt
      });

      // 创建FormData对象用于上传文件
      const formData = new FormData();
      formData.append('recommendation_material', resumeMaterial, resumeMaterial.name);
      
      // 添加支持文件
      if (supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append('support_files', file, file.name);
          console.log(`添加支持文件${index+1}: ${file.name}`);
        });
      }
      
      // 添加写作需求和自定义提示词
      formData.append('writing_requirements', writingRequirements);
      formData.append('custom_role_prompt', customRolePrompt);
      formData.append('custom_task_prompt', customTaskPrompt);
      formData.append('custom_output_format_prompt', customOutputFormatPrompt);

      // 清空本地模拟数据支持后添加详细日志
      console.log("准备发送推荐信生成请求...");
      console.log("完整API地址:", `${apiUrl}/api/recommendation-letter/generate-letter`);
      console.log("请求方法:", "POST");
      console.log("请求头:", { "X-API-Key": apiKey ? "有效" : "无效" });
      
      // 打印表单数据内容
      console.log("===== FormData 字段详情 =====");
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File类型 - 名称: ${value.name}, 大小: ${value.size} bytes, 类型: ${value.type}`);
        } else {
          console.log(`${key}: 字符串类型 - 值: ${value}`);
        }
      }
      console.log("===========================");

      // 使用正确的API端点路径
      const response = await fetch(`${apiUrl}/api/recommendation-letter/generate-letter`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });

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
              throw new Error(`推荐信生成失败: 请求缺少必要字段 - ${missingFields}`);
            }
          } catch (parseError) {
            // JSON解析失败，使用原始错误信息
            console.error("解析错误响应失败:", parseError);
          }
        }
        throw new Error(`推荐信生成失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // 判断响应类型
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        console.log('接收到流式响应');
        return response.body;
      } else {
        console.log('接收到普通响应');
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error('生成推荐信时出错:', error);
      throw error;
    }
  },

  /**
   * 简历格式化API - CV助理第二步
   * 功能：对原始简历文本进行格式化和优化
   * 输入：原始简历文本 + 自定义提示词（可选）
   * 输出：格式化后的简历
   */
  async formatResume(
    rawResume: string,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("=============简历格式化请求配置=============");
      console.log("API URL:", `${apiUrl}/api/resume-writer/format-resume`);
      console.log("API Key存在:", !!apiKey);
      console.log("原始简历内容长度:", rawResume.length);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append('raw_resume', rawResume);
      formData.append('custom_role_prompt', customRolePrompt);
      formData.append('custom_task_prompt', customTaskPrompt);
      formData.append('custom_output_format_prompt', customOutputFormatPrompt);

      // 打印上传的表单数据
      console.log("=============FormData内容=============");
      for (let [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.length > 500) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log("======================================");

      const response = await fetch(`${apiUrl}/api/resume-writer/format-resume`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error("Format Resume response status:", response.status);
        console.error("Format Resume response status text:", response.statusText);
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

      // 检查响应类型
      const contentType = response.headers.get('content-type');
      console.log("响应Content-Type:", contentType);
      
      if (contentType && contentType.includes('text/event-stream')) {
        console.log("检测到SSE流式响应");
      } else {
        console.log("检测到普通响应");
      }

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error("Format Resume API error:", error);
      throw error;
    }
  },

  /**
   * 推荐信格式化API - 推荐信助理第二步
   * 功能：对原始推荐信文本进行格式化和优化
   * 输入：原始推荐信文本 + 自定义提示词（可选）
   * 输出：格式化后的推荐信
   */
  async formatRecommendationLetter(
    rawLetter: string,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("准备格式化推荐信, API地址:", apiUrl);
      console.log("原始推荐信内容长度:", rawLetter.length);
      console.log("自定义提示词:", {
        role: customRolePrompt,
        task: customTaskPrompt,
        outputFormat: customOutputFormatPrompt
      });

      // 创建FormData对象
      const formData = new FormData();
      formData.append('raw_letter', rawLetter);
      formData.append('custom_role_prompt', customRolePrompt);
      formData.append('custom_task_prompt', customTaskPrompt);
      formData.append('custom_output_format_prompt', customOutputFormatPrompt);

      // 打印上传的表单数据
      for (let [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.length > 500) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await fetch(`${apiUrl}/api/recommendation-letter/format-letter`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error("Format Letter response status:", response.status);
        console.error("Format Letter response status text:", response.statusText);
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

      return response.body as ReadableStream<Uint8Array>;
    } catch (error) {
      console.error("Format Letter API error:", error);
      throw error;
    }
  }
};

export type { AxiosResponse, AxiosError } from "axios";

/**
 * 学习计划分析API - 学习规划助理
 * 功能：基于用户背景信息分析并生成学习计划建议
 * 输入：用户背景信息 + 提示词类型
 * 输出：学习计划分析结果和学校推荐
 */
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

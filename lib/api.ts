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

  // 简历生成API
  async generateResume(resumeMaterial: File, supportFiles: File[] = []) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("准备生成简历, API地址:", apiUrl);
      console.log("简历素材文件:", resumeMaterial.name);
      console.log("支持文件数量:", supportFiles.length);

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

      // 检查开发环境模式
      if (process.env.NODE_ENV === "development" && (apiUrl.includes("localhost") || !apiKey)) {
        console.warn("开发环境: 使用模拟数据生成简历");
        
        return new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            let mockData = "# 简历优化报告\n\n";
            mockData += "## 总体评价\n\n";
            mockData += "您的简历展示了扎实的教育背景和丰富的项目经验。然而，内容可以进一步优化以更好地突出您的技能和成就。\n\n";
            mockData += "## 优势\n\n";
            mockData += "1. 教育背景清晰展示\n";
            mockData += "2. 包含多个相关项目经验\n";
            mockData += "3. 技能部分涵盖了多种技术\n\n";
            mockData += "## 需要改进的地方\n\n";
            mockData += "1. 成就陈述应更加具体，包含量化的结果\n";
            mockData += "2. 简历格式需要更加一致\n";
            mockData += "3. 可以添加更多关键词以通过ATS系统\n\n";
            mockData += "## 详细建议\n\n";
            mockData += "### 1. 教育部分\n";
            mockData += "- 添加GPA和相关课程\n";
            mockData += "- 突出任何相关的学术成就\n\n";
            mockData += "### 2. 工作经验\n";
            mockData += "- 使用STAR方法重写成就\n";
            mockData += "- 每个经验点添加量化结果\n\n";
            mockData += "### 3. 技能部分\n";
            mockData += "- 根据目标职位调整技能优先级\n";
            mockData += "- 分类展示技术技能、软技能和语言能力\n\n";
            mockData += "## 改进后的简历示例\n\n";
            mockData += "在此基础上，我建议对您的简历进行以下修改，以提高其在申请过程中的竞争力...";
            
            // 模拟流式响应
            const sendChunk = (text: string, index: number) => {
              if (index < text.length) {
                const chunk = text.slice(index, index + 15);
                controller.enqueue(encoder.encode(chunk));
                setTimeout(() => sendChunk(text, index + 15), 50);
              } else {
                controller.close();
              }
            };
            
            sendChunk(mockData, 0);
          }
        });
      }

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

  // 生成推荐信
  async generateRecommendationLetter(
    resumeMaterial: File, 
    writingRequirements: string,
    supportFiles: File[] = []
  ) {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();

      console.log("准备生成推荐信, API地址:", apiUrl);
      console.log("推荐信素材文件:", resumeMaterial.name);
      console.log("支持文件数量:", supportFiles.length);
      console.log("写作需求:", writingRequirements);

      // 创建FormData对象用于上传文件
      const formData = new FormData();
      // 使用recommendation_material作为推荐信素材文件字段名
      formData.append('recommendation_material', resumeMaterial, resumeMaterial.name);
      
      // 添加支持文件，使用support_files作为字段名
      if (supportFiles.length > 0) {
        supportFiles.forEach((file, index) => {
          formData.append('support_files', file, file.name);
          console.log(`添加支持文件${index+1}: ${file.name}`);
        });
      }
      
      // 使用writing_requirements作为写作需求字段名
      formData.append('writing_requirements', writingRequirements);

      // 检查开发环境模式
      if (process.env.NODE_ENV === "development" && (apiUrl.includes("localhost") || !apiKey)) {
        console.warn("开发环境: 使用模拟数据生成推荐信");
        
        // 检查是否真的处于开发环境
        console.log("环境检查:", {
          NODE_ENV: process.env.NODE_ENV,
          apiUrl: apiUrl,
          isLocalhost: apiUrl.includes("localhost"),
          hasApiKey: !!apiKey
        });
        
        console.log("===== 开发环境模拟字段 =====");
        console.log("recommendation_material:", resumeMaterial.name);
        console.log("writing_requirements:", writingRequirements);
        if (supportFiles.length > 0) {
          console.log("support_files:", supportFiles.map(f => f.name).join(', '));
        }
        console.log("==============================");
        
        return new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            
            const professorName = "Professor Name";
            const professorTitle = "Professor";
            const institution = "University";
            
            let mockData = "# 推荐信\n\n";
            // 添加写作需求信息到模拟数据
            mockData += `## 根据您的要求生成的推荐信\n\n`;
            mockData += `您的写作需求: ${writingRequirements || "未提供具体要求"}\n\n`;
            mockData += `上传的推荐信素材: ${resumeMaterial.name}\n`;
            if (supportFiles.length > 0) {
              mockData += `额外支持材料: ${supportFiles.map(f => f.name).join(', ')}\n\n`;
            }
            mockData += "\n### 英文版本\n\n";
            mockData += `Dear Admissions Committee,\n\n`;
            mockData += `I am writing this letter in strong support of [Student Name]'s application to your graduate program. As a ${professorTitle || "Professor"} at ${institution || "University"}, I have had the pleasure of knowing [Student Name] for the past two years, during which time they have taken several of my courses and worked as a research assistant in my laboratory.\n\n`;
            mockData += `[Student Name] is undoubtedly among the top 5% of students I have encountered in my ${Math.floor(Math.random() * 10) + 10} years of teaching. Their academic excellence is demonstrated not only by their impressive GPA but also by the quality of their work and their intellectual curiosity.\n\n`;
            mockData += `What sets [Student Name] apart is their exceptional ability to apply theoretical knowledge to practical problems. In my Advanced Research Methods course, they designed and executed a sophisticated research project that explored [specific research area]. The resulting paper was of such high quality that it was accepted for presentation at [Conference Name], which is unusual for undergraduate work.\n\n`;
            mockData += `Beyond their academic achievements, [Student Name] possesses remarkable personal qualities. They are diligent, responsible, and collaborate effectively with peers. Their communication skills are excellent, allowing them to present complex ideas clearly to diverse audiences.\n\n`;
            mockData += `In conclusion, I give [Student Name] my highest recommendation without any reservation. They have the intelligence, work ethic, and character to succeed in your program and make significant contributions to the field. I am confident they will be an outstanding addition to your academic community.\n\n`;
            mockData += `Should you require any additional information, please do not hesitate to contact me.\n\n`;
            mockData += `Sincerely,\n\n`;
            mockData += `${professorName}\n`;
            mockData += `${professorTitle || "Professor"}\n`;
            mockData += `${institution || "University"}\n\n`;
            
            mockData += "### 中文版本\n\n";
            mockData += `尊敬的招生委员会：\n\n`;
            mockData += `我写此信是为了强烈支持[学生姓名]申请贵校的研究生项目。作为${institution || "大学"}的${professorTitle || "教授"}，在过去的两年中，我有幸认识[学生姓名]，在此期间，他/她参加了我的几门课程，并在我的实验室担任研究助理。\n\n`;
            mockData += `[学生姓名]无疑是我在${Math.floor(Math.random() * 10) + 10}年教学生涯中遇到的前5%的学生。他/她的学术卓越不仅体现在令人印象深刻的GPA上，还体现在工作质量和求知欲上。\n\n`;
            mockData += `[学生姓名]的与众不同之处在于他/她将理论知识应用于实际问题的非凡能力。在我的高级研究方法课程中，他/她设计并执行了一个复杂的研究项目，探索了[特定研究领域]。最终的论文质量如此之高，以至于被[会议名称]接受发表，这对本科生的工作来说是不寻常的。\n\n`;
            mockData += `除了学术成就外，[学生姓名]还拥有非凡的个人品质。他/她勤奋、负责，能与同伴有效合作。他/她的沟通能力出色，能够向不同的听众清晰地呈现复杂的想法。\n\n`;
            mockData += `总之，我毫无保留地给予[学生姓名]我最高的推荐。他/她拥有在贵校项目中取得成功并对该领域做出重大贡献的智慧、工作道德和品格。我相信他/她将成为贵校学术社区的杰出一员。\n\n`;
            mockData += `如果您需要任何其他信息，请随时与我联系。\n\n`;
            mockData += `此致\n\n`;
            mockData += `${professorName}\n`;
            mockData += `${professorTitle || "教授"}\n`;
            mockData += `${institution || "大学"}\n\n`;
            
            // 模拟流式响应
            const sendChunk = (text: string, index: number) => {
              if (index < text.length) {
                const chunk = text.slice(index, index + 15);
                controller.enqueue(encoder.encode(chunk));
                setTimeout(() => sendChunk(text, index + 15), 50);
              } else {
                controller.close();
              }
            };
            
            sendChunk(mockData, 0);
          }
        });
      }

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
              .filter(err => err.type === "missing")
              .map(err => err.loc[err.loc.length - 1])
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

  // 简历格式化API
  async formatResume(
    rawResume: string,
    customRolePrompt: string = "",
    customTaskPrompt: string = "",
    customOutputFormatPrompt: string = ""
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const apiKey = getApiKey();
      const apiUrl = getApiUrl();
      
      console.log("准备格式化简历, API地址:", apiUrl);
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
      for (let [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.length > 500) {
          console.log(`${key}: String - ${value.length} 字符 (前50字符: ${value.substring(0, 50)}...)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

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

      return response.body as ReadableStream<Uint8Array>;
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

import { getApiKey, getApiUrl, axiosInstance } from "../common/config";
import axios from "axios"; // 引入axios用于axios.isAxiosError

// 基础查询API
export async function query(queryText: string, metadata?: any) {
  try {
    const response = await axiosInstance.post("/api/query", {
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
}

// 流式查询API
export async function streamQuery(
  queryText: string,
  metadata?: any,
  files?: File[],
  transcriptFiles?: File[],
  materialDoc?: string // 新增：粘贴的文档内容
) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    console.log("尝试连接API:", apiUrl);
    console.log("API密钥存在:", !!apiKey);
    console.log("初稿文件数量:", files?.length || 0);
    console.log("成绩单文件数量:", transcriptFiles?.length || 0);
    console.log("粘贴文档内容长度:", materialDoc?.length || 0);

    // 设置请求超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    // 检查是否有文件需要上传或粘贴内容
    const hasFiles =
      (files && files.length > 0) ||
      (transcriptFiles && transcriptFiles.length > 0) ||
      (materialDoc && typeof materialDoc === 'string' && materialDoc.trim());

    // 🔍 添加详细的调试日志
    console.log("🔍 hasFiles 判断详情:", {
      hasFiles,
      filesLength: files?.length || 0,
      transcriptFilesLength: transcriptFiles?.length || 0,
      materialDocType: typeof materialDoc,
      materialDocLength: materialDoc?.length || 0,
      materialDocTrimmed: materialDoc && typeof materialDoc === 'string' ? materialDoc.trim().length : 0,
      conditions: {
        hasRegularFiles: !!(files && files.length > 0),
        hasTranscriptFiles: !!(transcriptFiles && transcriptFiles.length > 0),
        hasMaterialDoc: !!(materialDoc && typeof materialDoc === 'string' && materialDoc.trim())
      }
    });

    // 根据是否有文件选择不同的请求方式
    let response;

    if (hasFiles) {
      console.log("🚀 使用文件上传端点: /api/ps-initial-draft/simplify-material");
      
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

      // 添加粘贴的文档内容
      if (materialDoc && typeof materialDoc === 'string' && materialDoc.trim()) {
        formData.append("material_doc", materialDoc);
        console.log(`添加粘贴文档内容: ${materialDoc.length} 字符`);
      }

      // 添加成绩单文件 - 可以有多个
      if (transcriptFiles && transcriptFiles.length > 0) {
        transcriptFiles.forEach((file) => {
          formData.append("transcript_files", file, file.name);
          console.log(`添加成绩单文件: ${file.name} (${file.size} bytes)`);
        });
      }

      // 使用文件上传专用端点
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
    } else {
      // 没有文件或粘贴内容时，抛出错误
      throw new Error("请上传文件或粘贴文档内容");
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
}

import { getApiKey, getApiUrl } from "../common/config";

// 套瓷助理专用API - 用于学术套瓷和教授联系
export async function streamNetworkingQuery(queryText: string, files?: File[]) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    console.log("套瓷助理API调用:", {
      url: `${apiUrl}/api/academic-networking`,
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
}

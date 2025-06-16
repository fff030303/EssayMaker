import { getApiKey, getApiUrl } from "../common/config";

// 生成推荐信
export async function generateRecommendationLetter(
  resumeMaterial: File | null,
  writing_requirements: string,
  recommenderNumber: string,
  supportFiles: File[] = [],
  customRolePrompt: string = "",
  customTaskPrompt: string = "",
  customOutputFormatPrompt: string = "",
  materialDoc: string = ""
) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    // console.log("准备生成推荐信, API地址:", apiUrl);
    // console.log("推荐信素材文件:", resumeMaterial?.name || "无文件");
    // console.log("推荐人数量:", recommenderNumber);
    // console.log("支持文件数量:", supportFiles.length);
    // console.log("粘贴文档内容长度:", materialDoc.length);
    // console.log("写作需求:", writing_requirements);
    // console.log("自定义提示词:", {
    //   role: customRolePrompt,
    //   task: customTaskPrompt,
    //   outputFormat: customOutputFormatPrompt,
    // });
    // 创建FormData对象用于上传文件
    const formData = new FormData();
    
    // 只在有文件时添加 recommendation_material
    if (resumeMaterial) {
      formData.append(
        "recommendation_material",
        resumeMaterial,
        resumeMaterial.name
      );
    }

    // 添加粘贴的文档内容
    if (materialDoc) {
      formData.append("material_doc", materialDoc);
    }

    // 添加支持文件，使用support_files作为字段名
    if (supportFiles.length > 0) {
      supportFiles.forEach((file, index) => {
        formData.append("support_files", file, file.name);
        // console.log(`添加支持文件${index + 1}: ${file.name}`);
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
          // console.error("解析错误响应失败:", parseError);
        }
      }
      throw new Error(
        `推荐信生成失败: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // 判断响应类型
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("text/event-stream")) {
      // console.log("接收到流式响应");
      return response.body;
    } else {
      // console.log("接收到普通响应");
      const text = await response.text();
      return text;
    }
  } catch (error) {
    // console.error("生成推荐信时出错:", error);
    throw error;
  }
}

// 推荐信格式化API
export async function formatRecommendationLetter(
  rawLetter: string,
  customRolePrompt: string = "",
  customTaskPrompt: string = "",
  customOutputFormatPrompt: string = "",
  writing_requirements: string = ""
) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    // console.log("准备格式化推荐信, API地址:", apiUrl);
    // console.log("原始推荐信内容长度:", rawLetter.length);
    // console.log("写作需求:", writing_requirements);
    // console.log("自定义提示词:", {
    //   role: customRolePrompt,
    //   task: customTaskPrompt,
    //   outputFormat: customOutputFormatPrompt,
    // });
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
        // console.log(
        //   `${key}: String - ${value.length} 字符 (前50字符: ${value.substring(
        //     0,
        //     50
        //   )}...)`
        // );
      } else {
        // console.log(`${key}: ${value}`);
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
      // console.error("Format Letter response status:", response.status);
      // console.error("Format Letter response status text:", response.statusText);
      // console.error(
      //   "Format Letter response headers:",
      //   Object.fromEntries(response.headers)
      // );

      const errorText = await response
        .text()
        .catch(() => "No error text available");
      // console.error("Format Letter error details:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }

    // 判断响应类型
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("text/event-stream")) {
      // console.log("接收到流式响应");
      return response.body;
    } else {
      // console.log("接收到普通响应");
      const text = await response.text();
      return text;
    }
  } catch (error) {
    // console.error("Format Letter API error:", error);
    throw error;
  }
}

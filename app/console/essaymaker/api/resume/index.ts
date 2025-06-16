import { getApiKey, getApiUrl } from "../common/config";

// 简历生成API
export async function generateResume(
  resumeMaterial: File | null,
  supportFiles: File[] = [],
  materialDoc: string = "",
  customRolePrompt: string = "",
  customTaskPrompt: string = "",
  customOutputFormatPrompt: string = ""
) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    console.log("准备生成简历, API地址:", apiUrl);
    console.log("简历材料文件:", resumeMaterial?.name || "无文件");
    console.log("支持文件数量:", supportFiles.length);
    console.log("粘贴文档内容长度:", materialDoc.length);
    console.log("自定义提示词:", {
      role: customRolePrompt,
      task: customTaskPrompt,
      outputFormat: customOutputFormatPrompt,
    });

    // 创建FormData对象
    const formData = new FormData();
    
    // 根据模式决定传递哪个参数，不能同时传递
    if (materialDoc && materialDoc.trim()) {
      // 粘贴模式：只传递文档内容
      formData.append("material_doc", materialDoc);
      console.log("使用粘贴模式：material_doc");
    } else if (resumeMaterial) {
      // 文件模式：只传递文件
      formData.append("resume_material", resumeMaterial);
      console.log("使用文件模式：resume_material");
    }

    // 添加自定义提示词参数
    formData.append("custom_role_prompt", customRolePrompt);
    formData.append("custom_task_prompt", customTaskPrompt);
    formData.append("custom_output_format_prompt", customOutputFormatPrompt);

    // 添加支持文件
    supportFiles.forEach((file, index) => {
      formData.append(`support_files`, file);
      console.log(`支持文件 ${index + 1}:`, file.name);
    });

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
}

// 简历格式化API
export async function formatResume(
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
}

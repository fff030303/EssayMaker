import { getApiKey, getApiUrl } from "../common/config";

// 个人陈述修改流式API
export async function streamPSRevision(data: {
  original_ps: string;
  program_info: string;
}) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    // console.log("PS Revision request configuration:", {
    //   url: `${apiUrl}/api/ps-revision`,
    //   apiKeyPresent: !!apiKey,
    //   dataLength: {
    //     original_ps: data.original_ps.length,
    //     program_info: data.program_info.length,
    //   },
    // });
    const response = await fetch(`${apiUrl}/api/ps-revision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // console.error("PS Revision response status:", response.status);
      // console.error("PS Revision response status text:", response.statusText);
      // console.error(
      //   "PS Revision response headers:",
      //   Object.fromEntries(response.headers)
      // );

      const errorText = await response
        .text()
        .catch(() => "No error text available");
      // console.error("PS Revision error details:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }

    return response.body;
  } catch (error) {
    // console.error("PS Revision API error:", error);
    throw error;
  }
}

// 最终文章生成流式API
export async function streamFinalPS(data: {
  program_info: string;
  original_ps: string;
  rewrite_strategy: string;
}) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    // console.log("Final PS request configuration:", {
    //   url: `${apiUrl}/api/ps-final`,
    //   apiKeyPresent: !!apiKey,
    //   dataLength: {
    //     program_info: data.program_info.length,
    //     original_ps: data.original_ps.length,
    //     rewrite_strategy: data.rewrite_strategy.length,
    //   },
    // });
    const response = await fetch(`${apiUrl}/api/ps-final`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // console.error("Final PS response status:", response.status);
      // console.error("Final PS response status text:", response.statusText);
      // console.error(
      //   "Final PS response headers:",
      //   Object.fromEntries(response.headers)
      // );

      const errorText = await response
        .text()
        .catch(() => "No error text available");
      // console.error("Final PS error details:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }

    return response.body;
  } catch (error) {
    // console.error("Final PS API error:", error);
    throw error;
  }
}

// 添加一个新的最终初稿生成流式API，适应新的API格式
export async function streamFinalDraftWithFiles(params: {
  simplified_material: string;
  transcript_analysis?: string; // 修改为成绩单解析文本而不是文件
  combined_requirements: string;
}) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    // console.log("=============初稿生成请求配置=============");
    // console.log("API URL:", `${apiUrl}/api/ps-initial-draft/generate-content`);
    // console.log("API Key存在:", !!apiKey);
    // console.log("简化素材长度:", params.simplified_material.length);
    // console.log("成绩单解析长度:", params.transcript_analysis?.length || 0);
    // console.log("需求信息长度:", params.combined_requirements.length);
    // 使用FormData格式提交
    const formData = new FormData();

    // 添加简化的素材
    formData.append("simplified_material", params.simplified_material);
    // console.log(
    //   "【素材内容前200字符】:",
    //   params.simplified_material.substring(0, 200) + "..."
    // );
    // 添加申请方向+定制需求
    formData.append("combined_requirements", params.combined_requirements);
    // console.log("【申请需求完整内容】:", params.combined_requirements);
    // 添加成绩单解析结果（如果有）
    if (params.transcript_analysis) {
      formData.append("transcript_analysis", params.transcript_analysis);
      // console.log(
      //   "【成绩单解析前200字符】:",
      //   params.transcript_analysis.substring(0, 200) + "..."
      // );
    } else {
      // console.log("【未提供成绩单解析】");
    }

    // console.log("=============FormData内容=============");
    // 打印上传的表单数据
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        // console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
      } else if (typeof value === "string" && value.length > 500) {
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
    // console.log("======================================");
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
      // console.error("Final Draft response status:", response.status);
      // console.error("Final Draft response status text:", response.statusText);
      // console.error(
      //   "Final Draft response headers:",
      //   Object.fromEntries(response.headers)
      // );

      const errorText = await response
        .text()
        .catch(() => "No error text available");
      // console.error("Final Draft error details:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${errorText}`
      );
    }

    return response.body;
  } catch (error) {
    // console.error("Final Draft API error:", error);
    throw error;
  }
}

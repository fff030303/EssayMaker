import { getApiKey, getApiUrl } from "../common/config";

// PS分稿助理专用API - 只调用搜索分析（第一步）
export async function streamSectionalQuery(
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
    return await streamEssayRewriteSearchAndAnalyze(
      searchUserInput,
      supportFiles
    );
  } catch (error) {
    console.error("PS分稿助理API调用失败:", error);
    throw error;
  }
}

// 第一步：Essay重写搜索分析API
export async function streamEssayRewriteSearchAndAnalyze(
  userInput: string,
  supportFiles: File[] = [],
  customWebSearcherRole: string = "",
  customWebSearcherTask: string = "",
  customWebSearcherOutputFormat: string = "",
  personalizationRequirements: string = ""
) {
  try {
    const apiKey = getApiKey();
    const apiUrl = getApiUrl();

    console.log("Essay重写搜索分析API调用:", {
      url: `${apiUrl}/api/ps-final-draft/search-and-analyze`,
      userInputLength: userInput.length,
      supportFilesCount: supportFiles.length,
      hasCustomPrompts: !!(
        customWebSearcherRole ||
        customWebSearcherTask ||
        customWebSearcherOutputFormat
      ),
      hasPersonalizationRequirements: !!personalizationRequirements,
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
    formData.append(
      "custom_web_searcher_output_format",
      customWebSearcherOutputFormat
    );
    formData.append(
      "personalization_requirements",
      personalizationRequirements
    );

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
}

// 第二步：Essay重写策略生成API
export async function streamEssayRewriteGenerateStrategy(
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
      hasCustomPrompts: !!(
        customStrategyGeneratorRole ||
        customStrategyGeneratorTask ||
        customStrategyGeneratorOutputFormat
      ),
      hasPersonalizationRequirements: !!personalizationRequirements,
    });

    // 创建FormData对象
    const formData = new FormData();

    // 添加必需参数
    formData.append("search_result", searchResult);
    formData.append(
      "original_essay_file",
      originalEssayFile,
      originalEssayFile.name
    );

    // 添加可选参数
    formData.append("analysis_result", analysisResult);

    // 添加自定义提示词参数
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
    formData.append(
      "personalization_requirements",
      personalizationRequirements
    );

    // 打印FormData内容用于调试
    console.log("Essay重写策略生成FormData内容:");
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
      console.error("Essay重写策略生成API错误:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(
        `Essay重写策略生成失败: ${response.status} - ${errorText}`
      );
    }

    return response.body;
  } catch (error) {
    console.error("Essay重写策略生成API调用失败:", error);
    throw error;
  }
}

// 第三步：Essay重写API
export async function streamEssayRewriteRewriteEssay(
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
      hasCustomPrompts: !!(
        customEssayRewriterRole ||
        customEssayRewriterTask ||
        customEssayRewriterOutputFormat
      ),
    });

    // 创建FormData对象
    const formData = new FormData();

    // 添加必需参数
    formData.append("rewrite_strategy", rewriteStrategy);
    formData.append(
      "original_essay_file",
      originalEssayFile,
      originalEssayFile.name
    );

    // 添加自定义提示词参数
    formData.append("custom_essay_rewriter_role", customEssayRewriterRole);
    formData.append("custom_essay_rewriter_task", customEssayRewriterTask);
    formData.append(
      "custom_essay_rewriter_output_format",
      customEssayRewriterOutputFormat
    );

    // 打印FormData内容用于调试
    console.log("Essay重写FormData内容:");
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
        errorText,
      });
      throw new Error(`Essay重写失败: ${response.status} - ${errorText}`);
    }

    return response.body;
  } catch (error) {
    console.error("Essay重写API调用失败:", error);
    throw error;
  }
}

// Essay重写策略生成API
export async function generateEssayRewriteStrategy(
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
}

import axios from "axios";

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

export { getApiKey, getApiUrl };

export const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": getApiKey(),
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
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

/**
 * Cotton Upto 助手常量配置
 */

// 文件上传配置
export const FILE_CONFIG = {
  ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xls', 'xlsx'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 5,
  PRIMARY_FILE_TYPES: ['pdf', 'doc', 'docx', 'txt'],
  SUPPORT_FILE_TYPES: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xls', 'xlsx'],
} as const;

// 文本输入配置
export const TEXT_CONFIG = {
  MIN_INPUT_LENGTH: 10,
  MAX_INPUT_LENGTH: 5000,
  MAX_PERSONALIZATION_LENGTH: 1000,
  MAX_PASTE_LENGTH: 10000,
  DEFAULT_PLACEHOLDER: '请描述您的内容生成需求...',
} as const;

// API 配置
export const API_CONFIG = {
  REQUEST_TIMEOUT: 30000,
  MAX_RETRY_COUNT: 3,
  RETRY_INTERVAL: 1000,
  STREAM_TIMEOUT: 60000,
} as const;

// 错误信息配置
export const ERROR_MESSAGES = {
  EMPTY_INPUT: '请输入内容需求',
  INPUT_TOO_SHORT: '内容描述至少需要10个字符',
  INPUT_TOO_LONG: '内容描述不能超过5000个字符',
  NO_FILE_OR_TEXT: '请上传文件或粘贴内容',
  FILE_TOO_LARGE: '文件大小不能超过10MB',
  INVALID_FILE_TYPE: '不支持的文件类型',
  TOO_MANY_FILES: '最多只能上传5个文件',
  NETWORK_ERROR: '网络连接失败，请检查网络状态',
  SERVER_ERROR: '服务器错误，请稍后重试',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  UNKNOWN_ERROR: '发生未知错误，请联系技术支持',
} as const; 
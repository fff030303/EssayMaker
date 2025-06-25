/**
 * Cotton Upto 助手工具函数
 *
 * 功能：提供各种实用工具函数
 *
 * 核心功能：
 * 1. 文本处理：
 *    - 内容格式化
 *    - 文本截取
 *    - 字符统计
 *
 * 2. 文件处理：
 *    - 文件类型判断
 *    - 文件大小格式化
 *    - 文件名处理
 *
 * 3. 数据验证：
 *    - 输入验证
 *    - 格式检查
 *    - 类型判断
 *
 * @author EssayMaker Team
 * @version 1.0.0
 */

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 截取文本并添加省略号
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// 验证文件类型
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension || '');
}

// 获取文件类型描述
export function getFileTypeDescription(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'PDF 文档';
    case 'doc':
    case 'docx':
      return 'Word 文档';
    case 'txt':
      return '文本文件';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '图片文件';
    case 'xls':
    case 'xlsx':
      return 'Excel 表格';
    default:
      return '未知文件类型';
  }
}

// 生成唯一ID
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 深拷贝对象
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const cloned = {} as any;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      if (timeout) clearTimeout(timeout);
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 检查是否为空值
export function isEmpty(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
}

// 格式化时间戳
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// 计算文本相似度（简单版本）
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const allWords = new Set([...words1, ...words2]);
  const vector1: number[] = [];
  const vector2: number[] = [];
  
  allWords.forEach(word => {
    vector1.push(words1.filter(w => w === word).length);
    vector2.push(words2.filter(w => w === word).length);
  });
  
  // 计算余弦相似度
  const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

// 提取关键词（简单版本）
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // 简单的关键词提取，基于词频
  const words = text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '') // 只保留中文、英文、数字和空格
    .split(/\s+/)
    .filter(word => word.length > 1); // 过滤单字符
  
  const wordCount: { [key: string]: number } = {};
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// 验证输入内容
export function validateInput(input: string, minLength: number = 10): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!input || input.trim().length === 0) {
    errors.push('内容不能为空');
  } else if (input.trim().length < minLength) {
    errors.push(`内容至少需要${minLength}个字符`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 安全的JSON解析
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
} 
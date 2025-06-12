/**
 * 文件验证工具函数
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (
  file: File,
  isOriginalFile: boolean = false
): FileValidationResult => {
  let allowedTypes: string[];
  let maxSize: number;

  if (isOriginalFile) {
    // 原始初稿文件只允许DOCX格式
    allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `文件 ${file.name} 类型不支持，初稿文件只支持DOCX格式`,
      };
    }
  } else {
    // 支持文件允许PDF、JPG、JPEG、PNG格式
    allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `文件 ${file.name} 类型不支持，支持文件只支持PDF、JPG、JPEG、PNG格式`,
      };
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件 ${file.name} 大小超过10MB限制`,
    };
  }

  return { isValid: true };
};

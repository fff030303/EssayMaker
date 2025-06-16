/**
 * 文件验证工具函数
 *
 * 用于PS助理的文件上传验证和格式化
 */

// 支持的文件格式
export const DRAFT_FILE_TYPES = [".docx"]; // 个人陈述素材表只支持docx
export const OTHER_FILE_TYPES = [".pdf", ".jpg", ".jpeg", ".png"]; // 成绩单支持pdf和图片格式

// 文件格式验证函数
export const validateDraftFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const isValid = DRAFT_FILE_TYPES.some((type) => fileName.endsWith(type));
  // console.log("验证个人陈述素材表文件:", {
  //   originalFileName: file.name,
  //   fileName: file.name,
  //   lowerCaseName: fileName,
  //   fileType: file.type,
  //   fileSize: file.size,
  //   supportedTypes: DRAFT_FILE_TYPES,
  //   checkResults: DRAFT_FILE_TYPES.map((type) => ({
  //     type,
  //     endsWith: fileName.endsWith(type),
  //   })),
  //   isValid,
  // });
  return isValid;
};

export const validateOtherFileType = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  const isValid = OTHER_FILE_TYPES.some((type) => fileName.endsWith(type));
  // console.log("验证成绩单文件:", {
  //   fileName: file.name,
  //   lowerCaseName: fileName,
  //   supportedTypes: OTHER_FILE_TYPES,
  //   isValid,
  // });
  return isValid;
};

// 获取文件扩展名
export const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().substring(fileName.lastIndexOf("."));
};

// 文件大小格式化函数
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

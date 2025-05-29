/**
 * 日志记录工具函数
 */

export function log(message: string, ...args: any[]): void {
  console.log(message, ...args);
}

export function error(message: string, ...args: any[]): void {
  console.error(message, ...args);
}

export function warn(message: string, ...args: any[]): void {
  console.warn(message, ...args);
}

export function info(message: string, ...args: any[]): void {
  console.info(message, ...args);
} 
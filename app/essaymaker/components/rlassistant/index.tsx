/**
 * RLAssistant 模块导出文件
 * 
 * 功能：统一导出推荐信助理相关的所有组件
 * 
 * 导出组件：
 * - RLAssistantMain：推荐信助理主界面组件
 * - RLFileUploadForm：文件上传表单组件
 * - RLGeneration：推荐信生成组件
 * - RLReportAndResumeDisplay：分析报告展示组件
 * - RLRequest：推荐信写作要求表单组件
 * 
 * 模块特性：
 * - 清晰的组件结构
 * - 统一的导入入口
 * - 便于维护和扩展
 * - 模块化设计
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

// 推荐信助理模块统一入口文件
// 导出所有组件，使用清晰明确的命名

export { RLAssistantMain } from "./RLAssistantMain";
export { RLFileUploadForm } from "./RLFileUploadForm";
export { RLGeneration } from "./RLGeneration";
export { RLReportAndResumeDisplay } from "./RLAnalysisReportDisplay";
export { RLRequest } from "./RLRequest";

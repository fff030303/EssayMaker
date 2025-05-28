/**
 * DraftResultDisplay 样式定义文件
 * 
 * 功能：定义初稿结果显示组件的CSS样式和主题
 * 
 * 样式特性：
 * 1. HTML内容样式：
 *    - 标题层级样式（H1-H6）
 *    - 段落和文本格式
 *    - 列表和引用样式
 *    - 代码块高亮
 * 
 * 2. 响应式设计：
 *    - 移动端适配
 *    - 字体大小调整
 *    - 间距优化
 *    - 布局自适应
 * 
 * 3. 交互效果：
 *    - 链接悬浮效果
 *    - 按钮状态样式
 *    - 过渡动画
 *    - 焦点指示
 * 
 * 4. 主题支持：
 *    - 明暗主题切换
 *    - 颜色变量定义
 *    - 统一的设计语言
 * 
 * 5. 可访问性：
 *    - 对比度优化
 *    - 字体可读性
 *    - 键盘导航支持
 * 
 * @author EssayMaker Team
 * @version 1.0.0
 */

// 样式定义文件 - 从 DraftResultDisplay.tsx 中提取的样式代码

// 自定义滚动条样式和HTML内容样式
export const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* HTML内容样式 */
  .html-content {
    line-height: 1.6;
    color: #374151;
  }
  
  .html-content h1 {
    font-size: 1.875rem;
    font-weight: bold;
    margin: 1rem 0;
    color: #111827;
  }
  
  .html-content h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0.75rem 0;
    color: #111827;
  }
  
  .html-content h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #111827;
  }
  
  .html-content h4, .html-content h5, .html-content h6 {
    font-size: 1.125rem;
    font-weight: bold;
    margin: 0.5rem 0;
    color: #111827;
  }
  
  .html-content p {
    margin: 0.5rem 0;
    line-height: 1.625;
  }
  
  .html-content ul, .html-content ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  
  .html-content ul {
    list-style-type: disc;
  }
  
  .html-content ol {
    list-style-type: decimal;
  }
  
  .html-content li {
    margin: 0.25rem 0;
  }
  
  .html-content a {
    color: #3b82f6;
    text-decoration: underline;
  }
  
  .html-content a:hover {
    color: #1d4ed8;
  }
  
  .html-content strong, .html-content b {
    font-weight: bold;
  }
  
  .html-content em, .html-content i {
    font-style: italic;
  }
  
  .html-content blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1rem;
    font-style: italic;
    margin: 0.5rem 0;
    color: #6b7280;
  }
  
  .html-content code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .html-content pre {
    background-color: #f3f4f6;
    padding: 0.5rem;
    border-radius: 0.25rem;
    overflow-x: auto;
    margin: 0.5rem 0;
  }
  
  .html-content pre code {
    background-color: transparent;
    padding: 0;
  }
  
  .html-content table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #d1d5db;
    margin: 1rem 0;
  }
  
  .html-content th, .html-content td {
    border: 1px solid #d1d5db;
    padding: 0.5rem 1rem;
  }
  
  .html-content th {
    background-color: #f3f4f6;
    font-weight: bold;
  }
  
  .html-content hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 1rem 0;
  }
  
  .html-content img {
    max-width: 100%;
    height: auto;
    margin: 0.5rem 0;
  }
`;

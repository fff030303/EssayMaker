/**
 * 内容样式定义模块
 * 
 * 功能：定义内容渲染所需的全局样式
 * 
 * 包含：
 - 自定义滚动条样式
 - HTML内容样式
 - Markdown渲染样式
 */

export const globalContentStyles = `
  /* 自定义滚动条样式 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px !important;
    height: 4px !important;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent !important;
    border-radius: 4px !important;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.2) !important;
    border-radius: 4px !important;
    border: none !important;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.4) !important;
  }

  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent !important;
  }

  /* 为Firefox提供低调的滚动条样式 */
  .custom-scrollbar {
    scrollbar-width: thin !important;
    scrollbar-color: rgba(156, 163, 175, 0.2) transparent !important;
  }

  /* HTML内容样式 */
  .html-content {
    line-height: 1.6;
    color: #374151;
  }

  .html-content h1 {
    font-size: 1.25rem;
    font-weight: bold;
    margin: 1.5rem 0 1rem 0;
    color: #111827;
  }

  .html-content h2 {
    font-size: 1.125rem;
    font-weight: bold;
    margin: 1.25rem 0 0.75rem 0;
    color: #111827;
  }

  .html-content h3 {
    font-size: 1rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
    color: #111827;
  }

  .html-content h4,
  .html-content h5,
  .html-content h6 {
    font-size: 0.875rem;
    font-weight: bold;
    margin: 1rem 0 0.5rem 0;
    color: #111827;
  }

  .html-content p {
    margin-bottom: 1rem;
    line-height: 1.625;
  }

  .html-content ul,
  .html-content ol {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }

  .html-content ul {
    list-style-type: disc;
  }

  .html-content ol {
    list-style-type: decimal;
  }

  .html-content li {
    margin-bottom: 0.25rem;
  }

  .html-content a {
    color: #2563eb;
    text-decoration: underline;
  }

  .html-content a:hover {
    color: #1d4ed8;
  }

  .html-content strong,
  .html-content b {
    font-weight: bold;
  }

  .html-content em,
  .html-content i {
    font-style: italic;
  }

  .html-content blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1rem;
    font-style: italic;
    margin: 1rem 0;
    color: #6b7280;
  }

  .html-content code {
    background-color: #f3f4f6;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
      "Liberation Mono", Menlo, monospace;
    font-size: 0.875rem;
    color: #1f2937;
  }

  .html-content pre {
    background-color: #f3f4f6;
    padding: 0.75rem;
    border-radius: 0.375rem;
    overflow-x: auto;
    margin: 1rem 0;
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

  .html-content th,
  .html-content td {
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

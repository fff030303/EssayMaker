/**
 * DraftResultDisplay 全局样式定义
 * 包含所有 prose、滚动条和内容渲染相关的样式
 */

export const GLOBAL_STYLES = `
  .shadow-lg,
  .shadow-lg *,
  .shadow-lg .bg-gradient-to-br,
  .shadow-lg .bg-white,
  .shadow-lg .bg-muted {
    border: none !important;
    outline: none !important;
  }

  /* 移除所有可能的边框 */
  .card-no-border * {
    border: none !important;
    box-shadow: none !important;
  }

  /* 自定义滚动条样式 */
  .prose::-webkit-scrollbar {
    width: 6px;
  }
  .prose::-webkit-scrollbar-track {
    background: rgb(243, 244, 246);
    border-radius: 3px;
  }
  .prose::-webkit-scrollbar-thumb {
    background: rgb(156, 163, 175);
    border-radius: 3px;
    opacity: 0.7;
  }
  .prose::-webkit-scrollbar-thumb:hover {
    background: rgb(107, 114, 128);
    opacity: 1;
  }

  /* 内容区域滚动条样式 */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.4);
    border-radius: 3px;
  }
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.6);
  }
  .overflow-y-auto::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* 强制显示滚动条 */
  .content-scroll-container {
    overflow-y: auto !important;
    height: 100%;
    max-height: 600px;
    /* Firefox 滚动条样式 */
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
  }

  /* 确保flex容器高度正确 */
  .card-container {
    height: 100%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
  }

  .card-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  /* HTML内容样式 */
  .prose h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: rgb(30, 41, 59);
    margin: 2rem 0 1.5rem 0;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .prose h2 {
    font-size: 2rem;
    font-weight: 600;
    color: rgb(51, 65, 85);
    margin: 1.75rem 0 1rem 0;
    line-height: 1.3;
    letter-spacing: -0.015em;
  }

  .prose h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: rgb(71, 85, 105);
    margin: 1.5rem 0 0.75rem 0;
    line-height: 1.4;
  }

  .prose h4 {
    font-size: 1.25rem;
    font-weight: 600;
    color: rgb(100, 116, 139);
    margin: 1.25rem 0 0.5rem 0;
    line-height: 1.4;
  }

  .prose h5 {
    font-size: 1.125rem;
    font-weight: 600;
    color: rgb(100, 116, 139);
    margin: 1rem 0 0.5rem 0;
    line-height: 1.5;
  }

  .prose h6 {
    font-size: 1rem;
    font-weight: 600;
    color: rgb(100, 116, 139);
    margin: 1rem 0 0.5rem 0;
    line-height: 1.5;
  }

  .prose p {
    font-size: 1rem;
    line-height: 1.75;
    color: rgb(51, 65, 85);
    margin: 1rem 0;
  }

  .prose ul,
  .prose ol {
    margin: 1rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    font-size: 1rem;
    line-height: 1.75;
    color: rgb(51, 65, 85);
    margin: 0.5rem 0;
  }

  .prose a {
    color: rgb(59, 130, 246);
    text-decoration: underline;
    font-weight: 500;
  }

  .prose a:hover {
    color: rgb(37, 99, 235);
    text-decoration: none;
  }

  .prose blockquote {
    border-left: 4px solid rgb(219, 234, 254);
    background: rgb(248, 250, 252);
    padding: 1rem 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: rgb(71, 85, 105);
  }

  .prose code {
    background: rgb(243, 244, 246);
    color: rgb(147, 51, 234);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-family: "Fira Code", "Monaco", "Cascadia Code", "Roboto Mono",
      monospace;
  }

  .prose pre {
    background: rgb(15, 23, 42);
    color: rgb(226, 232, 240);
    padding: 1.5rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    font-size: 0.875rem;
    line-height: 1.7;
    font-family: "Fira Code", "Monaco", "Cascadia Code", "Roboto Mono",
      monospace;
  }

  .prose pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
  }

  .prose table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }

  .prose th,
  .prose td {
    border: 1px solid rgb(209, 213, 219);
    padding: 0.75rem 1rem;
    text-align: left;
  }

  .prose th {
    background: rgb(249, 250, 251);
    font-weight: 600;
    color: rgb(55, 65, 81);
  }

  .prose td {
    color: rgb(75, 85, 99);
  }

  .prose img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .prose hr {
    border: none;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgb(209, 213, 219),
      transparent
    );
    margin: 2rem 0;
  }

  .prose strong {
    font-weight: 700;
    color: rgb(30, 41, 59);
  }

  .prose em {
    font-style: italic;
    color: rgb(71, 85, 105);
  }
`;

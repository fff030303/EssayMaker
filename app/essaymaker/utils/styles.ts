// 滚动条样式
export const scrollbarStyles = `
  [class*='overflow-y-auto']::-webkit-scrollbar {
    width: 6px;
  }
  
  [class*='overflow-y-auto']::-webkit-scrollbar-track {
    background: transparent;
  }
  
  [class*='overflow-y-auto']::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 9999px;
  }
  
  [class*='overflow-y-auto']::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }

  .card-content {
    max-height: 100%;
    overflow-y: auto;
    position: relative;
  }

  .prose {
    position: relative;
    width: 100%;
    max-width: 100% !important;
  }

  .prose pre {
    max-width: 100%;
    overflow-x: auto;
  }

  .prose img {
    max-width: 100%;
    height: auto;
  }

  /* 允许textarea在需要时显示滚动条 */
  textarea.scrollable {
    overflow-y: auto !important;
  }
`;
